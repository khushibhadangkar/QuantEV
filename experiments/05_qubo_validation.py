"""
experiments/05_qubo_validation.py
==================================
Validates the QUBO formulation by exhaustively evaluating all 256 possible
bitstrings and all 56 feasible (k=3) combinations.

Checks performed
----------------
1.  Q matrix consistency     – energy() and energy_sym() agree to < 1e-9
2.  Objective alignment      – QUBO ranking of 56 combos matches the
                               classical objective ranking (Spearman ρ = 1.0)
3.  Unique optimum           – exactly one bitstring minimises H(x)
4.  Feasibility of optimum   – global minimum has exactly K=3 bits set
5.  Winner identity          – optimum is {Z0, Z2, Z3}
6.  Classical agreement      – QUBO winner maximises the classical objective
7.  Penalty sufficiency      – best feasible energy < best infeasible energy
8.  Feasibility gap           – quantified in energy units
9.  Full landscape            – all 256 energies tabulated

Outputs (experiments/results/)
-------------------------------
    qubo_matrix.csv           8×8 upper-triangular Q' matrix
    qubo_c_values.csv         proximity-weighted coverage value per zone
    qubo_56_combos.csv        all 56 k=3 combos ranked by QUBO energy
    qubo_256_landscape.csv    all 256 bitstrings with energy and feasibility
    qubo_validation.json      all 9 check results + key metrics
    qubo_summary.txt          human-readable report

Usage
-----
    cd /path/to/EV
    .venv/bin/python experiments/05_qubo_validation.py
"""

from __future__ import annotations

import argparse
import csv
import json
import itertools
import logging
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _spearman_rho(a: np.ndarray, b: np.ndarray) -> float:
    """Spearman rank correlation between two arrays."""
    n = len(a)
    ra = np.argsort(np.argsort(a)).astype(float)
    rb = np.argsort(np.argsort(b)).astype(float)
    d2 = ((ra - rb) ** 2).sum()
    return float(1.0 - 6.0 * d2 / (n * (n ** 2 - 1)))


def _check(name: str, result: bool, detail: str = "") -> dict:
    status = "PASS" if result else "FAIL"
    msg = f"  [{status}] {name}"
    if detail:
        msg += f"  — {detail}"
    log.info(msg)
    return {"name": name, "status": status, "detail": detail}


# ─────────────────────────────────────────────────────────────────────────────
# Main validation logic
# ─────────────────────────────────────────────────────────────────────────────

def run_validation(qubo, results_dir: Path) -> dict:
    from backend.quantum.qubo import combo_to_x, objective_value

    n      = qubo.n
    labels = qubo.labels
    K      = qubo.budget

    checks = []
    t_start = time.perf_counter()

    # ── 1. Evaluate all 256 bitstrings ────────────────────────────────────────
    log.info("── Evaluating all 256 bitstrings")
    landscape = []
    for bits in range(256):
        x      = np.array([(bits >> j) & 1 for j in range(n)], dtype=float)
        e_up   = qubo.energy(x)          # upper-triangular form
        e_sym  = qubo.energy_sym(x)      # symmetric form
        k_sel  = int(x.sum())
        sel    = [labels[j] for j in range(n) if x[j] == 1]
        obj    = float(qubo.c_values @ x)  # pure objective (no penalty)
        penalty = qubo.lam * (k_sel - K) ** 2
        landscape.append({
            "bits":         format(bits, f"0{n}b"),   # e.g. "00000101"
            "int":          bits,
            "k_selected":   k_sel,
            "stations":     "|".join(sel),
            "energy_upper": e_up,
            "energy_sym":   e_sym,
            "objective":    obj,
            "penalty":      penalty,
            "feasible":     k_sel == K,
        })

    # ── Check 1: energy_upper == energy_sym everywhere ───────────────────────
    max_discrepancy = max(abs(r["energy_upper"] - r["energy_sym"])
                          for r in landscape)
    checks.append(_check(
        "Q matrix consistency (upper ≡ sym)",
        max_discrepancy < 1e-9,
        f"max |E_upper - E_sym| = {max_discrepancy:.2e}",
    ))

    landscape.sort(key=lambda r: r["energy_upper"])

    # ── Check 2: global minimum is unique ─────────────────────────────────────
    global_min_e = landscape[0]["energy_upper"]
    n_global_min = sum(1 for r in landscape
                       if abs(r["energy_upper"] - global_min_e) < 1e-9)
    checks.append(_check(
        "Unique global minimum",
        n_global_min == 1,
        f"{n_global_min} bitstring(s) at E = {global_min_e:.6f}",
    ))

    # ── Check 3: global minimum is feasible (k=3) ─────────────────────────────
    winner_row = landscape[0]
    checks.append(_check(
        "Global minimum is feasible (k=3)",
        winner_row["feasible"],
        f"k={winner_row['k_selected']}, stations={winner_row['stations']}",
    ))

    # ── Check 4: winner identity ──────────────────────────────────────────────
    winner_set = set(winner_row["stations"].split("|")) if winner_row["stations"] else set()
    expected   = {"Z0", "Z2", "Z3"}
    checks.append(_check(
        "Winner is {Z0, Z2, Z3}",
        winner_set == expected,
        f"got {sorted(winner_set)}",
    ))

    # ── Check 5: penalty sufficiency ─────────────────────────────────────────
    best_feasible   = min(r["energy_upper"] for r in landscape if r["feasible"])
    best_infeasible = min(r["energy_upper"] for r in landscape if not r["feasible"])
    gap = best_infeasible - best_feasible
    checks.append(_check(
        "Best feasible < best infeasible (penalty sufficient)",
        gap > 0,
        f"feasibility gap = {gap:.4f} energy units",
    ))

    # ── Check 6: QUBO ranking of 56 combos agrees with classical objective ────
    log.info("── Evaluating all 56 feasible combinations")
    feasible_rows = [r for r in landscape if r["feasible"]]
    assert len(feasible_rows) == 56, f"Expected 56 feasible rows, got {len(feasible_rows)}"

    # For Spearman: higher classical objective = better; lower QUBO energy = better.
    # Build parallel arrays sorted by combo.
    all_combos = list(itertools.combinations(range(n), K))
    combo_to_str = {
        tuple(sorted(range(n))):None   # placeholder
    }
    combo_qubo_e = []
    combo_obj    = []
    combo_strs   = []
    for combo in all_combos:
        x      = combo_to_x([labels[j] for j in combo], labels)
        e_qubo = qubo.energy(x)
        obj    = float(qubo.c_values @ x)
        combo_qubo_e.append(e_qubo)
        combo_obj.append(obj)
        combo_strs.append("+".join(labels[j] for j in combo))

    rho = _spearman_rho(
        np.array(combo_obj),        # higher = better (max)
        -np.array(combo_qubo_e),    # negate so higher = better (min energy)
    )
    checks.append(_check(
        "QUBO ranking ≡ classical ranking (Spearman ρ = 1.0)",
        abs(rho - 1.0) < 1e-9,
        f"ρ = {rho:.10f}",
    ))

    # ── Check 7: classical winner maximises classical objective ───────────────
    best_obj_idx     = int(np.argmax(combo_obj))
    best_obj_stations = combo_strs[best_obj_idx].split("+")
    checks.append(_check(
        "QUBO winner maximises classical objective",
        set(best_obj_stations) == expected,
        f"classical argmax = {sorted(best_obj_stations)}",
    ))

    # ── Check 8: both energy() methods give identical ranking ─────────────────
    combo_qubo_sym = [qubo.energy_sym(combo_to_x([labels[j] for j in combo], labels))
                      for combo in all_combos]
    rank_up  = np.argsort(combo_qubo_e)
    rank_sym = np.argsort(combo_qubo_sym)
    ranking_agree = np.array_equal(rank_up, rank_sym)
    checks.append(_check(
        "energy() and energy_sym() produce identical ranking",
        ranking_agree,
        "upper-triangular and symmetric evaluation consistent",
    ))

    # ── Check 9: no k=3 combo has lower energy than global k=3 winner ─────────
    winner_combo_e = qubo.energy(
        combo_to_x(list(expected), labels)
    )
    all_k3_energies_sorted = sorted(combo_qubo_e)
    checks.append(_check(
        "No k=3 combo has lower energy than winner",
        abs(all_k3_energies_sorted[0] - winner_combo_e) < 1e-9,
        f"min k=3 energy = {all_k3_energies_sorted[0]:.6f}, "
        f"winner energy = {winner_combo_e:.6f}",
    ))

    runtime_s = time.perf_counter() - t_start
    all_passed = all(c["status"] == "PASS" for c in checks)

    # ── Build 56-combo ranked table ───────────────────────────────────────────
    combos_ranked = sorted(
        zip(combo_strs, combo_qubo_e, combo_obj),
        key=lambda t: t[1],
    )

    return {
        "checks":        checks,
        "all_passed":    all_passed,
        "runtime_s":     runtime_s,
        "landscape":     landscape,
        "combos_ranked": combos_ranked,
        "qubo":          qubo,
        "metrics": {
            "global_min_energy":    global_min_e,
            "winner":               sorted(winner_set),
            "best_feasible_energy": best_feasible,
            "best_infeasible_energy": best_infeasible,
            "feasibility_gap":      gap,
            "spearman_rho":         rho,
            "n_bitstrings":         256,
            "n_feasible_combos":    56,
            "n_checks":             len(checks),
            "n_passed":             sum(1 for c in checks if c["status"] == "PASS"),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Writers
# ─────────────────────────────────────────────────────────────────────────────

def write_results(val: dict, results_dir: Path) -> None:
    qubo    = val["qubo"]
    labels  = qubo.labels
    n       = qubo.n
    metrics = val["metrics"]

    results_dir.mkdir(parents=True, exist_ok=True)

    # ── qubo_matrix.csv ───────────────────────────────────────────────────────
    matrix_path = results_dir / "qubo_matrix.csv"
    df_matrix   = pd.DataFrame(qubo.Q_upper, index=labels, columns=labels)
    df_matrix.index.name = "zone"
    df_matrix.to_csv(matrix_path, float_format="%.6f")
    log.info("Saved %s", matrix_path)

    # ── qubo_c_values.csv ─────────────────────────────────────────────────────
    cv_path = results_dir / "qubo_c_values.csv"
    pd.DataFrame({
        "label":         labels,
        "tazid":         [1026, 746, 716, 965, 706, 745, 744, 737],
        "demand_kwh_h":  qubo.demands.tolist(),
        "c_value":       qubo.c_values.tolist(),
        "Q_diagonal":    [qubo.Q_upper[j, j] for j in range(n)],
    }).to_csv(cv_path, index=False, float_format="%.6f")
    log.info("Saved %s", cv_path)

    # ── qubo_56_combos.csv ────────────────────────────────────────────────────
    combos_path = results_dir / "qubo_56_combos.csv"
    with open(combos_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "rank", "stations",
            "qubo_energy", "classical_objective",
        ])
        for rank, (stns, e, obj) in enumerate(val["combos_ranked"], 1):
            writer.writerow([rank, stns, round(e, 6), round(obj, 6)])
    log.info("Saved %s  (%d rows)", combos_path, len(val["combos_ranked"]))

    # ── qubo_256_landscape.csv ────────────────────────────────────────────────
    landscape_path = results_dir / "qubo_256_landscape.csv"
    with open(landscape_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "rank", "bits", "int", "k_selected", "stations",
            "energy", "objective", "penalty", "feasible",
        ])
        for rank, row in enumerate(val["landscape"], 1):
            writer.writerow([
                rank,
                row["bits"], row["int"], row["k_selected"], row["stations"],
                round(row["energy_upper"], 6),
                round(row["objective"], 6),
                round(row["penalty"], 6),
                row["feasible"],
            ])
    log.info("Saved %s  (%d rows)", landscape_path, len(val["landscape"]))

    # ── qubo_validation.json ──────────────────────────────────────────────────
    json_path = results_dir / "qubo_validation.json"
    payload   = {
        "qubo_params": {
            "lambda":         qubo.lam,
            "budget_K":       qubo.budget,
            "n_zones":        qubo.n,
            "d_min_m":        100.0,
            "objective":      "maximise Σ_j c_j·x_j  (demand-weighted proximity)",
            "constraint":     "Σ_j x_j = K = 3  (penalty λ(Σx_j - K)²)",
        },
        "c_values": {
            labels[j]: round(float(qubo.c_values[j]), 6) for j in range(n)
        },
        "Q_diagonal": {
            labels[j]: round(float(qubo.Q_upper[j, j]), 6) for j in range(n)
        },
        "Q_offdiag_value": round(float(qubo.Q_upper[0, 1]), 6),
        "metrics":  {k: (round(v, 6) if isinstance(v, float) else v)
                     for k, v in metrics.items()},
        "checks":   val["checks"],
        "all_passed": val["all_passed"],
        "runtime_s":  round(val["runtime_s"], 6),
    }
    with open(json_path, "w") as f:
        json.dump(payload, f, indent=2)
    log.info("Saved %s", json_path)

    # ── qubo_summary.txt ──────────────────────────────────────────────────────
    summary_path = results_dir / "qubo_summary.txt"
    lines = []
    W = 64
    lines += [
        "=" * W,
        "  EVision — QUBO Validation Report",
        "=" * W,
        "",
        "  Objective",
        "  ---------",
        "  Maximise Σ_j c_j·x_j",
        "  where c_j = Σ_i  d_i · A[i,j] / D_eff(i,j)",
        "  (demand-weighted proximity coverage value per zone)",
        "",
        "  Constraint",
        "  ----------",
        "  Σ_j x_j = K = 3  (penalty: λ·(Σ x_j − K)²,  λ = 10)",
        "",
        "  QUBO:  H(x) = Σ_{j≤k} Q'[j,k]·x_j·x_k",
        "  Q'[j,j] = −c_j + λ(1−2K)",
        "  Q'[j,k] = 2λ = 20  for j < k",
        "",
        "  ── Zone Values (c_j) ──────────────────────────────────",
        f"  {'Zone':<6}  {'TAZID':>6}  {'Demand (kWh/h)':>16}  "
        f"{'c_j':>12}  {'Q[j,j]':>10}",
        f"  {'----':<6}  {'-----':>6}  {'---------------':>16}  "
        f"{'----':>12}  {'------':>10}",
    ]
    tazids = [1026, 746, 716, 965, 706, 745, 744, 737]
    for j in range(n):
        lines.append(
            f"  {labels[j]:<6}  {tazids[j]:>6}  "
            f"{qubo.demands[j]:>16.2f}  "
            f"{qubo.c_values[j]:>12.6f}  "
            f"{qubo.Q_upper[j,j]:>10.6f}"
        )
    lines += [
        "",
        f"  ── Q Matrix (upper-triangular) {'─'*33}",
        "  " + "  ".join(f"{lbl:>9}" for lbl in labels),
    ]
    for i in range(n):
        row_str = f"  {labels[i]:<4}" + "".join(
            f"  {qubo.Q_upper[i,j]:>9.4f}" for j in range(n)
        )
        lines.append(row_str)

    lines += [
        "",
        f"  ── 56 Feasible Combos (ranked by QUBO energy) {'─'*18}",
        f"  {'Rank':>4}  {'Stations':<20}  {'QUBO Energy':>12}  {'Objective':>12}",
        f"  {'----':>4}  {'--------':<20}  {'----------':>12}  {'---------':>12}",
    ]
    for rank, (stns, e, obj) in enumerate(val["combos_ranked"], 1):
        marker = " ←" if rank == 1 else ""
        lines.append(
            f"  {rank:>4}  {stns:<20}  {e:>12.6f}  {obj:>12.6f}{marker}"
        )

    lines += [
        "",
        "  ── Landscape Summary (all 256 bitstrings) ──────────────",
        f"  Global minimum:  {metrics['winner']}  "
        f"E = {metrics['global_min_energy']:.6f}",
        f"  Best feasible:   E = {metrics['best_feasible_energy']:.6f}",
        f"  Best infeasible: E = {metrics['best_infeasible_energy']:.6f}",
        f"  Feasibility gap: {metrics['feasibility_gap']:.4f} energy units",
        f"  Spearman ρ:      {metrics['spearman_rho']:.10f}",
        "",
        "  ── Validation Checks ───────────────────────────────────",
    ]
    for c in val["checks"]:
        lines.append(f"  [{c['status']:4}]  {c['name']}")
        if c["detail"]:
            lines.append(f"          {c['detail']}")
    lines += [
        "",
        f"  Result: {metrics['n_passed']}/{metrics['n_checks']} checks passed  "
        f"({'ALL PASSED' if val['all_passed'] else 'FAILED'})",
        f"  Runtime: {val['runtime_s']*1000:.2f} ms",
        "=" * W,
    ]
    with open(summary_path, "w") as f:
        f.write("\n".join(lines) + "\n")
    log.info("Saved %s", summary_path)


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    parser    = argparse.ArgumentParser(
        description="Validate the EVision QUBO formulation."
    )
    parser.add_argument(
        "--zones",
        type=Path,
        default=repo_root / "data" / "processed" / "candidate_zones.csv",
    )
    parser.add_argument(
        "--dist",
        type=Path,
        default=repo_root / "data" / "processed" / "candidate_distance_matrix.csv",
    )
    parser.add_argument(
        "--results",
        type=Path,
        default=repo_root / "experiments" / "results",
    )
    args = parser.parse_args()

    for p in [args.zones, args.dist]:
        if not p.exists():
            log.error("Required file not found: %s", p)
            return 1

    from backend.quantum.qubo import build_qubo

    log.info("── Step 1: Build QUBO")
    qubo = build_qubo(args.zones, args.dist)
    log.info("  n=%d  K=%d  λ=%.1f", qubo.n, qubo.budget, qubo.lam)

    log.info("── Step 2: Run validation")
    val = run_validation(qubo, args.results)

    log.info("── Step 3: Write results → %s", args.results)
    write_results(val, args.results)

    # Console summary
    m = val["metrics"]
    print("\n" + "=" * 64)
    print("  EVision — QUBO Validation")
    print("=" * 64)
    print(f"  Bitstrings evaluated  : {m['n_bitstrings']}")
    print(f"  Feasible combos (k=3) : {m['n_feasible_combos']}")
    print(f"  Global minimum        : {m['winner']}  E = {m['global_min_energy']:.4f}")
    print(f"  Feasibility gap       : {m['feasibility_gap']:.4f} energy units")
    print(f"  Spearman ρ            : {m['spearman_rho']:.10f}")
    print(f"  Checks                : {m['n_passed']}/{m['n_checks']} passed")
    print(f"  Runtime               : {val['runtime_s']*1000:.2f} ms")
    print("=" * 64)
    for c in val["checks"]:
        mark = "✓" if c["status"] == "PASS" else "✗"
        print(f"  {mark}  {c['name']}")
    verdict = "ALL CHECKS PASSED" if val["all_passed"] else "VALIDATION FAILED"
    print(f"\n  → {verdict}")
    print("=" * 64 + "\n")

    return 0 if val["all_passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
