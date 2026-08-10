"""
EVision — FastAPI application entry point.

Run with:
    .venv/bin/uvicorn backend.api.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

import pandas as pd

# ── Pandas 3.x compatibility fix ────────────────────────────────────────────
# Pandas ≥ 3.0 enables future.infer_string=True by default, which makes ALL
# string columns Arrow-backed (ArrowDtype).  Qiskit-Aer's C/Rust extensions
# interfere with PyArrow's internal allocator after being imported, causing
# pyarrow.lib.ArrowException ("Unknown error: Wrapping <ptr> failed") on any
# subsequent pandas operation that materialises an Arrow-backed string column.
# Setting this to False restores the pre-3.0 behaviour (plain NumPy object
# dtype for strings) and is safe for all existing code in this project.
try:
    pd.options.future.infer_string = False
except AttributeError:
    pass   # pandas < 3.0 — option doesn't exist, nothing to do

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routers import health
from backend.api.routers import optimize
from backend.api.services.optimizer import warm_up


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-warm the pipeline cache at startup so the first request is fast."""
    warm_up()
    yield


app = FastAPI(
    title="EVision API",
    description="AI + Quantum EV Charging Infrastructure Optimizer",
    version="0.2.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server and any localhost origin during dev
# ---------------------------------------------------------------------------
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://quant-ev.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router,    prefix="/api/v1", tags=["health"])
app.include_router(optimize.router,  prefix="/api/v1", tags=["optimization"])
