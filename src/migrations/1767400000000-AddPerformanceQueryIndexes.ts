import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceQueryIndexes1767400000000
  implements MigrationInterface
{
  name = "AddPerformanceQueryIndexes1767400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefas_data_atualizacao_ativa
      ON tarefas(data_atualizacao DESC)
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefas_prazo_responsavel_ativo
      ON tarefas(prazo, responsavel_id)
      WHERE deleted_at IS NULL AND responsavel_id IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_tarefa_lida
      ON notificacoes(tipo, tarefa_id, lida)
      WHERE tarefa_id IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_tarefa_created
      ON notificacoes(tipo, tarefa_id, created_at DESC)
      WHERE tarefa_id IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_solicitacao_lida
      ON notificacoes(tipo, solicitacao_id, lida)
      WHERE solicitacao_id IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_processo_lida
      ON notificacoes(tipo, processo_id, lida)
      WHERE processo_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notificacoes_tipo_processo_lida;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notificacoes_tipo_solicitacao_lida;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notificacoes_tipo_tarefa_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notificacoes_tipo_tarefa_lida;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_tarefas_prazo_responsavel_ativo;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_tarefas_data_atualizacao_ativa;`,
    );
  }
}
