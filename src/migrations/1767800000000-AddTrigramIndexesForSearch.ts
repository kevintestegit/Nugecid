import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Habilita a extensão pg_trgm e cria índices GIN trigram nas colunas usadas
 * pela busca global (GET /search). Índices trigram permitem que queries
 * LIKE '%termo%' (wildcard no início) sejam aceleradas — B-tree indexes
 * convencionais NÃO suportam esse padrão.
 *
 * Colunas indexadas são as mesmas pesquisadas por AppService.globalSearch().
 */
export class AddTrigramIndexesForSearch1767800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar extensão pg_trgm (idempotente)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // =============================================
    // DESARQUIVAMENTOS
    // =============================================
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_nome_trgm
       ON desarquivamentos USING GIN (nome_completo gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_nic_trgm
       ON desarquivamentos USING GIN (numero_nic_laudo_auto gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_processo_trgm
       ON desarquivamentos USING GIN (numero_processo gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_setor_trgm
       ON desarquivamentos USING GIN (setor_demandante gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_servidor_trgm
       ON desarquivamentos USING GIN (servidor_responsavel gin_trgm_ops)`,
    );

    // =============================================
    // USUARIOS
    // =============================================
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_nome_trgm
       ON usuarios USING GIN (nome gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_usuario_trgm
       ON usuarios USING GIN (usuario gin_trgm_ops)`,
    );

    // =============================================
    // TAREFAS
    // =============================================
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefas_titulo_trgm
       ON tarefas USING GIN (titulo gin_trgm_ops)`,
    );
    // descricao pode ser longa (text), mas trigram ainda ajuda
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefas_descricao_trgm
       ON tarefas USING GIN (descricao gin_trgm_ops)`,
    );

    // =============================================
    // PROJETOS
    // =============================================
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_projetos_nome_trgm
       ON projetos USING GIN (nome gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_projetos_descricao_trgm
       ON projetos USING GIN (descricao gin_trgm_ops)`,
    );

    // =============================================
    // PASTAS
    // =============================================
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pastas_nome_trgm
       ON pastas USING GIN (nome gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pastas_descricao_trgm
       ON pastas USING GIN (descricao gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // DESARQUIVAMENTOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nome_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nic_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_processo_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_setor_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_servidor_trgm`);

    // USUARIOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_nome_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_usuario_trgm`);

    // TAREFAS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefas_titulo_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefas_descricao_trgm`);

    // PROJETOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projetos_nome_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projetos_descricao_trgm`);

    // PASTAS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pastas_nome_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pastas_descricao_trgm`);

    // Não removemos a extensão pg_trgm pois pode ser usada por outros módulos
  }
}
