import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDescricaoToDesarquivamentoAnexos1760950000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("desarquivamento_anexos");

    const hasDescricao = table?.findColumnByName("descricao");
    if (!hasDescricao) {
      await queryRunner.addColumn(
        "desarquivamento_anexos",
        new TableColumn({
          name: "descricao",
          type: "text",
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("desarquivamento_anexos");

    const hasDescricao = table?.findColumnByName("descricao");
    if (hasDescricao) {
      await queryRunner.dropColumn("desarquivamento_anexos", "descricao");
    }
  }
}
