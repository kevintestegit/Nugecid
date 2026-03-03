import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUsuariosIdToInteger1757339200000
  implements MigrationInterface
{
  name = "AlterUsuariosIdToInteger1757339200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableCheck = await queryRunner.query(
      `SELECT to_regclass('public.usuarios') AS exists`,
    );
    if (!tableCheck?.length || tableCheck[0].exists === null) {
      console.log("Tabela usuarios inexistente - nada a alterar.");
      return;
    }

    const columnType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'id'
    `);
    if (
      columnType?.length &&
      ["integer", "bigint"].includes(
        (columnType[0].data_type || "").toLowerCase(),
      )
    ) {
      console.log("Coluna usuarios.id já é inteira - migração ignorada.");
      return;
    }

    console.log(
      "🔄 Iniciando migração: Alterando ID da tabela usuarios de UUID para INTEGER...",
    );

    // Verificar se existem dados na tabela
    const hasData = await queryRunner.query(
      `SELECT COUNT(*) as count FROM usuarios WHERE deleted_at IS NULL`,
    );

    const recordCount = parseInt(hasData[0].count);
    console.log(`📊 Encontrados ${recordCount} registros na tabela usuarios`);

    if (recordCount > 0) {
      console.log("⚠️  ATENÇÃO: Existem dados na tabela. Criando backup...");

      // Criar tabela de backup
      await queryRunner.query(`
        CREATE TABLE usuarios_backup AS 
        SELECT * FROM usuarios
      `);

      console.log("✅ Backup criado com sucesso!");
    }

    // Remover foreign keys que referenciam usuarios
    console.log("🔗 Removendo foreign keys...");

    const foreignKeys = await queryRunner.query(`
      SELECT tc.table_name as "table", tc.constraint_name as "constraint"
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'usuarios'
    `);

    for (const fk of foreignKeys) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table}" DROP CONSTRAINT IF EXISTS "${fk.constraint}"`,
      );
    }

    // Remover índices
    console.log("📇 Removendo índices...");
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_USUARIO"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_ATIVO"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_ROLE_ID"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_DELETED_AT"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_TOKEN_RESET"');

    // Remover a tabela original
    await queryRunner.query("DROP TABLE usuarios");

    // Criar nova tabela com ID integer
    console.log("🏗️  Criando nova tabela usuarios com ID integer...");
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        role_id INTEGER NOT NULL,
        ultimo_login TIMESTAMPTZ,
        ativo BOOLEAN NOT NULL DEFAULT true,
        tentativas_login INTEGER NOT NULL DEFAULT 0,
        bloqueado_ate TIMESTAMPTZ,
        token_reset VARCHAR(255),
        token_reset_expira TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      )
    `);

    if (recordCount > 0) {
      // Migrar dados do backup para a nova tabela
      console.log("📦 Migrando dados do backup...");
      await queryRunner.query(`
        INSERT INTO usuarios (
          nome, usuario, senha, role_id, ultimo_login, ativo,
          tentativas_login, bloqueado_ate, token_reset, token_reset_expira,
          created_at, updated_at, deleted_at
        )
        SELECT 
          nome, usuario, senha, 
          CASE 
            WHEN role_id::text = '550e8400-e29b-41d4-a716-446655440000' THEN 1  -- Admin
            WHEN role_id::text = '550e8400-e29b-41d4-a716-446655440001' THEN 2  -- Coordenador
            WHEN role_id::text = '550e8400-e29b-41d4-a716-446655440002' THEN 3  -- Usuario
            ELSE 3  -- Default para Usuario
          END as role_id,
          ultimo_login, ativo, tentativas_login, bloqueado_ate,
          token_reset, token_reset_expira, created_at, updated_at, deleted_at
        FROM usuarios_backup
        ORDER BY created_at
      `);

      console.log("✅ Dados migrados com sucesso!");

      // Remover tabela de backup
      await queryRunner.query("DROP TABLE usuarios_backup");
    }

    // Recriar foreign key para roles (agora com integer)
    console.log("🔗 Recriando foreign keys...");
    await queryRunner.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT "FK_usuarios_role_id" 
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    // Recriar foreign keys de outras tabelas para usuarios
    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      ADD CONSTRAINT "FK_desarquivamentos_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      ADD CONSTRAINT "FK_desarquivamentos_responsavel_id" 
      FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    // Recriar foreign key de auditorias (se existir)
    await queryRunner.query(`
      ALTER TABLE auditorias 
      ADD CONSTRAINT "FK_auditorias_usuario_id" 
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    // Recriar índices
    console.log("📇 Recriando índices...");
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_USUARIOS_USUARIO" ON "usuarios" ("usuario")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_ATIVO" ON "usuarios" ("ativo")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_ROLE_ID" ON "usuarios" ("role_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_DELETED_AT" ON "usuarios" ("deleted_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_TOKEN_RESET" ON "usuarios" ("token_reset")',
    );

    console.log("✅ Migração concluída com sucesso!");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(
      "⚠️  ATENÇÃO: Reverter esta migração pode causar perda de dados!",
    );

    // Remover foreign keys
    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      DROP CONSTRAINT IF EXISTS "FK_desarquivamentos_created_by"
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      DROP CONSTRAINT IF EXISTS "FK_desarquivamentos_responsavel_id"
    `);

    await queryRunner.query(`
      ALTER TABLE auditorias 
      DROP CONSTRAINT IF EXISTS "FK_auditorias_usuario_id"
    `);

    await queryRunner.query(`
      ALTER TABLE usuarios 
      DROP CONSTRAINT IF EXISTS "FK_usuarios_role_id"
    `);

    // Remover índices
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_USUARIO"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_ATIVO"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_ROLE_ID"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_DELETED_AT"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_TOKEN_RESET"');

    // Recriar tabela com UUID
    await queryRunner.query("DROP TABLE usuarios");

    await queryRunner.query(`
      CREATE TABLE usuarios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        role_id UUID NOT NULL,
        ultimo_login TIMESTAMPTZ,
        ativo BOOLEAN NOT NULL DEFAULT true,
        tentativas_login INTEGER NOT NULL DEFAULT 0,
        bloqueado_ate TIMESTAMPTZ,
        token_reset VARCHAR(255),
        token_reset_expira TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      )
    `);

    // Recriar foreign keys com UUID
    await queryRunner.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT "FK_usuarios_role_id" 
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      ADD CONSTRAINT "FK_desarquivamentos_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      ADD CONSTRAINT "FK_desarquivamentos_responsavel_id" 
      FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE auditorias 
      ADD CONSTRAINT "FK_auditorias_usuario_id" 
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    // Recriar índices
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_USUARIOS_USUARIO" ON "usuarios" ("usuario")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_ATIVO" ON "usuarios" ("ativo")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_ROLE_ID" ON "usuarios" ("role_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_DELETED_AT" ON "usuarios" ("deleted_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_USUARIOS_TOKEN_RESET" ON "usuarios" ("token_reset")',
    );
  }
}
