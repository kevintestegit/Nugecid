import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCatalogacaoFieldsToVestigios1770200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("vestigios", [
      new TableColumn({
        name: "classe_catalogacao",
        type: "varchar",
        length: "100",
        isNullable: true,
      }),
      new TableColumn({
        name: "subclasse_catalogacao",
        type: "varchar",
        length: "100",
        isNullable: true,
      }),
      new TableColumn({
        name: "tipo_catalogacao",
        type: "varchar",
        length: "150",
        isNullable: true,
      }),
      new TableColumn({
        name: "schema_versao",
        type: "varchar",
        length: "30",
        isNullable: true,
      }),
      new TableColumn({
        name: "metadados_gerais",
        type: "jsonb",
        isNullable: true,
      }),
      new TableColumn({
        name: "metadados_especificos",
        type: "jsonb",
        isNullable: true,
      }),
    ]);

    await queryRunner.query(`
      ALTER TABLE vestigios
      ALTER COLUMN status SET DEFAULT 'catalogacao_pendente'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vestigios
      ALTER COLUMN status SET DEFAULT 'ativo'
    `);

    await queryRunner.dropColumns("vestigios", [
      "metadados_especificos",
      "metadados_gerais",
      "schema_versao",
      "tipo_catalogacao",
      "subclasse_catalogacao",
      "classe_catalogacao",
    ]);
  }
}
