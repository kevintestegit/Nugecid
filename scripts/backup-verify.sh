#!/usr/bin/env bash
# Verifica a integridade dos backups locais sem restaurar no banco.
# Checa: (1) tar.gz não está corrompido, (2) o dump SQL interno contém
# comandos DDL esperados. Use em cron ou CI para validar RPO.
# Uso: ./scripts/backup-verify.sh [caminho-do-backup.tar.gz]
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  TARGET="$(ls -t "${BACKUP_DIR}"/backup_full_*.tar.gz 2>/dev/null | head -n1 || true)"
fi

if [ -z "$TARGET" ] || [ ! -f "$TARGET" ]; then
  echo "[backup-verify] Nenhum backup full encontrado em ${BACKUP_DIR}." >&2
  exit 1
fi

echo "[backup-verify] Validando: ${TARGET}"

if ! tar -tzf "$TARGET" >/dev/null 2>&1; then
  echo "[backup-verify] FALHA: arquivo tar.gz corrompido." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

SQL_FILE="$(tar -tzf "$TARGET" | grep -E '\.(sql|sql\.gz)$' | head -n1 || true)"
if [ -z "$SQL_FILE" ]; then
  echo "[backup-verify] AVISO: nenhum dump SQL encontrado dentro do tar.gz." >&2
  exit 0
fi

tar -xzf "$TARGET" -C "$TMP_DIR" "$SQL_FILE" 2>/dev/null || true
EXTRACTED="${TMP_DIR}/${SQL_FILE}"

if [ ! -f "$EXTRACTED" ]; then
  echo "[backup-verify] FALHA: não foi possível extrair ${SQL_FILE}." >&2
  exit 1
fi

# Conteúdo do dump: gzip ou texto plano
DUMP_TEXT=""
case "$SQL_FILE" in
  *.gz) DUMP_TEXT="$(zcat "$EXTRACTED" 2>/dev/null || true)" ;;
  *)   DUMP_TEXT="$(cat "$EXTRACTED" 2>/dev/null || true)" ;;
esac

if [ -z "$DUMP_TEXT" ]; then
  echo "[backup-verify] FALHA: dump SQL vazio ou ilegível." >&2
  exit 1
fi

DDL_COUNT="$(printf '%s' "$DUMP_TEXT" | grep -cE '^CREATE (TABLE|INDEX|TYPE|FUNCTION)|^COPY ' || true)"

if [ "$DDL_COUNT" -lt 5 ]; then
  echo "[backup-verify] FALHA: dump SQL com poucos comandos DDL/COPY (${DDL_COUNT}). Backup possivelmente incompleto." >&2
  exit 1
fi

SIZE="$(stat -c%s "$TARGET" 2>/dev/null || stat -f%z "$TARGET")"
echo "[backup-verify] OK: ${TARGET}"
echo "[backup-verify]   Tamanho: $((SIZE / 1024)) KB"
echo "[backup-verify]   Dump: ${SQL_FILE}"
echo "[backup-verify]   Comandos DDL/COPY: ${DDL_COUNT}"
