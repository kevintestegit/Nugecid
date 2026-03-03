#!/bin/bash
set -euo pipefail
CERT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY_FILE="$CERT_DIR/server.key"
CRT_FILE="$CERT_DIR/server.crt"

if [ -f "$KEY_FILE" ] && [ -f "$CRT_FILE" ]; then
  echo "SSL certs already exist. Skipping generation."
  echo "To regenerate, delete $KEY_FILE and $CRT_FILE and re-run this script."
  exit 0
fi

echo "Generating self-signed PostgreSQL SSL certificate (valid 365 days)..."
openssl req -new -x509 -days 365 -nodes -text \
  -out "$CRT_FILE" \
  -keyout "$KEY_FILE" \
  -subj "/CN=sgc-itep-db"

chmod 600 "$KEY_FILE"
chmod 644 "$CRT_FILE"

echo "Certificates generated:"
echo "  Key:  $KEY_FILE"
echo "  Cert: $CRT_FILE"
echo ""
echo "IMPORTANT: For production, replace these with proper CA-signed certificates."
