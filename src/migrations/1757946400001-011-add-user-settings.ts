import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSettings1757946400001 implements MigrationInterface {
  name = "AddUserSettings1757946400001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'usuarios' AND indexname = 'IDX_USUARIOS_SETTINGS'
        ) THEN
          CREATE INDEX "IDX_USUARIOS_SETTINGS" ON usuarios USING GIN (settings);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_USUARIOS_SETTINGS"');
    await queryRunner.query(
      "ALTER TABLE usuarios DROP COLUMN IF EXISTS settings",
    );
  }
}
