/**
 * Script para aplicar migration 004 - Adicionar coluna descricao em anexos
 * Execução: node scripts/apply-migration-004.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sgc_itep',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Conectado ao banco de dados...');
    
    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', '004_add_descricao_to_anexos.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando migration 004_add_descricao_to_anexos.sql...');
    
    // Executar migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration aplicada com sucesso!');
    
    // Verificar se a coluna foi criada
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'desarquivamento_anexos'
      AND column_name = 'descricao';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Coluna "descricao" confirmada na tabela desarquivamento_anexos:');
      console.log('   - Tipo:', result.rows[0].data_type);
      console.log('   - Nullable:', result.rows[0].is_nullable);
    } else {
      console.log('⚠️  Coluna "descricao" não encontrada. Verifique a migration.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
applyMigration()
  .then(() => {
    console.log('🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na execução:', error);
    process.exit(1);
  });
