#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

HOST_BACKEND_PORT="${HOST_BACKEND_PORT:-8080}"
HOST_FRONTEND_PORT="${HOST_FRONTEND_PORT:-3001}"
SMOKE_USER="${SMOKE_USER:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"

backend_url="http://localhost:${HOST_BACKEND_PORT}"
frontend_url="http://localhost:${HOST_FRONTEND_PORT}"

step() {
  echo ""
  echo "== $1 =="
}

assert_http_code() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local status
  status="$(curl -k -sS -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$status" != "$expected" ]]; then
    echo "${label}: esperado ${expected}, recebido ${status:-sem resposta}" >&2
    return 1
  fi
  echo "${label}: ok (${status})"
}

assert_body_contains() {
  local label="$1"
  local body="$2"
  local expected="$3"
  if [[ "$body" != *"$expected"* ]]; then
    echo "${label}: resposta não contém '${expected}'" >&2
    return 1
  fi
  echo "${label}: ok"
}

step "Infra"
docker compose ps

step "HTTP básico"
assert_http_code "Frontend" "${frontend_url}/" "200"
assert_http_code "Liveness" "${backend_url}/health" "200"
assert_http_code "Readiness" "${backend_url}/ready" "200"

step "Health detalhado"
assert_http_code "Metrics sem autenticação" "${backend_url}/api/health/metrics" "401"

if [[ -n "$SMOKE_USER" && -n "$SMOKE_PASSWORD" ]]; then
  step "Login e sessão"
  login_payload="$(printf '{"usuario":"%s","senha":"%s"}' "$SMOKE_USER" "$SMOKE_PASSWORD")"
  login_response="$(curl -k -sS -c "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -X POST "${backend_url}/api/auth/login" \
    --data "$login_payload")"
  assert_body_contains "Login" "$login_response" "\"success\":true"

  profile_response="$(curl -k -sS -b "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    "${backend_url}/api/auth/profile")"
  assert_body_contains "Profile" "$profile_response" "\"usuario\""

  refresh_response="$(curl -k -sS -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    -X POST "${backend_url}/api/auth/refresh")"
  assert_body_contains "Refresh" "$refresh_response" "\"accessToken\""

  metrics_response="$(curl -k -sS -b "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    "${backend_url}/api/health/metrics")"
  assert_body_contains "Metrics autenticado" "$metrics_response" "\"timestamp\""

  curl -k -sS -b "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    -X POST "${backend_url}/api/auth/logout" >/dev/null

  logout_status="$(curl -k -sS -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" \
    -H 'Accept: application/json' \
    "${backend_url}/api/auth/profile" || true)"
  if [[ "$logout_status" != "401" ]]; then
    echo "Logout: esperado 401 após logout, recebido ${logout_status}" >&2
    exit 1
  fi
  echo "Logout: ok (401 após limpeza de sessão)"
else
  echo "Login e sessão: pulado (defina SMOKE_USER e SMOKE_PASSWORD para validar auth e health detalhado autenticado)"
fi

echo ""
echo "Smoke test concluído com sucesso."
