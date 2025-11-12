import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificacoesTable1758235300000
  implements MigrationInterface
{
  name = "016CreateNotificacoesTable1758235300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const notificacoesExists = await queryRunner.hasTable("notificacoes");

    if (!notificacoesExists) {
      // Criar enum para tipo de notificação
      await queryRunner.query(`
        CREATE TYPE notificacao_tipo_enum AS ENUM (
          'solicitacao_pendente',
          'novo_processo'
        );
      `);

      // Criar enum para prioridade
      await queryRunner.query(`
        CREATE TYPE notificacao_prioridade_enum AS ENUM (
          'baixa',
          'media',
          'alta',
          'critica'
        );
      `);

      // Criar tabela notificacoes
      await queryRunner.query(`
        CREATE TABLE notificacoes (
          id SERIAL PRIMARY KEY,
          tipo notificacao_tipo_enum NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          descricao TEXT NOT NULL,
          detalhes JSONB,
          lida BOOLEAN NOT NULL DEFAULT false,
          prioridade notificacao_prioridade_enum NOT NULL DEFAULT 'media',
          usuario_id INTEGER NOT NULL,
          solicitacao_id INTEGER,
          processo_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
      `);

      // Comentário na coluna detalhes
      await queryRunner.query(`
        COMMENT ON COLUMN notificacoes.detalhes IS 'Dados específicos como dias pendentes, número do processo, etc.';
      `);

      // Índices para performance
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_prioridade ON notificacoes(prioridade);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_created_at ON notificacoes(created_at);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_deleted_at ON notificacoes(deleted_at);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_notificacoes_tipo_created ON notificacoes(tipo, created_at);`,
      );

      // Trigger para atualizar updated_at
      const triggerExists = await queryRunner.query(`
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_notificacoes_updated_at'
      `);

      if (!triggerExists.length) {
        await queryRunner.query(`
          CREATE TRIGGER update_notificacoes_updated_at 
          BEFORE UPDATE ON notificacoes
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
      }

      // View para estatísticas de notificações
      await queryRunner.query(`
        CREATE OR REPLACE VIEW vw_notificacoes_estatisticas AS
        SELECT 
          usuario_id,
          COUNT(*) as total_notificacoes,
          COUNT(CASE WHEN lida = false THEN 1 END) as nao_lidas,
          COUNT(CASE WHEN lida = true THEN 1 END) as lidas,
          COUNT(CASE WHEN tipo = 'solicitacao_pendente' THEN 1 END) as solicitacoes_pendentes,
          COUNT(CASE WHEN tipo = 'novo_processo' THEN 1 END) as novos_processos,
          COUNT(CASE WHEN prioridade = 'critica' AND lida = false THEN 1 END) as criticas_nao_lidas,
          MAX(created_at) as ultima_notificacao
        FROM notificacoes 
        WHERE deleted_at IS NULL
        GROUP BY usuario_id;
      `);

      // Função para verificar solicitações pendentes
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION verificar_solicitacoes_pendentes()
        RETURNS TABLE(
          desarquivamento_id INTEGER,
          dias_pendentes INTEGER,
          usuario_responsavel_id INTEGER
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            d.id as desarquivamento_id,
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d.data_solicitacao))::INTEGER as dias_pendentes,
            d.responsavel_id as usuario_responsavel_id
          FROM desarquivamentos d
          WHERE d.status = 'SOLICITADO'
            AND d.data_solicitacao <= CURRENT_TIMESTAMP - INTERVAL '5 days'
            AND d.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM notificacoes n 
              WHERE n.tipo = 'solicitacao_pendente' 
                AND n.solicitacao_id = d.id 
                AND n.deleted_at IS NULL
                AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
            );
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Função para criar notificação de solicitação pendente
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION criar_notificacao_solicitacao_pendente(
          p_solicitacao_id INTEGER,
          p_usuario_id INTEGER,
          p_dias_pendentes INTEGER
        )
        RETURNS INTEGER AS $$
        DECLARE
          v_notificacao_id INTEGER;
          v_titulo VARCHAR(255);
          v_descricao TEXT;
          v_detalhes JSONB;
        BEGIN
          v_titulo := 'Solicitação Pendente há ' || p_dias_pendentes || ' dias';
          v_descricao := 'Uma solicitação de desarquivamento está pendente há mais de 5 dias sem movimentação.';
          v_detalhes := json_build_object(
            'dias_pendentes', p_dias_pendentes,
            'data_limite', CURRENT_DATE + INTERVAL '2 days'
          );

          INSERT INTO notificacoes (
            tipo, titulo, descricao, detalhes, usuario_id, solicitacao_id, prioridade
          ) VALUES (
            'solicitacao_pendente', v_titulo, v_descricao, v_detalhes, p_usuario_id, p_solicitacao_id, 'alta'
          ) RETURNING id INTO v_notificacao_id;

          RETURN v_notificacao_id;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Função para criar notificação de novo processo
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION criar_notificacao_novo_processo(
          p_processo_id INTEGER,
          p_usuario_id INTEGER,
          p_numero_processo VARCHAR(255)
        )
        RETURNS INTEGER AS $$
        DECLARE
          v_notificacao_id INTEGER;
          v_titulo VARCHAR(255);
          v_descricao TEXT;
          v_detalhes JSONB;
        BEGIN
          v_titulo := 'Novo Processo de Desarquivamento';
          v_descricao := 'Um novo processo de desarquivamento foi extraído do SEIRN: ' || p_numero_processo;
          v_detalhes := json_build_object(
            'numero_processo', p_numero_processo,
            'origem', 'SEIRN',
            'data_extracao', CURRENT_TIMESTAMP
          );

          INSERT INTO notificacoes (
            tipo, titulo, descricao, detalhes, usuario_id, processo_id, prioridade
          ) VALUES (
            'novo_processo', v_titulo, v_descricao, v_detalhes, p_usuario_id, p_processo_id, 'media'
          ) RETURNING id INTO v_notificacao_id;

          RETURN v_notificacao_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover view
    await queryRunner.query(
      `DROP VIEW IF EXISTS vw_notificacoes_estatisticas;`,
    );

    // Remover funções
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS verificar_solicitacoes_pendentes();`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS criar_notificacao_solicitacao_pendente(INTEGER, INTEGER, INTEGER);`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS criar_notificacao_novo_processo(INTEGER, INTEGER, VARCHAR);`,
    );

    // Remover trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_notificacoes_updated_at ON notificacoes;`,
    );

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS notificacoes;`);

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS notificacao_tipo_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS notificacao_prioridade_enum;`);
  }
}
