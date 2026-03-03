import { MigrationInterface, QueryRunner } from "typeorm";

export class PerformanceIndexes20250401000001 implements MigrationInterface {
  name = "PerformanceIndexes20250401000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // NOTA: Removido CONCURRENTLY para rodar dentro de transacao do TypeORM
    // Em producao, execute manualmente: CREATE INDEX CONCURRENTLY ...

    // Índices para desarquivamentos (consultas mais frequentes)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_desarquivamentos_status_data 
      ON desarquivamentos(status, created_at DESC) 
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_desarquivamentos_numero_processo 
      ON desarquivamentos(numero_processo) 
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_desarquivamentos_instituto 
      ON desarquivamentos(instituto, status) 
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_desarquivamentos_requerente 
      ON desarquivamentos USING gin (requerente gin_trgm_ops)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_desarquivamentos_periodo 
      ON desarquivamentos(data_solicitacao, data_devolucao_setor) 
      WHERE deleted_at IS NULL
    `);

    // Índices para tarefas (Kanban)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefas_projeto_coluna 
      ON tarefas(projeto_id, coluna_id, ordem) 
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel 
      ON tarefas(responsavel_id, data_criacao DESC) 
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefas_prazo 
      ON tarefas(prazo) 
      WHERE deleted_at IS NULL AND prazo IS NOT NULL
    `);

    // Índices para auditoria
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_entidade 
      ON auditorias(entity_name, entity_id, timestamp DESC)
    `);

    // Índices para notificaoes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida 
      ON notificacoes(usuario_id, lida, created_at DESC)
    `);

    // Índices para anexos
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_anexos_desarquivamento 
      ON desarquivamento_anexos(desarquivamento_id, created_at DESC)
    `);

    // Extensao para busca full-text (se ainda nao existir)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_desarquivamentos_status_data`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_desarquivamentos_numero_processo`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_desarquivamentos_instituto`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_desarquivamentos_requerente`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_desarquivamentos_periodo`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefas_projeto_coluna`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefas_responsavel`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefas_prazo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_auditoria_entidade`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notificacoes_usuario_lida`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_anexos_desarquivamento`);
  }
}
