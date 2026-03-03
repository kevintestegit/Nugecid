const { Client } = require("pg");
require("dotenv").config();

async function checkUsuariosTable() {
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

    // Verificar se a tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'usuarios'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela "usuarios" existe\n');

      // Contar registros
      const count = await client.query("SELECT COUNT(*) FROM usuarios;");
      console.log(`📊 Total de usuários: ${count.rows[0].count}\n`);

      // Mostrar estrutura
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
        ORDER BY ordinal_position;
      `);

      console.log("📋 Estrutura da tabela usuarios:");
      structure.rows.forEach((col) => {
        console.log(
          `  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
        );
      });
    } else {
      console.log('❌ Tabela "usuarios" NÃO existe');
      console.log("\n🔧 Execute as migrações com: npm run migration:run");
    }

    // Listar todas as tabelas
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("\n📚 Tabelas existentes no banco:");
    tables.rows.forEach((table) => {
      console.log(`  - ${table.tablename}`);
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
  }
}

checkUsuariosTable();
