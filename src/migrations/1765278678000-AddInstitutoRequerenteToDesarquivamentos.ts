import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddInstitutoRequerenteToDesarquivamentos1765278678000
  implements MigrationInterface
{
  name = "AddInstitutoRequerenteToDesarquivamentos1765278678000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna instituto
    await queryRunner.addColumn(
      "desarquivamentos",
      new TableColumn({
        name: "instituto",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // Adicionar coluna requerente
    await queryRunner.addColumn(
      "desarquivamentos",
      new TableColumn({
        name: "requerente",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // Criar índices para melhor performance nas buscas
    await queryRunner.query(
      `CREATE INDEX "IDX_desarquivamentos_instituto" ON "desarquivamentos" ("instituto")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_desarquivamentos_requerente" ON "desarquivamentos" ("requerente")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamentos_instituto"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamentos_requerente"`,
    );

    // Remover colunas
    await queryRunner.dropColumn("desarquivamentos", "instituto");
    await queryRunner.dropColumn("desarquivamentos", "requerente");
  }
}
