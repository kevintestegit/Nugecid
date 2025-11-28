import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTarefasTables1758124300000 implements MigrationInterface {
  name = "015CreateTarefasTables1758124300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se as tabelas já existem
    const projetosExists = await queryRunner.hasTable("projetos");
    const colunasExists = await queryRunner.hasTable("colunas");
    const tarefasExists = await queryRunner.hasTable("tarefas");
    const comentariosExists = await queryRunner.hasTable("comentarios");
    const historicoExists = await queryRunner.hasTable("historico_tarefas");
    const membrosExists = await queryRunner.hasTable("membros_projeto");

    // Criar tabela projetos se não existir
    if (!projetosExists) {
      await queryRunner.query(`
        CREATE TABLE projetos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT,
          cor VARCHAR(7) DEFAULT '#3B82F6',
          criador_id INTEGER NOT NULL,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ativo BOOLEAN DEFAULT true,
          FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
      `);

      // Índices para projetos
      await queryRunner.query(
        `CREATE INDEX idx_projetos_criador ON projetos(criador_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_projetos_ativo ON projetos(ativo);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_projetos_data_criacao ON projetos(data_criacao);`,
      );
    }

    // Criar tabela membros_projeto se não existir
    if (!membrosExists) {
      await queryRunner.query(`
        CREATE TABLE membros_projeto (
          id SERIAL PRIMARY KEY,
          projeto_id INTEGER NOT NULL,
          usuario_id INTEGER NOT NULL,
          papel VARCHAR(20) NOT NULL DEFAULT 'membro',
          data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          UNIQUE(projeto_id, usuario_id),
          CHECK (papel IN ('admin', 'editor', 'visualizador', 'membro'))
        );
      `);

      // Índices para membros_projeto
      await queryRunner.query(
        `CREATE INDEX idx_membros_projeto_projeto ON membros_projeto(projeto_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_membros_projeto_usuario ON membros_projeto(usuario_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_membros_projeto_papel ON membros_projeto(papel);`,
      );
    }

    // Criar tabela colunas se não existir
    if (!colunasExists) {
      await queryRunner.query(`
        CREATE TABLE colunas (
          id SERIAL PRIMARY KEY,
          projeto_id INTEGER NOT NULL,
          nome VARCHAR(255) NOT NULL,
          cor VARCHAR(7) DEFAULT '#6B7280',
          ordem INTEGER NOT NULL DEFAULT 0,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
        );
      `);

      // Índices para colunas
      await queryRunner.query(
        `CREATE INDEX idx_colunas_projeto ON colunas(projeto_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_colunas_ordem ON colunas(projeto_id, ordem);`,
      );
    }

    // Criar tabela tarefas se não existir
    if (!tarefasExists) {
      await queryRunner.query(`
        CREATE TABLE tarefas (
          id SERIAL PRIMARY KEY,
          projeto_id INTEGER NOT NULL,
          coluna_id INTEGER NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          descricao TEXT,
          responsavel_id INTEGER,
          criador_id INTEGER NOT NULL,
          prazo TIMESTAMP,
          prioridade VARCHAR(10) DEFAULT 'media',
          ordem INTEGER NOT NULL DEFAULT 0,
          tags TEXT[],
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
          FOREIGN KEY (coluna_id) REFERENCES colunas(id) ON DELETE CASCADE,
          FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
          FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica'))
        );
      `);

      // Índices para tarefas
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_projeto ON tarefas(projeto_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_coluna ON tarefas(coluna_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_criador ON tarefas(criador_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_prioridade ON tarefas(prioridade);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_prazo ON tarefas(prazo);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_ordem ON tarefas(coluna_id, ordem);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_tarefas_tags ON tarefas USING GIN(tags);`,
      );
    }

    // Criar tabela comentarios se não existir
    if (!comentariosExists) {
      await queryRunner.query(`
        CREATE TABLE comentarios (
          id SERIAL PRIMARY KEY,
          tarefa_id INTEGER NOT NULL,
          autor_id INTEGER NOT NULL,
          conteudo TEXT NOT NULL,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
          FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
      `);

      // Índices para comentários
      await queryRunner.query(
        `CREATE INDEX idx_comentarios_tarefa ON comentarios(tarefa_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_comentarios_autor ON comentarios(autor_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_comentarios_data ON comentarios(data_criacao);`,
      );
    }

    // Criar tabela historico_tarefas se não existir
    if (!historicoExists) {
      await queryRunner.query(`
        CREATE TABLE historico_tarefas (
          id SERIAL PRIMARY KEY,
          tarefa_id INTEGER NOT NULL,
          usuario_id INTEGER NOT NULL,
          acao VARCHAR(50) NOT NULL,
          campo_alterado VARCHAR(100),
          valor_anterior TEXT,
          valor_novo TEXT,
          data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
      `);

      // Índices para histórico_tarefas
      await queryRunner.query(
        `CREATE INDEX idx_historico_tarefa ON historico_tarefas(tarefa_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_historico_usuario ON historico_tarefas(usuario_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_historico_data ON historico_tarefas(data_acao);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_historico_acao ON historico_tarefas(acao);`,
      );
    }

    // Criar função para atualizar data_atualizacao
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.data_atualizacao = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Aplicar triggers nas tabelas se não existirem
    const triggers = [
      { table: "projetos", trigger: "update_projetos_updated_at" },
      { table: "colunas", trigger: "update_colunas_updated_at" },
      { table: "tarefas", trigger: "update_tarefas_updated_at" },
      { table: "comentarios", trigger: "update_comentarios_updated_at" },
    ];

    for (const { table, trigger } of triggers) {
      // Validar que table e trigger são identificadores válidos (apenas letras, números e underscore)
      const validIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      if (!validIdentifier.test(table) || !validIdentifier.test(trigger)) {
        throw new Error(`Invalid identifier: table=${table}, trigger=${trigger}`);
      }

      const triggerExists = await queryRunner.query(
        `SELECT 1 FROM pg_trigger WHERE tgname = $1`,
        [trigger]
      );

      if (!triggerExists.length) {
        // Os identificadores são validados acima, então é seguro usá-los
        await queryRunner.query(`
          CREATE TRIGGER ${trigger} BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
      }
    }

    // Criar função para colunas padrão
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION criar_colunas_padrao(projeto_id_param INTEGER)
      RETURNS VOID AS $$
      BEGIN
          INSERT INTO colunas (projeto_id, nome, cor, ordem) VALUES
              (projeto_id_param, 'A Fazer', '#EF4444', 1),
              (projeto_id_param, 'Em Progresso', '#F59E0B', 2),
              (projeto_id_param, 'Em Revisão', '#8B5CF6', 3),
              (projeto_id_param, 'Concluído', '#10B981', 4);
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_comentarios_updated_at ON comentarios;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_tarefas_updated_at ON tarefas;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_colunas_updated_at ON colunas;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_projetos_updated_at ON projetos;`,
    );

    // Remover função
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column();`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS criar_colunas_padrao(INTEGER);`,
    );

    // Remover tabelas na ordem correta (devido às foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS historico_tarefas;`);
    await queryRunner.query(`DROP TABLE IF EXISTS comentarios;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tarefas;`);
    await queryRunner.query(`DROP TABLE IF EXISTS colunas;`);
    await queryRunner.query(`DROP TABLE IF EXISTS membros_projeto;`);
    await queryRunner.query(`DROP TABLE IF EXISTS projetos;`);
  }
}
