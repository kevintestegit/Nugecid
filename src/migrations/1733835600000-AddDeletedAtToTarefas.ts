import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToTarefas1733835600000 implements MigrationInterface {
  name = "AddDeletedAtToTarefas1733835600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tarefas
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefas_deleted_at ON tarefas(deleted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefas_deleted_at;`);
    await queryRunner.query(`
      ALTER TABLE tarefas
        DROP COLUMN IF EXISTS deleted_at;
    `);
  }
}
