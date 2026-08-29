#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"

if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "Python environment missing. Run: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

mkdir -p backend/data
.venv/bin/alembic -c backend/alembic.ini upgrade head

.venv/bin/uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000 &
api_pid=$!

cleanup() {
  kill "${api_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

export ALPHA_BACKEND_URL="${ALPHA_BACKEND_URL:-http://127.0.0.1:8000}"
npm run dev -- --port 3000
