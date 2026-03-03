import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceListIndexes1766700000000
  implements MigrationInterface
{
  name = "AddPerformanceListIndexes1766700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_desarq_active_data_id_desc"
      ON "desarquivamentos" ("data_solicitacao" DESC, "id" DESC)
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_desarq_deleted_at_id_desc"
      ON "desarquivamentos" ("deleted_at" DESC, "id" DESC)
      WHERE "deleted_at" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_pastas_criado_por_data_desc"
      ON "pastas" ("criado_por_id", "data_criacao" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notificacoes_usuario_priority_created_desc"
      ON "notificacoes" (
        "usuario_id",
        (
          CASE "prioridade"
            WHEN 'critica' THEN 1
            WHEN 'alta' THEN 2
            WHEN 'media' THEN 3
            WHEN 'baixa' THEN 4
            ELSE 5
          END
        ),
        "created_at" DESC,
        "id" DESC
      )
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_notificacoes_usuario_priority_created_desc"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_pastas_criado_por_data_desc"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_desarq_deleted_at_id_desc"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_desarq_active_data_id_desc"`,
    );
  }
}
