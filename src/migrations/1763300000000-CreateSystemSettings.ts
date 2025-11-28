import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSystemSettings1763300000000 implements MigrationInterface {
  name = "CreateSystemSettings1763300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "system_settings" (
        "id" SERIAL PRIMARY KEY,
        "auto_backup" boolean NOT NULL DEFAULT true,
        "backup_frequency" character varying(20) NOT NULL DEFAULT 'daily',
        "log_level" character varying(10) NOT NULL DEFAULT 'info',
        "maintenance_mode" boolean NOT NULL DEFAULT false,
        "cache_enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )`,
    );

    // Inserir configuração padrão
    await queryRunner.query(
      `INSERT INTO "system_settings"
        ("auto_backup", "backup_frequency", "log_level", "maintenance_mode", "cache_enabled")
       VALUES
        (true, 'daily', 'info', false, true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_settings"`);
  }
}
