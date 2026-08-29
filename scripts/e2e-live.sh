#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"

if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "Python environment missing." >&2
  exit 1
fi

mkdir -p backend/data
.venv/bin/alembic -c backend/alembic.ini upgrade head

.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
api_pid=$!
ALPHA_BACKEND_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 4173 --strictPort &
ui_pid=$!

cleanup() {
  kill "${ui_pid}" "${api_pid}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _attempt in $(seq 1 30); do
  if curl --silent --fail http://127.0.0.1:8000/health >/dev/null \
    && curl --silent --fail http://127.0.0.1:4173/ >/dev/null; then
    break
  fi
  sleep 1
done

ALPHA_E2E_FRONTEND_ORIGIN=http://127.0.0.1:4173 node scripts/e2e-live-adapter.mjs
