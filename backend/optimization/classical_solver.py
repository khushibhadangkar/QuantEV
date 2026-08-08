"""
backend/optimization/classical_solver.py
=========================================
Exhaustive classical solver for the EV charger-placement problem.

Problem
-------
Given n candidate zones, each with a predicted demand score and a set of
coverage neighbours (zones reachable within 3 km), choose exactly K zones
to place new stations so that total covered demand is maximised.

A zone i is *covered* if at least one selected zone j satisfies j == i or
j is a 3 km neighbour of i.

This module is intentionally self-contained and dependency-light so it can
also be imported by the QAOA module for ground-truth comparison.
"""

from __future__ import annotations

import itertools
import time
from dataclasses import dataclass, field
from typing import List, Tuple

import numpy as np


# ─────────────────────────────────────────────────────────────────────────────
# Data structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PlacementProblem:
    """
    All data needed to define one placement optimisation instance.

    Attributes
    ----------
    labels        : zone labels, e.g. ['Z0', 'Z1', …]
    demands       : predicted mean hourly demand per zone (kWh/h)
    coverage_adj  : boolean n×n array; coverage_adj[i, j] == True means
                    placing a station in j covers zone i
    budget        : number of stations to place (K)
    """
    labels:       List[str]
    demands:      np.ndarray        # shape (n,)
    coverage_adj: np.ndarray        # shape (n, n), dtype bool
    budget:       int = 3

    @property
    def n(self) -> int:
        return len(self.labels)

    def label_to_idx(self, label: str) -> int:
        return self.labels.index(label)


@dataclass
class PlacementResult:
    """One evaluated combination."""
    combo_idx:      int               # 0-based enumeration index
    stations:       List[str]         # selected zone labels
    station_idxs:   List[int]         # selected zone indices
    covered_zones:  List[str]         # all zones covered by the selection
    covered_demand: float             # sum of demands for covered zones (kWh/h)
    total_demand:   float             # sum of all zone demands (kWh/h)
    coverage_pct:   float             # covered_demand / total_demand × 100


@dataclass
class SolverOutput:
    """Full output of the exhaustive solver."""
    problem:          PlacementProblem
    best:             PlacementResult
    all_results:      List[PlacementResult]
    n_combinations:   int
    runtime_s:        float
    solver:           str = "exhaustive_classical"

    @property
    def best_covered_demand(self) -> float:
        return self.best.covered_demand

    @property
    def best_coverage_pct(self) -> float:
        return self.best.coverage_pct


# ─────────────────────────────────────────────────────────────────────────────
# Core solver
# ─────────────────────────────────────────────────────────────────────────────

def covered_demand(
    station_idxs: Tuple[int, ...],
    demands: np.ndarray,
    coverage_adj: np.ndarray,
) -> Tuple[float, np.ndarray]:
    """
    Given a set of station placements (as zone indices), return the total
    covered demand and a boolean mask of which zones are covered.

    Zone i is covered iff any selected station j satisfies coverage_adj[i, j].
    The diagonal coverage_adj[i, i] == True handles self-coverage (placing a
    station in zone i covers zone i itself).

    Returns
    -------
    total_covered : float
    covered_mask  : np.ndarray of shape (n,), dtype bool
    """
    n = len(demands)
    covered_mask = np.zeros(n, dtype=bool)
    for j in station_idxs:
        covered_mask |= coverage_adj[:, j]
    return float(demands[covered_mask].sum()), covered_mask


def solve_exhaustive(problem: PlacementProblem) -> SolverOutput:
    """
    Enumerate all C(n, K) combinations, evaluate each, return the best.

    Time complexity: O(C(n, K) × n) — for n=8, K=3 this is 56 × 8 = 448 ops.
    """
    n      = problem.n
    K      = problem.budget
    labels = problem.labels
    demand = problem.demands
    adj    = problem.coverage_adj
    total  = float(demand.sum())

    all_combos = list(itertools.combinations(range(n), K))
    n_combos   = len(all_combos)

    results: List[PlacementResult] = []

    t_start = time.perf_counter()

    for idx, combo in enumerate(all_combos):
        cov_d, cov_mask = covered_demand(combo, demand, adj)
        results.append(PlacementResult(
            combo_idx      = idx,
            stations       = [labels[j] for j in combo],
            station_idxs   = list(combo),
            covered_zones  = [labels[i] for i in range(n) if cov_mask[i]],
            covered_demand = cov_d,
            total_demand   = total,
            coverage_pct   = cov_d / total * 100.0,
        ))

    runtime_s = time.perf_counter() - t_start

    # Sort by covered_demand descending, break ties by combo_idx (stability)
    results.sort(key=lambda r: (-r.covered_demand, r.combo_idx))
    best = results[0]

    return SolverOutput(
        problem        = problem,
        best           = best,
        all_results    = results,
        n_combinations = n_combos,
        runtime_s      = runtime_s,
        solver         = "exhaustive_classical",
    )
