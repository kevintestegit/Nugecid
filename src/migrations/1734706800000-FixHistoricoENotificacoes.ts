import { MigrationInterface, QueryRunner } from "typeorm";

export class FixHistoricoENotificacoes1734706800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const notificacoesTable = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'notificacoes'
    `);

    if (notificacoesTable.length === 0) {
      // Nothing to update if table does not exist yet
      return;
    }

    // Verificar e criar coluna tarefa_id em notificacoes se não existir
    const notificacoesHasTarefaId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='tarefa_id'
    `);

    if (notificacoesHasTarefaId.length === 0) {
      await queryRunner.query(`
        ALTER TABLE notificacoes 
        ADD COLUMN tarefa_id INTEGER NULL
      `);

      await queryRunner.query(`
        ALTER TABLE notificacoes
        ADD CONSTRAINT FK_notificacoes_tarefa
        FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE
      `);
    }

    // Verificar e criar coluna projeto_id em notificacoes se não existir
    const notificacoesHasProjetoId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='projeto_id'
    `);

    if (notificacoesHasProjetoId.length === 0) {
      await queryRunner.query(`
        ALTER TABLE notificacoes 
        ADD COLUMN projeto_id INTEGER NULL
      `);
    }

    // Verificar e criar coluna remetente_id em notificacoes se não existir
    const notificacoesHasRemetenteId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='remetente_id'
    `);

    if (notificacoesHasRemetenteId.length === 0) {
      await queryRunner.query(`
        ALTER TABLE notificacoes 
        ADD COLUMN remetente_id INTEGER NULL
      `);

      await queryRunner.query(`
        ALTER TABLE notificacoes
        ADD CONSTRAINT FK_notificacoes_remetente
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL
      `);
    }

    // Verificar e criar coluna link em notificacoes se não existir
    const notificacoesHasLink = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='link'
    `);

    if (notificacoesHasLink.length === 0) {
      await queryRunner.query(`
        ALTER TABLE notificacoes 
        ADD COLUMN link TEXT NULL
      `);
    }

    // Criar índices para notificações se não existirem
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_tarefa_id 
      ON notificacoes(tarefa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_projeto_id 
      ON notificacoes(projeto_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_remetente_id 
      ON notificacoes(remetente_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const notificacoesTable = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'notificacoes'
    `);

    if (notificacoesTable.length === 0) {
      return;
    }

    // Drop índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notificacoes_remetente_id`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notificacoes_projeto_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notificacoes_tarefa_id`);

    // Drop constraints e colunas (em ordem reversa)
    const notificacoesHasLink = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='link'
    `);
    if (notificacoesHasLink.length > 0) {
      await queryRunner.query(`ALTER TABLE notificacoes DROP COLUMN link`);
    }

    const notificacoesHasRemetenteId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='remetente_id'
    `);
    if (notificacoesHasRemetenteId.length > 0) {
      await queryRunner.query(
        `ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS FK_notificacoes_remetente`,
      );
      await queryRunner.query(
        `ALTER TABLE notificacoes DROP COLUMN remetente_id`,
      );
    }

    const notificacoesHasProjetoId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='projeto_id'
    `);
    if (notificacoesHasProjetoId.length > 0) {
      await queryRunner.query(
        `ALTER TABLE notificacoes DROP COLUMN projeto_id`,
      );
    }

    const notificacoesHasTarefaId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notificacoes' AND column_name='tarefa_id'
    `);
    if (notificacoesHasTarefaId.length > 0) {
      await queryRunner.query(
        `ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS FK_notificacoes_tarefa`,
      );
      await queryRunner.query(`ALTER TABLE notificacoes DROP COLUMN tarefa_id`);
    }
  }
}
