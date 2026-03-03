import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnalyticsSchemaForMetabase1768300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS analytics`);

    await queryRunner.query(`DROP VIEW IF EXISTS analytics.vw_notificacoes`);
    await queryRunner.query(`DROP VIEW IF EXISTS analytics.vw_tarefas`);
    await queryRunner.query(
      `DROP VIEW IF EXISTS analytics.vw_desarquivamentos`,
    );

    await queryRunner.query(`
      CREATE VIEW analytics.vw_desarquivamentos AS
      SELECT
        d.id AS desarquivamento_id,
        d.numero_processo,
        d.numero_nic_laudo_auto,
        d.numero_solicitacao,
        d.status::text AS status,
        d.instituto,
        d.tipo_desarquivamento,
        d.tipo_documento,
        d.setor_demandante,
        d.servidor_responsavel,
        d.requerente,
        d.nome_completo,
        d.urgente,
        d.solicitacao_prorrogacao,
        d.data_solicitacao,
        d.data_desarquivamento_sag,
        d.data_devolucao_setor,
        d.created_at,
        d.updated_at,
        d.deleted_at,
        creator.id AS criado_por_id,
        creator.nome AS criado_por_nome,
        creator.usuario AS criado_por_usuario,
        responsavel.id AS responsavel_id,
        responsavel.nome AS responsavel_nome,
        responsavel.usuario AS responsavel_usuario,
        COALESCE(anexos.total_anexos, 0) AS total_anexos,
        COALESCE(anexos.total_anexos_pdf, 0) AS total_anexos_pdf,
        COALESCE(anexos.total_anexos_ocr, 0) AS total_anexos_ocr,
        COALESCE(anexos.total_bytes_anexos, 0) AS total_bytes_anexos
      FROM desarquivamentos d
      LEFT JOIN usuarios creator
        ON creator.id = d.created_by
      LEFT JOIN usuarios responsavel
        ON responsavel.id = d.responsavel_id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total_anexos,
          COUNT(*) FILTER (
            WHERE anexo.tipo_mime = 'application/pdf'
          ) AS total_anexos_pdf,
          COUNT(*) FILTER (
            WHERE anexo.ocr_status = 'completed'
          ) AS total_anexos_ocr,
          COALESCE(SUM(anexo.tamanho_bytes), 0) AS total_bytes_anexos
        FROM desarquivamento_anexos anexo
        WHERE anexo.desarquivamento_id = d.id
          OR (
            anexo.numero_processo IS NOT NULL
            AND anexo.numero_processo = d.numero_processo
          )
      ) anexos
        ON true
    `);

    await queryRunner.query(`
      CREATE VIEW analytics.vw_tarefas AS
      SELECT
        t.id AS tarefa_id,
        t.projeto_id,
        projeto.nome AS projeto_nome,
        t.coluna_id,
        coluna.nome AS coluna_nome,
        coluna.cor AS coluna_cor,
        t.parent_id AS tarefa_pai_id,
        t.titulo,
        t.descricao,
        t.prioridade::text AS prioridade,
        t.prazo,
        t.ordem,
        t.tags,
        t.data_criacao,
        t.data_atualizacao,
        t.deleted_at,
        criador.id AS criador_id,
        criador.nome AS criador_nome,
        criador.usuario AS criador_usuario,
        responsavel.id AS responsavel_id,
        responsavel.nome AS responsavel_nome,
        responsavel.usuario AS responsavel_usuario,
        (
          t.prazo IS NOT NULL
          AND t.prazo < CURRENT_DATE
          AND COALESCE(coluna.nome, '') <> 'Concluído'
        ) AS atrasada,
        (COALESCE(coluna.nome, '') = 'Concluído') AS concluida
      FROM tarefas t
      LEFT JOIN projetos projeto
        ON projeto.id = t.projeto_id
      LEFT JOIN colunas coluna
        ON coluna.id = t.coluna_id
      LEFT JOIN usuarios criador
        ON criador.id = t.criador_id
      LEFT JOIN usuarios responsavel
        ON responsavel.id = t.responsavel_id
    `);

    await queryRunner.query(`
      CREATE VIEW analytics.vw_notificacoes AS
      SELECT
        n.id AS notificacao_id,
        n.tipo::text AS tipo,
        n.prioridade::text AS prioridade,
        n.titulo,
        n.descricao,
        n.link,
        n.lida,
        n.detalhes::text AS detalhes_json,
        n.usuario_id,
        usuario.nome AS usuario_nome,
        usuario.usuario AS usuario_usuario,
        n.remetente_id,
        remetente.nome AS remetente_nome,
        remetente.usuario AS remetente_usuario,
        n.solicitacao_id,
        n.processo_id,
        n.tarefa_id,
        n.projeto_id,
        n.created_at,
        n.updated_at,
        n.deleted_at
      FROM notificacoes n
      LEFT JOIN usuarios usuario
        ON usuario.id = n.usuario_id
      LEFT JOIN usuarios remetente
        ON remetente.id = n.remetente_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS analytics.vw_notificacoes`);
    await queryRunner.query(`DROP VIEW IF EXISTS analytics.vw_tarefas`);
    await queryRunner.query(
      `DROP VIEW IF EXISTS analytics.vw_desarquivamentos`,
    );
    await queryRunner.query(`DROP SCHEMA IF EXISTS analytics`);
  }
}
