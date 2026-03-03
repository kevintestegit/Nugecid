import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateDesarquivamentoAnexosTable1760547000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "desarquivamento_anexos",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "desarquivamento_id",
            type: "integer",
            isNullable: false,
          },
          {
            name: "usuario_id",
            type: "integer",
            isNullable: false,
          },
          {
            name: "nome_original",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "nome_arquivo",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "caminho_arquivo",
            type: "varchar",
            length: "500",
            isNullable: false,
          },
          {
            name: "tipo_mime",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "tamanho_bytes",
            type: "bigint",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            columnNames: ["desarquivamento_id"],
            referencedTableName: "desarquivamentos",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["usuario_id"],
            referencedTableName: "usuarios",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
        indices: [
          {
            columnNames: ["desarquivamento_id"],
            name: "IDX_desarquivamento_anexos_desarquivamento_id",
          },
          {
            columnNames: ["usuario_id"],
            name: "IDX_desarquivamento_anexos_usuario_id",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("desarquivamento_anexos");
  }
}
