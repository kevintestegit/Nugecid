import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditoriaIndexes1769000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("auditorias");
    if (!table) return;

    const indexNames = table.indices.map((i) => i.name);

    if (!indexNames.includes("idx_auditorias_user_id")) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_auditorias_user_id" ON "auditorias" ("user_id")`,
      );
    }
    if (!indexNames.includes("idx_auditorias_action")) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_auditorias_action" ON "auditorias" ("action")`,
      );
    }
    if (!indexNames.includes("idx_auditorias_entity")) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_auditorias_entity" ON "auditorias" ("entity_name", "entity_id")`,
      );
    }
    if (!indexNames.includes("idx_auditorias_timestamp")) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_auditorias_timestamp" ON "auditorias" ("timestamp")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditorias_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditorias_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditorias_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditorias_timestamp"`);
  }
}
