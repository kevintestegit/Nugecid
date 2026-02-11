import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNumeroOficioToDesarquivamentos1766000000000
  implements MigrationInterface
{
  name = "AddNumeroOficioToDesarquivamentos1766000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "desarquivamentos",
      new TableColumn({
        name: "numero_oficio",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_desarquivamentos_numero_oficio" ON "desarquivamentos" ("numero_oficio")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamentos_numero_oficio"`,
    );
    await queryRunner.dropColumn("desarquivamentos", "numero_oficio");
  }
}
