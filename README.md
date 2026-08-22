# QuantEV

### AI + Quantum Optimization for EV Charging Infrastructure Planning

> **Where should the next EV charging stations be built?**
>
> QuantEV combines machine learning, mathematical optimization, and quantum computing to identify high-impact locations for new EV charging infrastructure based on predicted charging demand, geographic coverage, and spatial relationships between candidate sites.

---

## Overview

EV adoption is growing rapidly, but charging infrastructure cannot simply be expanded everywhere.

The real challenge is a **combinatorial infrastructure planning problem**:

- Where will charging demand increase?
- Which areas are underserved?
- Which candidate locations provide the greatest coverage?
- How many stations should be deployed?
- How can infrastructure be distributed efficiently?
- Which configuration provides the best trade-off between demand coverage and network efficiency?

**QuantEV** approaches this problem as an end to end decision intelligence pipeline.

It uses a machine-learning model to estimate charging demand and then formulates infrastructure placement as a **Quadratic Unconstrained Binary Optimization (QUBO)** problem. The resulting optimization problem is solved using the **Quantum Approximate Optimization Algorithm (QAOA)** and evaluated against a classical baseline.

The result is an interactive map-based planning experience that turns complex optimization results into understandable infrastructure recommendations.

---

## The Core Idea

```text
                 EV Charging Data
                        │
                        ▼
              ┌──────────────────┐
              │ Demand Forecasting│
              │   Random Forest   │
              └────────┬─────────┘
                       │
                       ▼
              Predicted EV Demand
                       │
                       ▼
             Candidate Site Analysis
                       │
                       ▼
              ┌──────────────────┐
              │ QUBO Formulation │
              │ Demand + Distance│
              │ Coverage + Budget│
              └────────┬─────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
       Classical Baseline       QAOA
              │                 │
              └────────┬────────┘
                       ▼
             Recommended Locations
                       │
                       ▼
             Interactive Map + Impact
