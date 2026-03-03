const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function applyFix() {
  if (!process.env.DATABASE_PASSWORD) {
    console.error(
      "❌ DATABASE_PASSWORD não definida. Configure o .env antes de executar.",
    );
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME || "sgc_itep",
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    await client.connect();
    console.log("✅ Conectado ao banco de dados\n");

    // Ler o script SQL
    const sqlPath = path.join(__dirname, "fix-missing-columns.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("📝 Aplicando correções...\n");

    // Executar o script
    await client.query(sql);

    console.log("✅ Correções aplicadas com sucesso!\n");

    // Verificar resultado
    const verification = await client.query(`
      SELECT
        'tarefas' AS tabela,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'tarefas'
        AND column_name IN ('data_criacao', 'data_atualizacao')
      UNION ALL
      SELECT
        'desarquivamentos' AS tabela,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'desarquivamentos'
        AND column_name = 'tipo_desarquivamento'
      ORDER BY tabela, column_name;
    `);

    console.log("📋 Verificação das colunas criadas:");
    console.table(verification.rows);

    // Verificar dados
    const dataCounts = await client.query(`
      SELECT
        'tarefas' AS tabela,
        COUNT(*) AS total,
        COUNT(data_criacao) AS com_data_criacao,
        COUNT(data_atualizacao) AS com_data_atualizacao
      FROM tarefas
      UNION ALL
      SELECT
        'desarquivamentos' AS tabela,
        COUNT(*) AS total,
        COUNT(tipo_desarquivamento) AS com_tipo,
        0
      FROM desarquivamentos;
    `);

    console.log("\n📊 Contagem de registros:");
    console.table(dataCounts.rows);

    console.log("\n✅ Processo concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar correções:", error.message);
    console.error("\nDetalhes:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix();
