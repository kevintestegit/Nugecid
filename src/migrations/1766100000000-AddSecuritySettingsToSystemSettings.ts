import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecuritySettingsToSystemSettings1766100000000
  implements MigrationInterface
{
  name = "AddSecuritySettingsToSystemSettings1766100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add security columns to system_settings
    await queryRunner.query(`
      ALTER TABLE "system_settings" 
      ADD COLUMN IF NOT EXISTS "session_timeout" integer NOT NULL DEFAULT 30
    `);

    await queryRunner.query(`
      ALTER TABLE "system_settings" 
      ADD COLUMN IF NOT EXISTS "password_expiry" integer NOT NULL DEFAULT 90
    `);

    await queryRunner.query(`
      ALTER TABLE "system_settings" 
      ADD COLUMN IF NOT EXISTS "max_login_attempts" integer NOT NULL DEFAULT 5
    `);

    await queryRunner.query(`
      ALTER TABLE "system_settings" 
      ADD COLUMN IF NOT EXISTS "two_factor_auth" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "system_settings" 
      ADD COLUMN IF NOT EXISTS "require_strong_password" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "require_strong_password"
    `);
    await queryRunner.query(`
      ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "two_factor_auth"
    `);
    await queryRunner.query(`
      ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "max_login_attempts"
    `);
    await queryRunner.query(`
      ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "password_expiry"
    `);
    await queryRunner.query(`
      ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "session_timeout"
    `);
  }
}
