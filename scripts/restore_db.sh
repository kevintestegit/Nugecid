#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "Uso: scripts/restore_db.sh backups/sgc_YYYYMMDD_HHMMSS.dump"
  exit 1
fi

dump_file="$1"

if [ ! -f "$dump_file" ]; then
  echo "[x] Arquivo não encontrado: $dump_file"
  exit 1
fi

mkdir -p backups

dump_basename=$(basename "$dump_file")
if [ "$dump_file" != "backups/${dump_basename}" ]; then
  cp "$dump_file" "backups/${dump_basename}"
  dump_file="backups/${dump_basename}"
fi

docker compose up -d db >/dev/null

docker compose exec -T db sh -c "psql -U \"\$POSTGRES_USER\" -tc \"SELECT 1 FROM pg_database WHERE datname = '\$POSTGRES_DB'\" | grep -q 1 || psql -U \"\$POSTGRES_USER\" -c \"CREATE DATABASE \\\"\$POSTGRES_DB\\\";\""

docker compose exec -T db sh -c "pg_restore -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"/backups/${dump_basename}\""

echo "[ok] Restore concluído."
