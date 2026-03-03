import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from "typeorm";

export class AddOcrMetadataToDesarquivamentoAnexos1768200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("desarquivamento_anexos"))) {
      return;
    }

    const table = await queryRunner.getTable("desarquivamento_anexos");
    if (!table) {
      return;
    }

    const columnsToAdd = [
      new TableColumn({
        name: "ocr_status",
        type: "varchar",
        length: "40",
        isNullable: true,
      }),
      new TableColumn({
        name: "ocr_pdf_caminho",
        type: "varchar",
        length: "500",
        isNullable: true,
      }),
      new TableColumn({
        name: "ocr_texto_caminho",
        type: "varchar",
        length: "500",
        isNullable: true,
      }),
      new TableColumn({
        name: "ocr_texto",
        type: "text",
        isNullable: true,
      }),
      new TableColumn({
        name: "ocr_processado_em",
        type: "timestamp",
        isNullable: true,
      }),
      new TableColumn({
        name: "ocr_erro",
        type: "text",
        isNullable: true,
      }),
    ].filter((column) => !table.findColumnByName(column.name));

    for (const column of columnsToAdd) {
      await queryRunner.addColumn("desarquivamento_anexos", column);
    }

    const hasStatusIndex = table.indices.some(
      (index) => index.name === "IDX_desarquivamento_anexos_ocr_status",
    );
    if (!hasStatusIndex) {
      await queryRunner.createIndex(
        "desarquivamento_anexos",
        new TableIndex({
          name: "IDX_desarquivamento_anexos_ocr_status",
          columnNames: ["ocr_status"],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("desarquivamento_anexos"))) {
      return;
    }

    const table = await queryRunner.getTable("desarquivamento_anexos");
    if (!table) {
      return;
    }

    if (
      table.indices.some(
        (index) => index.name === "IDX_desarquivamento_anexos_ocr_status",
      )
    ) {
      await queryRunner.dropIndex(
        "desarquivamento_anexos",
        "IDX_desarquivamento_anexos_ocr_status",
      );
    }

    const columnsToDrop = [
      "ocr_erro",
      "ocr_processado_em",
      "ocr_texto",
      "ocr_texto_caminho",
      "ocr_pdf_caminho",
      "ocr_status",
    ];

    for (const columnName of columnsToDrop) {
      if (table.findColumnByName(columnName)) {
        await queryRunner.dropColumn("desarquivamento_anexos", columnName);
      }
    }
  }
}
