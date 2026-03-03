import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds missing database indexes on frequently queried columns.
 * Targets: tarefa, coluna, comentario, vestigio, registro, blocked_ip
 */
export class AddMissingIndexes1768100000000 implements MigrationInterface {
  name = "AddMissingIndexes1768100000000";

  private async createIndexOnFirstMatchingTarget(
    queryRunner: QueryRunner,
    indexName: string,
    candidates: Array<{
      table: string;
      columns: string[];
      expression?: string;
    }>,
  ): Promise<void> {
    for (const candidate of candidates) {
      const hasTable = await queryRunner.hasTable(candidate.table);
      if (!hasTable) {
        continue;
      }

      const allColumnsExist = await Promise.all(
        candidate.columns.map((column) =>
          queryRunner.hasColumn(candidate.table, column),
        ),
      );

      if (!allColumnsExist.every(Boolean)) {
        continue;
      }

      const expression =
        candidate.expression ||
        candidate.columns.map((column) => `"${column}"`).join(", ");

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${candidate.table}" (${expression})`,
      );
      return;
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // === tarefa ===
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_tarefa_projeto_id",
      [
        { table: "tarefas", columns: ["projeto_id"] },
        { table: "tarefa", columns: ["projetoId"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_tarefa_coluna_id",
      [
        { table: "tarefas", columns: ["coluna_id"] },
        { table: "tarefa", columns: ["colunaId"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_tarefa_criador_id",
      [
        { table: "tarefas", columns: ["criador_id"] },
        { table: "tarefa", columns: ["criadorId"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_tarefa_responsavel_id",
      [
        { table: "tarefas", columns: ["responsavel_id"] },
        { table: "tarefa", columns: ["responsavelId"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_tarefa_prioridade",
      [
        { table: "tarefas", columns: ["prioridade"] },
        { table: "tarefa", columns: ["prioridade"] },
      ],
    );

    // === coluna ===
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_coluna_projeto_id",
      [
        { table: "colunas", columns: ["projeto_id"] },
        { table: "coluna", columns: ["projeto_id"] },
      ],
    );

    // === comentario ===
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_comentario_tarefa_id",
      [
        { table: "comentarios", columns: ["tarefa_id"] },
        { table: "comentario", columns: ["tarefa_id"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_comentario_autor_id",
      [
        { table: "comentarios", columns: ["autor_id"] },
        { table: "comentario", columns: ["autor_id"] },
      ],
    );

    // === vestigio ===
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_vestigio_status",
      [
        { table: "vestigios", columns: ["status"] },
        { table: "vestigio", columns: ["status"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_vestigio_criado_por_id",
      [
        { table: "vestigios", columns: ["criado_por_id"] },
        { table: "vestigio", columns: ["criado_por_id"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_vestigio_created_at",
      [
        {
          table: "vestigios",
          columns: ["created_at"],
          expression: `"created_at" DESC`,
        },
        {
          table: "vestigio",
          columns: ["created_at"],
          expression: `"created_at" DESC`,
        },
      ],
    );

    // === registro ===
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_registro_numero_processo",
      [
        { table: "registros", columns: ["numero_processo"] },
        { table: "registro", columns: ["numero_processo"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_registro_delegacia_origem",
      [
        { table: "registros", columns: ["delegacia_origem"] },
        { table: "registro", columns: ["delegacia_origem"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_registro_data_fato",
      [
        { table: "registros", columns: ["data_fato"] },
        { table: "registro", columns: ["data_fato"] },
      ],
    );

    // === blocked_ip ===
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_blocked_ip_is_active",
      [
        { table: "blocked_ips", columns: ["is_active"] },
        { table: "blocked_ip", columns: ["is_active"] },
      ],
    );
    await this.createIndexOnFirstMatchingTarget(
      queryRunner,
      "IDX_blocked_ip_expires_at",
      [
        { table: "blocked_ips", columns: ["expires_at"] },
        { table: "blocked_ip", columns: ["expires_at"] },
      ],
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
