const { Client } = require('pg');

async function checkMissingColumns() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sgc_itep',
    user: 'postgres',
    password: '@Sanfona1',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Verificar colunas da tabela desarquivamentos
    console.log('📋 Verificando tabela DESARQUIVAMENTOS:');
    const desarquivamentosColumns = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'desarquivamentos'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas existentes:');
    desarquivamentosColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    const hasTypoDesarquivamento = desarquivamentosColumns.rows.find(c => c.column_name === 'tipo_desarquivamento');
    console.log(`\n❓ Coluna "tipo_desarquivamento" existe? ${hasTypoDesarquivamento ? '✅ SIM' : '❌ NÃO'}`);

    // Verificar colunas da tabela tarefas
    console.log('\n\n📋 Verificando tabela TAREFAS:');
    const tarefasColumns = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'tarefas'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas existentes:');
    tarefasColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    const hasDataCriacao = tarefasColumns.rows.find(c => c.column_name === 'data_criacao');
    const hasDataAtualizacao = tarefasColumns.rows.find(c => c.column_name === 'data_atualizacao');
    console.log(`\n❓ Coluna "data_criacao" existe? ${hasDataCriacao ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`❓ Coluna "data_atualizacao" existe? ${hasDataAtualizacao ? '✅ SIM' : '❌ NÃO'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkMissingColumns();
