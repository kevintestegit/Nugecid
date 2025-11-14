#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[i] Copiado .env.example para .env. Ajuste as variáveis conforme necessário."
fi

mkdir -p backups

docker compose pull || true
docker compose up -d
docker compose ps
