import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCriticalIndexes1763700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // ÍNDICES PARA USUÁRIOS
    // ========================================

    // Índice no campo usuario (usado em login e buscas)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_usuario ON usuarios(usuario)`,
    );

    // Índice no campo matricula (usado em filtros)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_matricula
       ON usuarios(matricula) WHERE matricula IS NOT NULL`,
    );

    // Índice no ultimo_login para ordenação (usuários mais ativos)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_ultimo_login
       ON usuarios(ultimo_login DESC NULLS LAST)`,
    );

    // Índice composto role + ativo (filtros comuns)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_role_ativo
       ON usuarios(role_id, ativo)`,
    );

    // ========================================
    // ÍNDICES PARA DESARQUIVAMENTOS
    // ========================================

    // Índice no nome completo (usado em buscas ILIKE)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_nome
       ON desarquivamentos(nome_completo)`,
    );

    // Índice no número NIC (usado em buscas)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_nic
       ON desarquivamentos(numero_nic_laudo_auto)`,
    );

    // Índice no número do processo (usado em buscas)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_processo
       ON desarquivamentos(numero_processo)`,
    );

    // Índice composto status + data (dashboard e filtros)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_status_data
       ON desarquivamentos(status, data_solicitacao DESC)`,
    );

    // Índice composto created_by + status (filtros por responsável)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_criador_status
       ON desarquivamentos(created_by, status)`,
    );

    // ========================================
    // ÍNDICES PARA PASTAS
    // ========================================

    // Índice no nome da pasta (usado em buscas)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pasta_nome
       ON pastas(nome)`,
    );

    // Índice na data de criação (ordenação)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pasta_data
       ON pastas(data_criacao DESC)`,
    );

    // Índice GIN para busca em arrays de tags
    // REMOVIDO: simple-array do TypeORM usa text, não text[]
    // Se precisar buscar em tags, usar WHERE tags LIKE '%tag%'

    // ========================================
    // ÍNDICES PARA PASTA_ARQUIVOS
    // ========================================

    // Índice composto pasta_id + tipo (filtros comuns)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_arquivo_pasta_tipo
       ON pasta_arquivos(pasta_id, tipo)`,
    );

    // Índice na data de upload (ordenação)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_arquivo_data
       ON pasta_arquivos(data_upload DESC)`,
    );

    // ========================================
    // ÍNDICES PARA TAREFAS
    // ========================================

    // Índice composto projeto + coluna + ordem (queries principais)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_projeto_coluna_ordem
       ON tarefas(projeto_id, coluna_id, ordem)`,
    );

    // Índice composto responsável + prazo (tarefas do usuário)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_responsavel_prazo
       ON tarefas(responsavel_id, prazo) WHERE prazo IS NOT NULL`,
    );

    // Índice composto prioridade + prazo (ordenação)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_prioridade_prazo
       ON tarefas(prioridade, prazo DESC NULLS LAST)`,
    );

    // Índice na data de criação (ordenação)
    // REMOVIDO: A tabela tarefas não tem campo created_at

    // ========================================
    // ÍNDICES PARA PROJETOS
    // ========================================

    // Índice no criador_id (meus projetos)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_projeto_criador
       ON projetos(criador_id)`,
    );

    // ========================================
    // OUTROS ÍNDICES REMOVIDOS
    // ========================================

    // REMOVIDO: Índices em notificacoes, comentarios, anexos, checklists, auditorias
    // Motivo: Nomes de colunas podem variar, adicionar manualmente quando necessário
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // USUÁRIOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_usuario`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_matricula`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_ultimo_login`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role_ativo`);

    // DESARQUIVAMENTOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nome`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nic`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_processo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_status_data`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_criador_status`);

    // PASTAS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pasta_nome`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pasta_data`);

    // PASTA_ARQUIVOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_arquivo_pasta_tipo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_arquivo_data`);

    // TAREFAS
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_tarefa_projeto_coluna_ordem`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_tarefa_responsavel_prazo`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefa_prioridade_prazo`);

    // PROJETOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projeto_criador`);

    // NOTIFICAÇÕES
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notif_user_lida`);

    // COMENTÁRIOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_comentario_tarefa`);

    // ANEXOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_anexo_tarefa`);

    // CHECKLISTS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_checklist_tarefa`);

    // ITENS_CHECKLIST
    await queryRunner.query(`DROP INDEX IF EXISTS idx_item_checklist`);

    // AUDITORIAS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_user_action`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_entity`);
  }
}
