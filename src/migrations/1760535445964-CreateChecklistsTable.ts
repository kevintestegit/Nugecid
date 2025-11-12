import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChecklistsTable1760535445964 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const checklistsExists = await queryRunner.hasTable("checklists");

    if (!checklistsExists) {
      // Criar tabela checklists
      await queryRunner.query(`
                CREATE TABLE checklists (
                    id SERIAL PRIMARY KEY,
                    tarefa_id INTEGER NOT NULL,
                    titulo VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE
                );
            `);

      // Índices para checklists
      await queryRunner.query(
        `CREATE INDEX idx_checklists_tarefa ON checklists(tarefa_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_checklists_created_at ON checklists(created_at);`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_checklists_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_checklists_tarefa;`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS checklists;`);
  }
}
