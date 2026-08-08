"""
EVision — FastAPI application entry point.

Run with:
    .venv/bin/uvicorn backend.api.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routers import health

app = FastAPI(
    title="EVision API",
    description="AI + Quantum EV Charging Infrastructure Optimizer",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server (port 3000) during development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="/api/v1", tags=["health"])
