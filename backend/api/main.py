"""
EVision — FastAPI application entry point.

Run with:
    .venv/bin/uvicorn backend.api.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
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
