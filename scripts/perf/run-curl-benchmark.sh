#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PERF_BASE_URL:-http://127.0.0.1:8080}"
USERNAME="${PERF_USERNAME:-kevin}"
PASSWORD="${PERF_PASSWORD:-@Sanfona1}"
REQUESTS="${PERF_REQUESTS:-200}"
CONCURRENCY="${PERF_CONCURRENCY:-20}"
TIMEOUT_SECONDS="${PERF_TIMEOUT_SECONDS:-15}"
LOGIN_FORWARDED_FOR="${PERF_LOGIN_FORWARDED_FOR:-10.250.0.10}"

SCENARIOS=(
  "health|/api/health"
  "nugecid-list|/api/nugecid?page=1&limit=20&sortBy=dataSolicitacao&sortOrder=DESC"
  "pastas-list|/api/pastas"
  "notificacoes-list|/api/notificacoes?page=1&limit=20"
  "global-search|/api/search?query=pro&limit=20&offset=0"
)

percentile() {
  local file="$1"
  local p="$2"
  awk -v p="$p" '
    { arr[++n] = $1 }
    END {
      if (n == 0) {
        printf "0.000"
        exit
      }
      idx = int((p / 100) * n)
      if (idx < 1) idx = 1
      if (idx > n) idx = n
      printf "%.3f", arr[idx]
    }
  ' "$file"
}

login() {
  local response
  response="$(curl -sS -X POST "${BASE_URL}/api/auth/login" \
    -H "content-type: application/json" \
    -H "accept: application/json" \
    -H "x-forwarded-for: ${LOGIN_FORWARDED_FOR}" \
    --data "{\"usuario\":\"${USERNAME}\",\"senha\":\"${PASSWORD}\"}")"

  local token
  token="$(printf "%s" "$response" | node -e '
    const fs = require("fs");
    try {
      const raw = fs.readFileSync(0, "utf8");
      const parsed = JSON.parse(raw);
      process.stdout.write(parsed?.data?.accessToken || "");
    } catch {
      process.stdout.write("");
    }
  ')"

  if [[ -z "$token" ]]; then
    echo "Falha ao obter accessToken no login." >&2
    exit 1
  fi

  printf "%s" "$token"
}

run_scenario() {
  local run_label="$1"
  local scenario_name="$2"
  local scenario_path="$3"
  local token="$4"
  local ip_seed="$5"
  local report_file="$6"

  local raw_file
  raw_file="$(mktemp)"
  local lat_file
  lat_file="$(mktemp)"

  local start_ms end_ms duration_ms
  start_ms="$(date +%s%3N)"

  seq 1 "$REQUESTS" | xargs -I{} -P "$CONCURRENCY" bash -c '
    idx="$1"
    base_url="$2"
    path="$3"
    token="$4"
    timeout_seconds="$5"
    ip_seed="$6"

    oct2=$(( (ip_seed + idx) % 250 + 1 ))
    oct3=$(( (ip_seed * 7 + idx) % 250 + 1 ))
    oct4=$(( (ip_seed * 13 + idx) % 250 + 1 ))
    ip="10.${oct2}.${oct3}.${oct4}"

    curl -sS -o /dev/null \
      --max-time "${timeout_seconds}" \
      -w "%{time_total} %{http_code}\n" \
      -H "accept: application/json" \
      -H "authorization: Bearer ${token}" \
      -H "x-forwarded-for: ${ip}" \
      "${base_url}${path}" || printf "0 000\n"
  ' _ {} "$BASE_URL" "$scenario_path" "$token" "$TIMEOUT_SECONDS" "$ip_seed" >> "$raw_file"

  end_ms="$(date +%s%3N)"
  duration_ms=$((end_ms - start_ms))

  awk '{printf "%.3f\n", ($1 + 0) * 1000}' "$raw_file" | sort -n > "$lat_file"

  local total errors error_rate rps
  total="$(wc -l < "$raw_file" | tr -d " ")"
  errors="$(awk '$2 == "000" || ($2 + 0) >= 400 { c++ } END { print c + 0 }' "$raw_file")"
  error_rate="$(awk -v e="$errors" -v t="$total" 'BEGIN{ if (t == 0) {printf "0.00"} else {printf "%.2f", (e * 100) / t} }')"
  rps="$(awk -v t="$total" -v d="$duration_ms" 'BEGIN{ if (d <= 0) {printf "0.00"} else {printf "%.2f", t / (d / 1000)} }')"

  local min avg p50 p90 p95 p99 max
  min="$(awk 'NR==1{printf "%.3f", $1}' "$lat_file")"
  avg="$(awk '{sum+=$1; n++} END { if (n==0) {printf "0.000"} else {printf "%.3f", sum / n} }' "$lat_file")"
  max="$(awk 'END{printf "%.3f", $1}' "$lat_file")"
  p50="$(percentile "$lat_file" 50)"
  p90="$(percentile "$lat_file" 90)"
  p95="$(percentile "$lat_file" 95)"
  p99="$(percentile "$lat_file" 99)"

  local status_summary
  status_summary="$(awk '
    { count[$2]++ }
    END {
      first = 1
      for (code in count) {
        if (!first) printf ", "
        first = 0
        printf "%s:%d", code, count[code]
      }
    }
  ' "$raw_file")"

  echo "[${run_label}] ${scenario_name} | req=${total} | rps=${rps} | err=${error_rate}% | p50=${p50}ms | p95=${p95}ms | p99=${p99}ms"
  printf "| %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |\n" \
    "$run_label" "$scenario_name" "$total" "$rps" "$errors" "$error_rate" "$min" "$p50" "$p95" "$p99" "$max" "$avg" "$status_summary" \
    >> "$report_file"

  rm -f "$raw_file" "$lat_file"
}

main() {
  local token
  token="$(login)"

  local out_dir stamp report_file
  out_dir="docs/perf"
  mkdir -p "$out_dir"
  stamp="$(date +%Y%m%d_%H%M%S)"
  report_file="${out_dir}/benchmark-${stamp}.md"

  {
    echo "# Benchmark de API"
    echo
    echo "- Gerado em: $(date -Iseconds)"
    echo "- Base URL: ${BASE_URL}"
    echo "- Requisições por cenário: ${REQUESTS}"
    echo "- Concorrência: ${CONCURRENCY}"
    echo "- Timeout por request (s): ${TIMEOUT_SECONDS}"
    echo
    echo "| Run | Cenário | Requests | RPS | Errors | Error % | Min (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Max (ms) | Avg (ms) | Status Codes |"
    echo "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|"
  } > "$report_file"

  local i scenario name path
  i=1
  for scenario in "${SCENARIOS[@]}"; do
    name="${scenario%%|*}"
    path="${scenario#*|}"
    run_scenario "cold" "$name" "$path" "$token" $((100 + i)) "$report_file"
    i=$((i + 1))
  done

  i=1
  for scenario in "${SCENARIOS[@]}"; do
    name="${scenario%%|*}"
    path="${scenario#*|}"
    run_scenario "warm" "$name" "$path" "$token" $((200 + i)) "$report_file"
    i=$((i + 1))
  done

  echo
  echo "Relatório salvo em: ${report_file}"
}

main "$@"
