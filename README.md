# EVision — AI + Quantum EV Charging Infrastructure Optimizer

> Hackathon project: predict EV charging demand by geographic zone using ML, then use QAOA (and a classical baseline) to determine optimal placement for new charging stations. Results are displayed on an interactive map with a side-by-side solver comparison.

---

## Stack

| Layer | Technology |
|---|---|
| ML / Data | Python 3.11+, Pandas, NumPy, scikit-learn |
| Quantum | Qiskit 2.x, Qiskit Aer, qiskit-optimization |
| API | FastAPI, Uvicorn, Pydantic |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts, Leaflet |

---

## Monorepo Structure

```
EV/
├── backend/
│   ├── ai/              # ML demand prediction
│   ├── optimization/    # Classical optimizer (scipy / greedy)
│   ├── quantum/         # QAOA via Qiskit + Aer
│   └── api/             # FastAPI app — routes, schemas, orchestration
├── data/
│   ├── raw/             # Source datasets
│   └── processed/       # Feature-engineered outputs
├── experiments/         # Jupyter notebooks
├── frontend/            # Next.js app
├── docs/                # Architecture notes, API spec
├── .venv/               # Python virtual environment (not committed)
├── requirements.txt
└── pyproject.toml
```

---

## Getting Started

### Backend

```bash
# 1. Activate the virtual environment
source .venv/bin/activate

# 2. Start the API server
uvicorn backend.api.main:app --reload --port 8000
```

Health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## Data Flow (planned)

```
Raw EV / geo data
      │
      ▼
backend/ai  ──►  demand score per zone  ──►  POST /api/v1/predict
                                                    │
                          ┌─────────────────────────┤
                          ▼                         ▼
              backend/quantum (QAOA)   backend/optimization (classical)
                          │                         │
                          └──────────┬──────────────┘
                                     ▼
                            POST /api/v1/optimize
                                     │
                                     ▼
                      frontend — Leaflet map + Recharts comparison
```

---

## Roadmap

- [ ] Ingest and clean EV registration / POI dataset
- [ ] Train ML demand-prediction model (zone-level)
- [ ] Formulate QUBO for station placement
- [ ] Implement QAOA solver (Qiskit Aer statevector)
- [ ] Implement classical baseline (greedy / scipy)
- [ ] Wire solvers to FastAPI `/predict` and `/optimize` endpoints
- [ ] Build Leaflet map + Recharts comparison UI
- [ ] Benchmarking notebook in `experiments/`
