import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddWipLimitToColunas1760966500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn("colunas", "wip_limit");

    if (!hasColumn) {
      await queryRunner.addColumn(
        "colunas",
        new TableColumn({
          name: "wip_limit",
          type: "integer",
          isNullable: true,
          default: null,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn("colunas", "wip_limit");

    if (hasColumn) {
      await queryRunner.dropColumn("colunas", "wip_limit");
    }
  }
}
