#!/usr/bin/env bash
# build.sh — Render build script
#
# 1. Install Python dependencies
# 2. Train the RandomForest pipeline if model artifacts are missing.
#    (Model files are ~327 MB each and cannot be committed to git directly.)
#    Training takes ~60–90 s and requires ~600 MB RAM.
#
# The parquet training data (8.6 MB) IS committed to the repo, so this
# script is fully self-contained.

set -euo pipefail

echo "=== QuantEV build: $(date) ==="
echo "Python: $(python --version)"

# ── 1. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "--- Installing dependencies ---"
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo "Dependencies installed."

# ── 2. Train model if artifacts are missing ──────────────────────────────────
MODELS_DIR="models"
PIPELINE="$MODELS_DIR/feature_pipeline.joblib"
PARQUET="data/processed/demand_hourly.parquet"

if [ -f "$PIPELINE" ]; then
  echo ""
  echo "--- Model artifacts already present, skipping training ---"
  echo "  feature_pipeline.joblib: $(du -h "$PIPELINE" | cut -f1)"
else
  echo ""
  echo "--- Model artifacts missing — training RandomForest pipeline ---"
  echo "  Data: $PARQUET ($(du -h "$PARQUET" | cut -f1))"

  if [ ! -f "$PARQUET" ]; then
    echo "ERROR: Training data not found at $PARQUET"
    echo "       The parquet file must be committed to the repository."
    exit 1
  fi

  mkdir -p "$MODELS_DIR"

  python - <<'PYEOF'
import logging, sys, time
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
from pathlib import Path
from backend.ai.train import run

t0 = time.perf_counter()
metrics = run(
    parquet_path=Path("data/processed/demand_hourly.parquet"),
    models_dir=Path("models"),
)
elapsed = time.perf_counter() - t0

print(f"\nTraining complete in {elapsed:.1f}s")
print(f"  Test R²  : {metrics['test_metrics']['r2']:.4f}")
print(f"  Test MAE : {metrics['test_metrics']['mae']:.4f} kWh/h")
PYEOF

  echo ""
  echo "--- Model artifacts written ---"
  ls -lh "$MODELS_DIR"/*.joblib "$MODELS_DIR"/metrics.json
fi

echo ""
echo "=== Build complete ==="
