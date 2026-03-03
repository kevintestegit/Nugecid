/**
 * Script para migrar dados do PostgreSQL Docker para Neon
 * Usa o driver HTTP do Neon (porta 443) para contornar bloqueios de firewall
 */

const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

// Connection string do Neon - MUST be set via environment variable
const DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "❌ NEON_DATABASE_URL não definida. Configure o .env antes de executar.",
  );
  process.exit(1);
}

// Cria cliente SQL usando HTTP
const sql = neon(DATABASE_URL);

async function testConnection() {
  try {
    console.log("Testando conexão com Neon via HTTP (porta 443)...");
    const result =
      await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log("✅ Conexão bem-sucedida!");
    console.log("Hora atual:", result[0].current_time);
    console.log(
      "Versão PostgreSQL:",
      result[0].pg_version.split(" ").slice(0, 2).join(" "),
    );
    return true;
  } catch (error) {
    console.error("❌ Erro na conexão:", error.message);
    return false;
  }
}

testConnection();
