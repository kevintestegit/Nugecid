import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTarefaResponsaveis1767200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tarefa_responsaveis (
        tarefa_id integer NOT NULL,
        usuario_id integer NOT NULL,
        PRIMARY KEY (tarefa_id, usuario_id),
        CONSTRAINT fk_tarefa_responsavel_tarefa
          FOREIGN KEY (tarefa_id)
          REFERENCES tarefas(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_tarefa_responsavel_usuario
          FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO tarefa_responsaveis (tarefa_id, usuario_id)
      SELECT id, responsavel_id
      FROM tarefas
      WHERE responsavel_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tarefa_responsaveis_usuario
      ON tarefa_responsaveis (usuario_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tarefa_responsaveis`);
  }
}
