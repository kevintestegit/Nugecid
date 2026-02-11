import { MigrationInterface, QueryRunner } from "typeorm";

export class FixComentariosTimestamps1733835400000
  implements MigrationInterface
{
  name = "FixComentariosTimestamps1733835400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE comentarios
        ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE comentarios
      SET
        data_criacao = COALESCE(data_criacao, created_at, CURRENT_TIMESTAMP),
        data_atualizacao = COALESCE(data_atualizacao, updated_at, CURRENT_TIMESTAMP)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_comentarios_data ON comentarios(data_criacao);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_comentarios_data;`);
    await queryRunner.query(`
      ALTER TABLE comentarios
        DROP COLUMN IF EXISTS data_atualizacao,
        DROP COLUMN IF EXISTS data_criacao
    `);
  }
}
