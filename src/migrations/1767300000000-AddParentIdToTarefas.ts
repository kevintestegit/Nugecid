import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from "typeorm";

export class AddParentIdToTarefas1767300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "tarefas",
      new TableColumn({
        name: "parent_id",
        type: "integer",
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      "tarefas",
      new TableForeignKey({
        columnNames: ["parent_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "tarefas",
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("tarefas");
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("parent_id") !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey("tarefas", foreignKey);
      }
      await queryRunner.dropColumn("tarefas", "parent_id");
    }
  }
}
