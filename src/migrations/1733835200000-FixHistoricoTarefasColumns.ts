import { MigrationInterface, QueryRunner } from "typeorm";

export class FixHistoricoTarefasColumns1733835200000
  implements MigrationInterface
{
  name = "FixHistoricoTarefasColumns1733835200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE historico_tarefas
        ADD COLUMN IF NOT EXISTS campo_alterado VARCHAR(100),
        ADD COLUMN IF NOT EXISTS valor_anterior TEXT,
        ADD COLUMN IF NOT EXISTS valor_novo TEXT,
        ADD COLUMN IF NOT EXISTS data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE historico_tarefas
        DROP COLUMN IF EXISTS data_acao,
        DROP COLUMN IF EXISTS valor_novo,
        DROP COLUMN IF EXISTS valor_anterior,
        DROP COLUMN IF EXISTS campo_alterado
    `);
  }
}
