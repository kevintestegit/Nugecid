#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups

timestamp=$(date +'%Y%m%d_%H%M%S')
dump_name="sgc_${timestamp}.dump"
dump_path="backups/${dump_name}"

docker compose up -d db >/dev/null

docker compose exec -T db sh -c "pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -F c -f \"/backups/${dump_name}\""

echo "[ok] Backup criado: ${dump_path}"
