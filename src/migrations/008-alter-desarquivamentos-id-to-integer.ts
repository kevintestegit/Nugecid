import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterDesarquivamentosIdToInteger1756827500000
  implements MigrationInterface
{
  name = "AlterDesarquivamentosIdToInteger1756827500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableCheck = await queryRunner.query(
      `SELECT to_regclass('public.desarquivamentos') AS exists`,
    );
    if (!tableCheck?.length || tableCheck[0].exists === null) {
      console.log("Tabela desarquivamentos inexistente - nada a alterar.");
      return;
    }

    const columnType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'desarquivamentos' AND column_name = 'id'
    `);
    if (
      columnType?.length &&
      ["integer", "bigint"].includes(
        (columnType[0].data_type || "").toLowerCase(),
      )
    ) {
      console.log(
        "Coluna desarquivamentos.id já é inteira - migração ignorada.",
      );
      return;
    }

    console.log("🔄 Iniciando migração: Alterando ID de UUID para INTEGER...");

    // Verificar se existem dados na tabela
    const hasData = await queryRunner.query(
      `SELECT COUNT(*) as count FROM desarquivamentos WHERE deleted_at IS NULL`,
    );

    const recordCount = parseInt(hasData[0].count);
    console.log(
      `📊 Encontrados ${recordCount} registros na tabela desarquivamentos`,
    );

    if (recordCount > 0) {
      console.log("⚠️  ATENÇÃO: Existem dados na tabela. Criando backup...");

      // Criar tabela de backup
      await queryRunner.query(`
        CREATE TABLE desarquivamentos_backup AS 
        SELECT * FROM desarquivamentos
      `);

      console.log("✅ Backup criado: desarquivamentos_backup");
    }

    // Remover foreign keys
    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      DROP CONSTRAINT IF EXISTS "FK_desarquivamentos_created_by"
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos 
      DROP CONSTRAINT IF EXISTS "FK_desarquivamentos_responsavel_id"
    `);

    // Remover índices
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_NUMERO_NIC"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_STATUS"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_TIPO"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_CREATED_BY"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_RESPONSAVEL"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_URGENTE"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_DELETED_AT"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_SETOR"',
    );

    // Remover a tabela original
    await queryRunner.query("DROP TABLE desarquivamentos");

    // Criar nova tabela com ID integer
    await queryRunner.query(`
      CREATE TABLE desarquivamentos (
        id SERIAL PRIMARY KEY,
        tipo_desarquivamento VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
        nome_completo VARCHAR(255) NOT NULL,
        numero_nic_laudo_auto VARCHAR(100) NOT NULL,
        numero_processo VARCHAR(100),
        tipo_documento VARCHAR(255) NOT NULL,
        data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_desarquivamento_sag TIMESTAMPTZ,
        data_devolucao_setor TIMESTAMPTZ,
        setor_demandante VARCHAR(255) NOT NULL,
        servidor_responsavel VARCHAR(255) NOT NULL,
        finalidade_desarquivamento TEXT NOT NULL,
        solicitacao_prorrogacao BOOLEAN NOT NULL DEFAULT false,
        urgente BOOLEAN NOT NULL DEFAULT false,
        created_by UUID NOT NULL,
        responsavel_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      )
    `);

    if (recordCount > 0) {
      // Migrar dados do backup para a nova tabela
      await queryRunner.query(`
        INSERT INTO desarquivamentos (
          tipo_desarquivamento, status, nome_completo, numero_nic_laudo_auto,
          numero_processo, tipo_documento, data_solicitacao, data_desarquivamento_sag,
          data_devolucao_setor, setor_demandante, servidor_responsavel,
          finalidade_desarquivamento, solicitacao_prorrogacao, urgente,
          created_by, responsavel_id, created_at, updated_at, deleted_at
        )
        SELECT 
          tipo_desarquivamento::text, status::text, nome_completo, numero_nic_laudo_auto,
          numero_processo, tipo_documento, data_solicitacao, data_desarquivamento_sag,
          data_devolucao_setor, setor_demandante, servidor_responsavel,
          finalidade_desarquivamento, solicitacao_prorrogacao, urgente,
          created_by, responsavel_id, created_at, updated_at, deleted_at
        FROM desarquivamentos_backup
        ORDER BY created_at ASC
      `);

      console.log("✅ Dados migrados com sucesso");

      // Remover tabela de backup
      await queryRunner.query("DROP TABLE desarquivamentos_backup");
    }

    // Recriar foreign keys
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

    // Recriar índices
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_DESARQUIVAMENTOS_NUMERO_NIC" ON "desarquivamentos" ("numero_nic_laudo_auto")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_STATUS" ON "desarquivamentos" ("status")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_TIPO" ON "desarquivamentos" ("tipo_desarquivamento")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO" ON "desarquivamentos" ("data_solicitacao")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_CREATED_BY" ON "desarquivamentos" ("created_by")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_RESPONSAVEL" ON "desarquivamentos" ("responsavel_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_URGENTE" ON "desarquivamentos" ("urgente")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_DELETED_AT" ON "desarquivamentos" ("deleted_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_SETOR" ON "desarquivamentos" ("setor_demandante")',
    );

    console.log("✅ Migração concluída: ID alterado de UUID para INTEGER");
    console.log("🔢 Novos registros terão IDs numéricos sequenciais");
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

    // Remover índices
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_NUMERO_NIC"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_STATUS"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_TIPO"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_CREATED_BY"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_RESPONSAVEL"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_URGENTE"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_DELETED_AT"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_SETOR"',
    );

    // Remover tabela
    await queryRunner.query("DROP TABLE desarquivamentos");

    // Recriar tabela com UUID (estrutura original)
    await queryRunner.query(`
      CREATE TABLE desarquivamentos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tipo_desarquivamento tipo_desarquivamento_enum NOT NULL,
        status status_desarquivamento_enum NOT NULL DEFAULT 'PENDENTE',
        nome_completo VARCHAR(255) NOT NULL,
        numero_nic_laudo_auto VARCHAR(100) NOT NULL,
        numero_processo VARCHAR(100),
        tipo_documento VARCHAR(255) NOT NULL,
        data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_desarquivamento_sag TIMESTAMPTZ,
        data_devolucao_setor TIMESTAMPTZ,
        setor_demandante VARCHAR(255) NOT NULL,
        servidor_responsavel VARCHAR(255) NOT NULL,
        finalidade_desarquivamento TEXT NOT NULL,
        solicitacao_prorrogacao BOOLEAN NOT NULL DEFAULT false,
        urgente BOOLEAN NOT NULL DEFAULT false,
        created_by UUID NOT NULL,
        responsavel_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      )
    `);

    // Recriar foreign keys
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

    // Recriar índices
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_DESARQUIVAMENTOS_NUMERO_NIC" ON "desarquivamentos" ("numero_nic_laudo_auto")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_STATUS" ON "desarquivamentos" ("status")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_TIPO" ON "desarquivamentos" ("tipo_desarquivamento")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO" ON "desarquivamentos" ("data_solicitacao")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_CREATED_BY" ON "desarquivamentos" ("created_by")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_RESPONSAVEL" ON "desarquivamentos" ("responsavel_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_URGENTE" ON "desarquivamentos" ("urgente")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_DELETED_AT" ON "desarquivamentos" ("deleted_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_DESARQUIVAMENTOS_SETOR" ON "desarquivamentos" ("setor_demandante")',
    );

    console.log("✅ Reversão concluída: ID alterado de INTEGER para UUID");
  }
}
