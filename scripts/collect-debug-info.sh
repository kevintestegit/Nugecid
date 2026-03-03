#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/backups/debug/$(date +%Y%m%d-%H%M%S)}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
COOKIE_JAR="$(mktemp)"
SMOKE_USER="${SMOKE_USER:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"

trap 'rm -f "$COOKIE_JAR"' EXIT

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

mkdir -p "$OUT_DIR"

echo "Coletando diagnóstico em: $OUT_DIR"

docker compose ps > "$OUT_DIR/compose-ps.txt"
docker compose logs --tail=200 backend > "$OUT_DIR/backend.log" 2>&1 || true
docker compose logs --tail=200 frontend > "$OUT_DIR/frontend.log" 2>&1 || true
docker compose logs --tail=200 db > "$OUT_DIR/db.log" 2>&1 || true
docker compose logs --tail=200 redis > "$OUT_DIR/redis.log" 2>&1 || true
docker compose config > "$OUT_DIR/compose-config.yml"

curl -sS "http://localhost:${HOST_BACKEND_PORT:-8080}/health" \
  > "$OUT_DIR/health.json" 2>&1 || true
curl -sS "http://localhost:${HOST_BACKEND_PORT:-8080}/ready" \
  > "$OUT_DIR/ready.json" 2>&1 || true

if [[ -n "$SMOKE_USER" && -n "$SMOKE_PASSWORD" ]]; then
  login_payload="$(printf '{"usuario":"%s","senha":"%s"}' "$SMOKE_USER" "$SMOKE_PASSWORD")"
  curl -sS -c "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -X POST "http://localhost:${HOST_BACKEND_PORT:-8080}/api/auth/login" \
    --data "$login_payload" \
    > "$OUT_DIR/auth-login.json" 2>&1 || true
  curl -sS -b "$COOKIE_JAR" \
    "http://localhost:${HOST_BACKEND_PORT:-8080}/api/health/database" \
    > "$OUT_DIR/database-health.json" 2>&1 || true
  curl -sS -b "$COOKIE_JAR" \
    "http://localhost:${HOST_BACKEND_PORT:-8080}/api/health/metrics" \
    > "$OUT_DIR/runtime-metrics.json" 2>&1 || true
else
  printf '%s\n' \
    "Health detalhado autenticado foi pulado." \
    "Defina SMOKE_USER e SMOKE_PASSWORD para coletar /api/health/database e /api/health/metrics." \
    > "$OUT_DIR/authenticated-health-skipped.txt"
fi

echo "Diagnóstico coletado com sucesso."
echo "Arquivos principais:"
echo "  $OUT_DIR/compose-ps.txt"
echo "  $OUT_DIR/backend.log"
echo "  $OUT_DIR/frontend.log"
echo "  $OUT_DIR/db.log"
echo "  $OUT_DIR/redis.log"
echo "  $OUT_DIR/ready.json"
