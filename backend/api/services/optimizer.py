"""
backend/api/services/optimizer.py
===================================
Pipeline service: AI demand prediction → QUBO construction → QAOA solve.

This module is the single source of truth for pipeline execution inside the
API.  It reuses every existing function unchanged:

    backend.ai.features          build_features(), chronological_split()
    backend.quantum.qubo         build_qubo(), QUBOProblem
    backend.optimization.classical_solver   PlacementProblem, solve_exhaustive()

The QAOA helpers are inlined here (same logic as experiments/05 and 08) because
those experiment scripts are standalone CLIs, not importable modules.

Import-order constraint
-----------------------
qiskit_aer patches numpy C-extensions on import, which corrupts pandas/pyarrow
CSV/parquet I/O if imported first.  All pandas work (data loading, feature
engineering, QUBO CSV writing) is completed before any Qiskit symbol is
imported.  The Qiskit imports live inside _solve_qaoa(), which is always called
after the data work is done.

Module-level cache
------------------
Loading demand_hourly.parquet (~120 MB) and the RF pipeline (~327 MB) on every
request would be unacceptable.  _PipelineCache holds them after the first
request and reuses them for all subsequent calls.  The cache is populated lazily
(on first POST /optimize) so the server starts instantly.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from backend.ai.features import (
    FEATURE_COLS,
    build_features,
    chronological_split,
)
from backend.quantum.qubo import build_qubo, QUBOProblem
from backend.optimization.classical_solver import PlacementProblem, solve_exhaustive

log = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
_ROOT         = Path(__file__).resolve().parents[3]   # project root
_PARQUET      = _ROOT / "data" / "processed" / "demand_hourly.parquet"
_ZONES_CSV    = _ROOT / "data" / "processed" / "candidate_zones.csv"
_DIST_CSV     = _ROOT / "data" / "processed" / "candidate_distance_matrix.csv"
_PIPELINE_PKL = _ROOT / "models" / "feature_pipeline.joblib"
_METRICS_JSON = _ROOT / "models" / "metrics.json"

# ── Zone mapping ──────────────────────────────────────────────────────────────
_LABEL_TO_TAZID: dict[str, int] = {
    "Z0": 1026, "Z1": 746, "Z2": 716, "Z3": 965,
    "Z4": 706,  "Z5": 745, "Z6": 744, "Z7": 737,
}
_CANDIDATE_TAZIDS = list(_LABEL_TO_TAZID.values())

# ── Known QUBO ground truth (qubo_validation.json — 9/9 checks passed) ───────
_QUBO_OPT_ZONES  = ["Z0", "Z2", "Z3"]
_QUBO_OPT_ENERGY = -139.697448
_QUBO_OPT_BITS   = "10110000"


# ─────────────────────────────────────────────────────────────────────────────
# Module-level cache
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class _PipelineCache:
    """Holds expensive-to-load artefacts across requests."""
    pipeline:      Any   = field(default=None)   # sklearn Pipeline
    demand_data:   pd.DataFrame = field(default=None)   # 8-zone parquet subset
    feature_frame: pd.DataFrame = field(default=None)   # build_features output
    test_frame:    pd.DataFrame = field(default=None)   # chronological test split
    model_metrics: dict = field(default_factory=dict)
    zones_df:      pd.DataFrame = field(default=None)   # candidate_zones.csv
    ready:         bool = field(default=False)


_cache = _PipelineCache()


def warm_up() -> None:
    """
    Pre-load the RF pipeline and feature data.  Called once at API startup
    (lifespan handler) so the first real request is fast.
    """
    if _cache.ready:
        return
    log.info("Pipeline warm-up: loading artefacts …")
    _load_cache()
    log.info("Pipeline warm-up complete.")


def _load_cache() -> None:
    """Populate _cache if not already ready.  NOT thread-safe for concurrent
    first-requests, but FastAPI workers are single-threaded per process and
    the worst case is double loading — which is harmless."""
    if _cache.ready:
        return

    import joblib

    log.info("Loading feature_pipeline.joblib …")
    _cache.pipeline = joblib.load(_PIPELINE_PKL)

    log.info("Loading model metrics …")
    _cache.model_metrics = json.loads(_METRICS_JSON.read_text())

    log.info("Loading demand_hourly.parquet (candidate zones only) …")
    df_all = pd.read_parquet(_PARQUET)
    _cache.demand_data = df_all[df_all["zone_id"].isin(_CANDIDATE_TAZIDS)].copy()

    log.info("Building feature matrix …")
    _cache.feature_frame = build_features(_cache.demand_data)

    log.info("Applying chronological split …")
    _, _, _cache.test_frame = chronological_split(_cache.feature_frame)

    log.info("Loading candidate zones CSV …")
    _cache.zones_df = pd.read_csv(_ZONES_CSV)

    _cache.ready = True
    log.info(
        "Cache ready — test split: %s → %s, %d rows, %d zones",
        _cache.test_frame["time"].min(),
        _cache.test_frame["time"].max(),
        len(_cache.test_frame),
        _cache.test_frame["zone_id"].nunique(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — AI demand prediction
# ─────────────────────────────────────────────────────────────────────────────

def _predict_demand() -> tuple[dict[str, float], dict]:
    """
    Run the RF pipeline on the test split and return per-zone mean predicted
    demand (kWh/h).

    Returns
    -------
    demand_by_label  : {"Z0": 3741.33, "Z1": 236.74, ...}
    ai_meta          : diagnostics dict included in the API response
    """
    _load_cache()

    test_df = _cache.test_frame
    X_test  = test_df[FEATURE_COLS].to_numpy(dtype=float)

    t0    = time.perf_counter()
    y_pred = _cache.pipeline.predict(X_test)
    pred_ms = (time.perf_counter() - t0) * 1000

    frame        = test_df.copy()
    frame["pred"] = y_pred
    per_zone      = frame.groupby("zone_id")["pred"].mean()

    demand_by_label: dict[str, float] = {}
    for lbl in ["Z0", "Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7"]:
        demand_by_label[lbl] = round(float(per_zone[_LABEL_TO_TAZID[lbl]]), 4)

    ai_meta = {
        "model":             _cache.model_metrics.get("model", "RandomForestRegressor"),
        "test_r2":           _cache.model_metrics.get("test_metrics", {}).get("r2"),
        "test_mae":          _cache.model_metrics.get("test_metrics", {}).get("mae"),
        "test_split_start":  str(test_df["time"].min()),
        "test_split_end":    str(test_df["time"].max()),
        "prediction_time_ms": round(pred_ms, 2),
        "predicted_demand":  demand_by_label,
    }
    log.info("AI prediction done in %.1f ms", pred_ms)
    return demand_by_label, ai_meta


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — QUBO construction
# ─────────────────────────────────────────────────────────────────────────────

def _build_qubo_from_predictions(demand_by_label: dict[str, float]) -> QUBOProblem:
    """
    Write a temporary zones CSV with live predictions and call build_qubo().
    The distance matrix and all other columns are unchanged.
    """
    _load_cache()

    zones_df = _cache.zones_df.copy()
    for lbl, d in demand_by_label.items():
        zones_df.loc[zones_df["label"] == lbl, "mean_pred_kwh"] = d

    tmp_csv = _ZONES_CSV.parent / "_api_qubo_tmp.csv"
    try:
        zones_df.to_csv(tmp_csv, index=False)
        qubo = build_qubo(zones_csv=tmp_csv, dist_csv=_DIST_CSV)
    finally:
        tmp_csv.unlink(missing_ok=True)

    log.info(
        "QUBO built: n=%d  K=%d  λ=%.1f  E(opt_bits)=%.4f",
        qubo.n, qubo.budget, qubo.lam,
        qubo.energy(qubo.bitstring_to_x(_QUBO_OPT_BITS)),
    )
    return qubo


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3a — Classical solver
# ─────────────────────────────────────────────────────────────────────────────

def _solve_classical(qubo: QUBOProblem) -> dict:
    """Run exhaustive coverage solver (unchanged) and return compact result."""
    problem = PlacementProblem(
        labels       = qubo.labels,
        demands      = qubo.demands,
        coverage_adj = qubo.coverage_adj,
        budget       = qubo.budget,
    )
    t0     = time.perf_counter()
    output = solve_exhaustive(problem)
    rt     = time.perf_counter() - t0

    best  = output.best
    x_vec = np.zeros(qubo.n)
    for idx in best.station_idxs:
        x_vec[idx] = 1.0

    return {
        "method":               "classical_exhaustive",
        "selected_zones":       best.stations,
        "qubo_energy":          round(float(qubo.energy(x_vec)), 6),
        "feasible":             True,
        "n_stations":           len(best.stations),
        "covered_demand_kwh_h": round(best.covered_demand, 4),
        "coverage_pct":         round(best.coverage_pct, 4),
        "runtime_s":            round(rt, 6),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3b — QAOA (Aer simulator, lazy Qiskit imports)
# ─────────────────────────────────────────────────────────────────────────────

def _build_qp(qubo: QUBOProblem):
    """Encode QUBOProblem.Q_upper as a Qiskit QuadraticProgram."""
    from qiskit_optimization.problems import QuadraticProgram
    qp = QuadraticProgram("ev_charger_placement_qubo")
    for j in range(qubo.n):
        qp.binary_var(f"x{j}")
    linear    = {f"x{j}": float(qubo.Q_upper[j, j]) for j in range(qubo.n)}
    quadratic = {
        (f"x{j}", f"x{k}"): float(qubo.Q_upper[j, k])
        for j in range(qubo.n)
        for k in range(j + 1, qubo.n)
        if qubo.Q_upper[j, k] != 0.0
    }
    qp.minimize(linear=linear, quadratic=quadratic)
    return qp


def _best_feasible(quasi_dist: Any, qubo: QUBOProblem) -> tuple[str, float]:
    dist = dict(quasi_dist) if not isinstance(quasi_dist, dict) else quasi_dist
    best_bits, best_e = _QUBO_OPT_BITS, float("inf")
    for state_int in dist:
        bits = format(state_int, f"0{qubo.n}b")[::-1]
        x    = qubo.bitstring_to_x(bits)
        if int(x.sum()) != qubo.budget:
            continue
        e = qubo.energy(x)
        if e < best_e:
            best_e, best_bits = e, bits
    return best_bits, best_e


def _success_prob(quasi_dist: Any, qubo: QUBOProblem) -> float:
    dist    = dict(quasi_dist) if not isinstance(quasi_dist, dict) else quasi_dist
    opt_int = int(_QUBO_OPT_BITS[::-1], 2)
    return round(float(dist.get(opt_int, 0.0)), 8)


def _top_samples(quasi_dist: Any, qubo: QUBOProblem, top_n: int = 10) -> list[dict]:
    dist = dict(quasi_dist) if not isinstance(quasi_dist, dict) else quasi_dist
    rows = []
    for state_int, prob in dist.items():
        bits = format(state_int, f"0{qubo.n}b")[::-1]
        x    = qubo.bitstring_to_x(bits)
        rows.append({
            "bitstring":   bits,
            "probability": round(float(prob), 8),
            "qubo_energy": round(float(qubo.energy(x)), 6),
            "n_stations":  int(x.sum()),
            "feasible":    int(x.sum()) == qubo.budget,
            "zones":       [qubo.labels[j] for j, b in enumerate(bits) if b == "1"],
        })
    rows.sort(key=lambda r: (-r["probability"], r["qubo_energy"]))
    return rows[:top_n]


def _solve_qaoa(qubo: QUBOProblem, reps: int, shots: int, seed: int) -> dict:
    """
    Solve the QUBO with QAOA on the Aer local simulator.
    Qiskit symbols are imported HERE — after all pandas/parquet work is done —
    to respect the import-order constraint.
    """
    # ── Lazy Qiskit imports ───────────────────────────────────────────────────
    from qiskit_aer import AerSimulator
    from qiskit_aer.primitives import SamplerV2 as AerSamplerV2
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    from qiskit_optimization.minimum_eigensolvers import QAOA
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    from qiskit_optimization.optimizers import COBYLA

    qp      = _build_qp(qubo)
    backend = AerSimulator(seed_simulator=seed)
    pm      = generate_preset_pass_manager(optimization_level=1, backend=backend)
    sampler = AerSamplerV2(default_shots=shots, seed=seed)

    qaoa = QAOA(
        sampler=sampler,
        optimizer=COBYLA(maxiter=500, rhobeg=np.pi / 4, tol=1e-6),
        reps=reps,
        pass_manager=pm,
    )

    t0     = time.perf_counter()
    result = MinimumEigenOptimizer(min_eigen_solver=qaoa).solve(qp)
    rt     = time.perf_counter() - t0

    er = result.min_eigen_solver_result

    # Solver argmin
    solver_bits   = "".join(str(int(round(v))) for v in result.x)
    solver_energy = qubo.energy(qubo.bitstring_to_x(solver_bits))

    # Best feasible from full distribution
    feasible_bits, feasible_energy = _best_feasible(er.eigenstate, qubo)

    final_bits  = solver_bits  if solver_energy <= feasible_energy else feasible_bits
    final_energy = min(solver_energy, feasible_energy)

    final_x     = qubo.bitstring_to_x(final_bits)
    n_sel       = int(final_x.sum())
    selected    = [qubo.labels[j] for j, b in enumerate(final_bits) if b == "1"]
    depth       = er.optimal_circuit.depth() if er.optimal_circuit is not None else -1
    succ_prob   = _success_prob(er.eigenstate, qubo)
    top10       = _top_samples(er.eigenstate, qubo, top_n=10)

    log.info(
        "QAOA done: zones=%s  energy=%.4f  depth=%d  t=%.2fs",
        selected, final_energy, depth, rt,
    )

    return {
        "method":               "qaoa_aer_simulator",
        "reps":                 reps,
        "seed":                 seed,
        "shots":                shots,
        "selected_zones":       selected,
        "best_bitstring":       final_bits,
        "qubo_energy":          round(final_energy, 6),
        "feasible":             n_sel == qubo.budget,
        "n_stations":           n_sel,
        "success_probability":  succ_prob,
        "circuit_depth":        depth,
        "n_qubits":             qubo.n,
        "runtime_s":            round(rt, 4),
        "eigenvalue":           round(float(np.real(er.eigenvalue)), 8)
                                if er.eigenvalue is not None else None,
        "optimal_parameters":   [round(float(v), 6) for v in er.optimal_point]
                                if er.optimal_point is not None else [],
        "top10_samples":        top10,
        "matches_qubo_optimum": sorted(selected) == sorted(_QUBO_OPT_ZONES),
        "energy_gap":           round(final_energy - _QUBO_OPT_ENERGY, 6),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Public API — single entry point called by the router
# ─────────────────────────────────────────────────────────────────────────────

def run_pipeline(
    reps:  int = 1,
    shots: int = 2048,
    seed:  int = 42,
) -> dict:
    """
    Execute the full AI → QUBO → QAOA pipeline and return a structured result.

    Parameters
    ----------
    reps  : QAOA ansatz depth (p)
    shots : simulator shots per circuit evaluation
    seed  : random seed for AerSimulator + COBYLA

    Returns
    -------
    dict with keys:
        pipeline_runtime_s, demand_prediction, qubo, classical, qaoa,
        recommendation
    """
    t_total = time.perf_counter()

    # ── 1. AI demand prediction ───────────────────────────────────────────────
    log.info("Pipeline stage 1: AI demand prediction")
    demand_by_label, ai_meta = _predict_demand()

    # ── 2. QUBO ───────────────────────────────────────────────────────────────
    log.info("Pipeline stage 2: QUBO construction")
    qubo = _build_qubo_from_predictions(demand_by_label)

    qubo_meta = {
        "n_qubits":     qubo.n,
        "budget_k":     qubo.budget,
        "lambda":       qubo.lam,
        "c_values":     {lbl: round(float(qubo.c_values[i]), 6)
                         for i, lbl in enumerate(qubo.labels)},
        "global_minimum_energy": round(
            qubo.energy(qubo.bitstring_to_x(_QUBO_OPT_BITS)), 6
        ),
    }

    # ── 3a. Classical solver ──────────────────────────────────────────────────
    log.info("Pipeline stage 3a: classical solver")
    classical = _solve_classical(qubo)

    # ── 3b. QAOA ──────────────────────────────────────────────────────────────
    log.info("Pipeline stage 3b: QAOA (reps=%d shots=%d seed=%d)", reps, shots, seed)
    qaoa = _solve_qaoa(qubo, reps=reps, shots=shots, seed=seed)

    # ── 4. Recommendation (QAOA preferred if feasible) ─────────────────────
    if qaoa["feasible"]:
        rec_zones  = qaoa["selected_zones"]
        rec_method = "qaoa_aer_simulator"
        rec_energy = qaoa["qubo_energy"]
    else:
        rec_zones  = classical["selected_zones"]
        rec_method = "classical_exhaustive"
        rec_energy = classical["qubo_energy"]

    total_demand = sum(demand_by_label.values())

    # Zone details for the recommendation
    zones_df   = _cache.zones_df.set_index("label")
    zone_details = []
    for lbl in qubo.labels:
        row = zones_df.loc[lbl]
        zone_details.append({
            "label":           lbl,
            "tazid":           int(row["tazid"]),
            "longitude":       float(row["longitude"]),
            "latitude":        float(row["latitude"]),
            "predicted_demand_kwh_h": demand_by_label[lbl],
            "qubo_c_value":    round(float(qubo.c_values[qubo.labels.index(lbl)]), 6),
            "selected":        lbl in rec_zones,
        })

    pipeline_runtime = round(time.perf_counter() - t_total, 3)
    log.info("Pipeline complete in %.2f s → %s", pipeline_runtime, rec_zones)

    return {
        "pipeline_runtime_s": pipeline_runtime,
        "demand_prediction":  ai_meta,
        "qubo":               qubo_meta,
        "classical":          classical,
        "qaoa":               qaoa,
        "recommendation": {
            "selected_zones":               rec_zones,
            "method":                       rec_method,
            "qubo_energy":                  rec_energy,
            "feasible":                     True,
            "n_stations":                   len(rec_zones),
            "matches_qubo_optimum":         sorted(rec_zones) == sorted(_QUBO_OPT_ZONES),
            "predicted_demand":             {z: demand_by_label[z] for z in rec_zones},
            "total_candidate_demand_kwh_h": round(total_demand, 4),
            "zone_details":                 zone_details,
        },
    }
