import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleSettings1757945400000 implements MigrationInterface {
  name = "AddRoleSettings1757945400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add jsonb column 'settings' to roles, default empty object
    await queryRunner.query(`
      ALTER TABLE roles
      ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    // Optional index for querying by theme if needed later
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'roles' AND indexname = 'IDX_ROLES_SETTINGS'
        ) THEN
          CREATE INDEX "IDX_ROLES_SETTINGS" ON roles USING GIN (settings);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_ROLES_SETTINGS"');
    await queryRunner.query("ALTER TABLE roles DROP COLUMN IF EXISTS settings");
  }
}
