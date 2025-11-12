import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnexosTable1760534717255 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const anexosExists = await queryRunner.hasTable("anexos");

    if (!anexosExists) {
      // Criar tabela anexos
      await queryRunner.query(`
                CREATE TABLE anexos (
                    id SERIAL PRIMARY KEY,
                    tarefa_id INTEGER NOT NULL,
                    usuario_id INTEGER NOT NULL,
                    nome_original VARCHAR(255) NOT NULL,
                    nome_arquivo VARCHAR(255) NOT NULL,
                    caminho_arquivo VARCHAR(500) NOT NULL,
                    tipo_mime VARCHAR(100) NOT NULL,
                    tamanho_bytes BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                );
            `);

      // Índices para anexos
      await queryRunner.query(
        `CREATE INDEX idx_anexos_tarefa ON anexos(tarefa_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_anexos_usuario ON anexos(usuario_id);`,
      );
      await queryRunner.query(
        `CREATE INDEX idx_anexos_created_at ON anexos(created_at);`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_anexos_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_anexos_usuario;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_anexos_tarefa;`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS anexos;`);
  }
}
