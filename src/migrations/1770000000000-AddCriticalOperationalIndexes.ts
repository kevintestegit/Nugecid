import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCriticalOperationalIndexes1770000000000
  implements MigrationInterface
{
  name = "AddCriticalOperationalIndexes1770000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_desarq_status_solicitacao_id_active"
      ON "desarquivamentos" ("status", "data_solicitacao" DESC, "id" DESC)
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_desarq_responsavel_status_active"
      ON "desarquivamentos" ("responsavel_id", "status")
      WHERE "deleted_at" IS NULL AND "responsavel_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_desarq_text_search_trgm"
      ON "desarquivamentos" USING gin (
        (
          COALESCE("numero_processo", '') || ' ' ||
          COALESCE("numero_oficio", '') || ' ' ||
          COALESCE("numero_nic_laudo_auto", '') || ' ' ||
          COALESCE("requerente", '')
        ) gin_trgm_ops
      )
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_auditorias_timestamp_id_desc"
      ON "auditorias" ("timestamp" DESC, "id" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_auditorias_filters"
      ON "auditorias" ("action", "entity_name", "user_id", "success", "timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tarefas_board_order_active"
      ON "tarefas" ("projeto_id", "coluna_id", "ordem", "id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tarefas_responsavel_prazo_active"
      ON "tarefas" ("responsavel_id", "prazo" ASC, "id")
      WHERE "deleted_at" IS NULL AND "responsavel_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_tarefas_responsavel_prazo_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_tarefas_board_order_active"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditorias_filters"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_auditorias_timestamp_id_desc"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_desarq_text_search_trgm"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_desarq_responsavel_status_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_desarq_status_solicitacao_id_active"`,
    );
  }
}
