import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds missing database indexes on frequently queried columns.
 * Targets: tarefa, coluna, comentario, vestigio, registro, blocked_ip
 */
export class AddMissingIndexes1768100000000 implements MigrationInterface {
  name = "AddMissingIndexes1768100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // === tarefa ===
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tarefa_projeto_id" ON "tarefa" ("projeto_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tarefa_coluna_id" ON "tarefa" ("coluna_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tarefa_criador_id" ON "tarefa" ("criador_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tarefa_responsavel_id" ON "tarefa" ("responsavel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tarefa_prioridade" ON "tarefa" ("prioridade")`,
    );

    // === coluna ===
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_coluna_projeto_id" ON "coluna" ("projeto_id")`,
    );

    // === comentario ===
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comentario_tarefa_id" ON "comentario" ("tarefa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comentario_autor_id" ON "comentario" ("autor_id")`,
    );

    // === vestigio ===
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vestigio_status" ON "vestigio" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vestigio_criado_por_id" ON "vestigio" ("criado_por_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vestigio_created_at" ON "vestigio" ("created_at" DESC)`,
    );

    // === registro ===
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_registro_numero_processo" ON "registro" ("numero_processo")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_registro_delegacia_origem" ON "registro" ("delegacia_origem")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_registro_data_fato" ON "registro" ("data_fato")`,
    );

    // === blocked_ip ===
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_blocked_ip_is_active" ON "blocked_ip" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_blocked_ip_expires_at" ON "blocked_ip" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blocked_ip_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blocked_ip_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_registro_data_fato"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_registro_delegacia_origem"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_registro_numero_processo"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vestigio_created_at"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_vestigio_criado_por_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vestigio_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comentario_autor_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comentario_tarefa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coluna_projeto_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tarefa_prioridade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tarefa_responsavel_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tarefa_criador_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tarefa_coluna_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tarefa_projeto_id"`);
  }
}
