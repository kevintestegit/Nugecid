import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpiresAtToNotificacoes1770100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificacoes' AND column_name = 'expires_at'
    `);

    if (hasColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "notificacoes"
        ADD COLUMN "expires_at" TIMESTAMP NULL
      `);
    }

    const hasIndex = await queryRunner.query(`
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'notificacoes' AND indexname = 'idx_notificacoes_expires_at'
    `);

    if (hasIndex.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "idx_notificacoes_expires_at"
        ON "notificacoes" ("expires_at")
        WHERE "expires_at" IS NOT NULL AND "deleted_at" IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_notificacoes_expires_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "notificacoes" DROP COLUMN IF EXISTS "expires_at"
    `);
  }
}
