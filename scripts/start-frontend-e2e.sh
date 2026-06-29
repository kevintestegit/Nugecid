#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export VITE_PORT="${E2E_FRONTEND_PORT:-3101}"
export VITE_API_PROXY_TARGET="${E2E_API_PROXY_TARGET:-http://127.0.0.1:${E2E_BACKEND_PORT:-3100}}"

cd frontend
exec npx vite
