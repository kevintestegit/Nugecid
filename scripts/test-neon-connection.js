/**
 * Script para migrar dados do PostgreSQL Docker para Neon
 * Usa o driver HTTP do Neon (porta 443) para contornar bloqueios de firewall
 */

const { neon } = require('@neondatabase/serverless');

// Connection string do Neon
const DATABASE_URL = 'postgresql://neondb_owner:npg_wVleKGovz4p8@ep-hidden-credit-a443ybb6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Cria cliente SQL usando HTTP
const sql = neon(DATABASE_URL);

async function testConnection() {
    try {
        console.log('Testando conexão com Neon via HTTP (porta 443)...');
        const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
        console.log('✅ Conexão bem-sucedida!');
        console.log('Hora atual:', result[0].current_time);
        console.log('Versão PostgreSQL:', result[0].pg_version.split(' ').slice(0, 2).join(' '));
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        return false;
    }
}

testConnection();
