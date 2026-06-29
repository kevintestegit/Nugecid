#!/usr/bin/env bash
# Sincroniza os backups locais para armazenamento off-site (S3/MinIO).
# Requer aws-cli (ou rclone) configurado com credenciais STORAGE_S3_*.
# Uso: ./scripts/backup-offsite-sync.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
S3_BUCKET="${STORAGE_S3_BUCKET:-}"
S3_ENDPOINT="${STORAGE_S3_ENDPOINT:-}"
S3_ACCESS_KEY="${STORAGE_S3_ACCESS_KEY_ID:-}"
S3_SECRET_KEY="${STORAGE_S3_SECRET_ACCESS_KEY:-}"
S3_REGION="${STORAGE_S3_REGION:-us-east-1}"
DEST_PREFIX="${BACKUP_S3_PREFIX:-backups}"

if [ -z "$S3_BUCKET" ] || [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
  echo "[backup-offsite] STORAGE_S3_BUCKET / ACCESS_KEY / SECRET_KEY não configurados." >&2
  echo "[backup-offsite] Defina as variáveis STORAGE_S3_* para habilitar a replicação off-site." >&2
  exit 2
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "[backup-offsite] aws-cli não encontrado. Instale: pip install awscli ou use rclone." >&2
  exit 3
fi

echo "[backup-offsite] Sincronizando ${BACKUP_DIR} -> s3://${S3_BUCKET}/${DEST_PREFIX}"

AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
AWS_DEFAULT_REGION="$S3_REGION" \
aws s3 sync "$BACKUP_DIR" "s3://${S3_BUCKET}/${DEST_PREFIX}/" \
  --no-follow-symlinks \
  --exclude "*.tmp" \
  ${S3_ENDPOINT:+--endpoint-url "$S3_ENDPOINT"}

echo "[backup-offsite] Sincronização concluída em $(date -Is)."
