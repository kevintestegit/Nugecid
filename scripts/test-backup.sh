#!/bin/bash

# Script de teste para criar um backup completo
# Este script testa o novo sistema de backup que inclui DB + arquivos

set -e

echo "🔧 Testando sistema de backup completo..."
echo "==========================================="
echo ""

# Entrar no container e executar o backup
echo "📦 Criando backup completo (DB + uploads)..."
docker exec sgc-backend node -e "
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testBackup() {
  console.log('Iniciando teste de backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sqlFilename = \`backup_full_\${timestamp}.sql\`;
  const sqlFilepath = \`/app/backups/\${sqlFilename}\`;
  const tarFilename = \`backup_full_\${timestamp}.tar.gz\`;
  const tarFilepath = \`/app/backups/\${tarFilename}\`;

  try {
    // 1. Backup do banco
    console.log('1️⃣ Fazendo backup do banco de dados...');
    const dbCommand = \`docker exec db pg_dump -U postgres -d sgc_itep --no-owner --no-privileges --clean --if-exists > \${sqlFilepath}\`;
    await execAsync(dbCommand);
    console.log('✅ Backup do banco concluído');

    // 2. Criar tar.gz
    console.log('2️⃣ Compactando banco + uploads...');
    const tarCommand = \`tar -czf \${tarFilepath} -C /app/backups \${sqlFilename} -C /app uploads/\`;
    await execAsync(tarCommand);
    console.log('✅ Compactação concluída');

    // 3. Remover SQL temporário
    fs.unlinkSync(sqlFilepath);

    // 4. Verificar arquivo
    const stats = fs.statSync(tarFilepath);
    console.log(\`✅ Backup criado: \${tarFilename}\`);
    console.log(\`📊 Tamanho: \${(stats.size / 1024).toFixed(2)} KB\`);

    // 5. Listar conteúdo do tar.gz
    console.log('\\n📋 Conteúdo do backup:');
    const listCommand = \`tar -tzf \${tarFilepath} | head -20\`;
    const { stdout } = await execAsync(listCommand);
    console.log(stdout);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testBackup();
"

echo ""
echo "✅ Teste concluído!"
