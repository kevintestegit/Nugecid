import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTarefasTimestampTrigger1733835000000
  implements MigrationInterface
{
  name = "FixTarefasTimestampTrigger1733835000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Garantir colunas
    await queryRunner.query(`
      ALTER TABLE tarefas
        ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    `);

    // Atualizar registros existentes
    await queryRunner.query(`
      UPDATE tarefas
      SET
        data_criacao = COALESCE(data_criacao, NOW()),
        data_atualizacao = COALESCE(data_atualizacao, NOW())
    `);

    // Dropar trigger/função antigos (que usavam created_at/updated_at inexistentes)
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS tarefas_sync_timestamps ON tarefas;
      DROP FUNCTION IF EXISTS sync_tarefas_timestamps();
    `);

    // Criar função/trigger alinhadas às colunas reais
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_tarefas_timestamps()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW.data_criacao IS NULL THEN
            NEW.data_criacao := NOW();
          END IF;
        END IF;
        NEW.data_atualizacao := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER tarefas_sync_timestamps
      BEFORE INSERT OR UPDATE ON tarefas
      FOR EACH ROW
      EXECUTE FUNCTION sync_tarefas_timestamps();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS tarefas_sync_timestamps ON tarefas;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sync_tarefas_timestamps();`,
    );

    // Não removemos colunas para evitar perda de dados; apenas limpamos defaults.
    await queryRunner.query(`
      ALTER TABLE tarefas
        ALTER COLUMN data_criacao DROP DEFAULT,
        ALTER COLUMN data_atualizacao DROP DEFAULT
    `);
  }
}
