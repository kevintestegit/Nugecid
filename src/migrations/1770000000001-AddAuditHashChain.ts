import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditHashChain1770000000001 implements MigrationInterface {
  name = "AddAuditHashChain1770000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auditorias"
      ADD COLUMN IF NOT EXISTS "previous_hash" VARCHAR(64) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "auditorias"
      ADD COLUMN IF NOT EXISTS "hash" VARCHAR(64) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_auditorias_hash"
      ON "auditorias" ("hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditorias_hash"`);
    await queryRunner.query(`
      ALTER TABLE "auditorias"
      DROP COLUMN IF EXISTS "hash"
    `);
    await queryRunner.query(`
      ALTER TABLE "auditorias"
      DROP COLUMN IF EXISTS "previous_hash"
    `);
  }
}
