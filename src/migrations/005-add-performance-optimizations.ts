import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddPerformanceOptimizations1700000005000
  implements MigrationInterface
{
  name = "AddPerformanceOptimizations1700000005000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar extensão uuid-ossp se não estiver habilitada
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Índices compostos para melhor performance

    // Índice composto para usuários ativos por role
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_USUARIOS_ROLE_ATIVO" ON "usuarios" ("role_id", "ativo")`,
    );

    // Índice composto para usuários não deletados
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_USUARIOS_ATIVO_NOT_DELETED" ON "usuarios" ("ativo") WHERE deleted_at IS NULL`,
    );

    // Índice para auditoria por usuário e período
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_AUDITORIAS_USER_TIMESTAMP" ON "auditorias" ("user_id", "timestamp")`,
    );

    // Índice para auditoria por entidade e ação
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_AUDITORIAS_ENTITY_ACTION" ON "auditorias" ("entity_name", "action")`,
    );

    // Índice para desarquivamentos por status e data
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DESARQUIVAMENTOS_STATUS_DATA" ON "desarquivamentos" ("status", "data_solicitacao")`,
    );

    // Índice para desarquivamentos não deletados
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DESARQUIVAMENTOS_NOT_DELETED" ON "desarquivamentos" ("status") WHERE deleted_at IS NULL`,
    );

    // Índice para desarquivamentos urgentes pendentes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DESARQUIVAMENTOS_URGENTE_PENDENTE" ON "desarquivamentos" ("urgente", "status") WHERE urgente = true AND status = 'PENDENTE'`,
    );

    // Índice para busca por número de processo
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_DESARQUIVAMENTOS_NUMERO_PROCESSO" ON "desarquivamentos" ("numero_processo") WHERE numero_processo IS NOT NULL`,
    );

    // Configurações de performance para PostgreSQL
    await queryRunner.query(`
      -- Configurar autovacuum para tabelas com alta frequência de updates
      ALTER TABLE usuarios SET (
        autovacuum_vacuum_scale_factor = 0.1,
        autovacuum_analyze_scale_factor = 0.05
      );
    `);

    await queryRunner.query(`
      ALTER TABLE auditorias SET (
        autovacuum_vacuum_scale_factor = 0.2,
        autovacuum_analyze_scale_factor = 0.1
      );
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos SET (
        autovacuum_vacuum_scale_factor = 0.1,
        autovacuum_analyze_scale_factor = 0.05
      );
    `);

    // Criar função para atualizar updated_at automaticamente
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Aplicar trigger para updated_at nas tabelas
    await queryRunner.query(`
      CREATE TRIGGER update_roles_updated_at
        BEFORE UPDATE ON roles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_usuarios_updated_at
        BEFORE UPDATE ON usuarios
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_desarquivamentos_updated_at
        BEFORE UPDATE ON desarquivamentos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Estatísticas iniciais para o otimizador de consultas
    await queryRunner.query("ANALYZE roles;");
    await queryRunner.query("ANALYZE usuarios;");
    await queryRunner.query("ANALYZE auditorias;");
    await queryRunner.query("ANALYZE desarquivamentos;");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query(
      "DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;",
    );
    await queryRunner.query(
      "DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;",
    );
    await queryRunner.query(
      "DROP TRIGGER IF EXISTS update_desarquivamentos_updated_at ON desarquivamentos;",
    );

    // Remover função
    await queryRunner.query(
      "DROP FUNCTION IF EXISTS update_updated_at_column();",
    );

    // Os índices serão removidos automaticamente quando as tabelas forem dropadas
  }
}
