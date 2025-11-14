#!/bin/bash

set -e

cd "/home/gecid-004/Área de trabalho/SGC-ITEP-NESTJS"

timestamp=$(date +%Y-%m-%dT%H-%M-%S)
sql_file="backups/backup_test_${timestamp}.sql"
tar_file="backups/backup_test_${timestamp}.tar.gz"

echo "🔧 Criando backup de teste: backup_test_${timestamp}.tar.gz"
echo ""

# 1. Backup do banco
echo "1️⃣ Fazendo backup do banco de dados..."
/usr/bin/docker exec sgc-itep-nestjs-db-1 pg_dump \
    -U postgres \
    -d sgc_itep \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists > "$sql_file" 2>/dev/null

echo "✅ Banco exportado ($(ls -lh "$sql_file" | awk '{print $5}'))"

# 2. Compactar com uploads
echo ""
echo "2️⃣ Compactando banco + uploads..."
tar -czf "$tar_file" \
    -C backups "$(basename "$sql_file")" \
    -C "/home/gecid-004/Área de trabalho/SGC-ITEP-NESTJS" uploads/

echo "✅ Compactação concluída ($(ls -lh "$tar_file" | awk '{print $5}'))"

# 3. Remover SQL temporário
rm "$sql_file"
echo "🧹 Arquivo SQL temporário removido"

# 4. Listar conteúdo
echo ""
echo "📋 Conteúdo do backup:"
tar -tzf "$tar_file" | head -20

echo ""
echo "✅ Backup criado com sucesso: $tar_file"
