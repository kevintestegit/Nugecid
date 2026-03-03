#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

HOST_BACKEND_PORT="${HOST_BACKEND_PORT:-8080}"
HOST_FRONTEND_PORT="${HOST_FRONTEND_PORT:-3001}"
HOST_ADMINER_PORT="${HOST_ADMINER_PORT:-8081}"
HOST_DB_PORT="${HOST_DB_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-${DATABASE_USERNAME:-sgc}}"
POSTGRES_DB="${POSTGRES_DB:-${DATABASE_NAME:-sgc}}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-${DATABASE_PASSWORD:-}}"

backend_url="http://localhost:${HOST_BACKEND_PORT}"
frontend_url="http://localhost:${HOST_FRONTEND_PORT}"
adminer_url="http://localhost:${HOST_ADMINER_PORT}"

print_header() {
  echo "======================================"
  echo "  SGC-ITEP - Verificação do Sistema"
  echo "======================================"
  echo ""
}

check_http() {
  local label="$1"
  local url="$2"
  local expected_code="${3:-200}"
  local status
  status="$(curl -k -sS -o /dev/null -w "%{http_code}" "$url" || true)"

  echo -n "  ${label}: "
  if [[ "$status" == "$expected_code" ]]; then
    echo "✅ OK (${status})"
  else
    echo "❌ FALHOU (${status:-sem resposta})"
    return 1
  fi
}

print_header

echo "📦 Status dos Containers:"
docker compose ps
echo ""

echo "🔗 Testando Conectividade:"
check_http "Backend liveness" "${backend_url}/health"
check_http "Backend readiness" "${backend_url}/ready"
check_http "Frontend" "${frontend_url}/"
check_http "Adminer" "${adminer_url}/" "200"

echo -n "  Database (${HOST_DB_PORT}): "
if command -v psql >/dev/null 2>&1 && [[ -n "$POSTGRES_PASSWORD" ]]; then
  if PGPASSWORD="$POSTGRES_PASSWORD" \
    psql -h localhost -p "$HOST_DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" \
    >/dev/null 2>&1; then
    echo "✅ OK"
  else
    echo "❌ FALHOU"
  fi
else
  echo "⚠️  pulado (psql ausente ou senha não configurada)"
fi

echo ""
echo "🌐 URLs de Acesso:"
echo "  Frontend:  ${frontend_url}"
echo "  Backend:   ${backend_url}/api"
echo "  Adminer:   ${adminer_url}"
echo ""
