import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateItensChecklistTable1760535508184
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const itensChecklistExists = await queryRunner.hasTable("itens_checklist");

    if (!itensChecklistExists) {
      // Criar tabela itens_checklist
      await queryRunner.query(`
                CREATE TABLE itens_checklist (
                    id SERIAL PRIMARY KEY,
                    checklist_id INTEGER NOT NULL,
                    texto VARCHAR(500) NOT NULL,
                    concluido BOOLEAN DEFAULT FALSE,
                    ordem INTEGER NOT NULL,
                    concluido_por_id INTEGER,
                    concluido_em TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
                    FOREIGN KEY (concluido_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
                );
            `);

      // Adicionar coluna editado à tabela comentarios
      await queryRunner.query(`
                ALTER TABLE comentarios
                ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT FALSE
            `);

      // Índices para itens_checklist
      await queryRunner.query(
        `CREATE INDEX idx_itens_checklist_checklist ON itens_checklist(checklist_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_itens_checklist_concluido ON itens_checklist(concluido);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_itens_checklist_ordem ON itens_checklist(checklist_id, ordem);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_itens_checklist_created_at ON itens_checklist(created_at);`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_itens_checklist_created_at;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_itens_checklist_ordem;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_itens_checklist_concluido;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_itens_checklist_checklist;`,
    );

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS itens_checklist;`);
  }
}
