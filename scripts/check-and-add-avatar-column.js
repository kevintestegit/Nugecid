const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'sgc_itep',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '@Sanfona1',
});

async function checkAndAddAvatarColumn() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna avatar_url existe
    const checkColumnQuery = `
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'avatar_url';
    `;

    const result = await client.query(checkColumnQuery);

    if (result.rows.length === 0) {
      console.log('❌ Coluna avatar_url NÃO existe na tabela usuarios');
      console.log('➕ Adicionando coluna avatar_url...');

      const addColumnQuery = `
        ALTER TABLE "usuarios" ADD COLUMN "avatar_url" VARCHAR(512) NULL;
      `;

      await client.query(addColumnQuery);
      console.log('✅ Coluna avatar_url adicionada com sucesso!');
    } else {
      console.log('✅ Coluna avatar_url JÁ existe na tabela usuarios');
      console.log('📋 Detalhes da coluna:', result.rows[0]);
    }

    // Verificar quantos usuários têm avatar
    const countQuery = `
      SELECT
        COUNT(*) as total_usuarios,
        COUNT(avatar_url) as usuarios_com_avatar,
        COUNT(*) - COUNT(avatar_url) as usuarios_sem_avatar
      FROM usuarios;
    `;

    const countResult = await client.query(countQuery);
    console.log('\n📊 Estatísticas:');
    console.log('  Total de usuários:', countResult.rows[0].total_usuarios);
    console.log('  Com avatar:', countResult.rows[0].usuarios_com_avatar);
    console.log('  Sem avatar:', countResult.rows[0].usuarios_sem_avatar);

    // Mostrar alguns avatarUrl se houver
    if (parseInt(countResult.rows[0].usuarios_com_avatar) > 0) {
      const avatarsQuery = `
        SELECT id, nome, usuario, avatar_url
        FROM usuarios
        WHERE avatar_url IS NOT NULL
        LIMIT 5;
      `;
      const avatarsResult = await client.query(avatarsQuery);
      console.log('\n🖼️  Usuários com avatar:');
      avatarsResult.rows.forEach(user => {
        console.log(`  - ${user.nome} (${user.usuario}): ${user.avatar_url}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Conexão fechada');
  }
}

checkAndAddAvatarColumn()
  .then(() => {
    console.log('\n✨ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
