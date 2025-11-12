import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTipoAnexoToDesarquivamentoAnexos1762600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna tipo_anexo com valores 'desarquivamento' ou 'rearquivamento'
    await queryRunner.addColumn(
      "desarquivamento_anexos",
      new TableColumn({
        name: "tipo_anexo",
        type: "varchar",
        length: "20",
        isNullable: false,
        default: "'desarquivamento'",
      }),
    );

    // Criar índice para melhor performance nas consultas
    await queryRunner.query(`
      CREATE INDEX idx_desarquivamento_anexos_tipo 
      ON desarquivamento_anexos(tipo_anexo)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_desarquivamento_anexos_tipo
    `);

    // Remover coluna
    await queryRunner.dropColumn("desarquivamento_anexos", "tipo_anexo");
  }
}
