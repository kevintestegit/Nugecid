#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PORT="${E2E_BACKEND_PORT:-3100}"
export NODE_ENV="${NODE_ENV:-development}"

exec npx nest start
