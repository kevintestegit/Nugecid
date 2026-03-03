import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from "typeorm";

export class AddNotificacoesCampos1734723000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Atualizar enum tipo_notificacao
    await queryRunner.query(`
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'mencao';
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_atribuida';
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_alterada';
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_comentada';
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'prazo_proximo';
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_atrasada';
      ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'projeto_atualizado';
    `);

    // Adicionar coluna tarefa_id
    await queryRunner.addColumn(
      "notificacoes",
      new TableColumn({
        name: "tarefa_id",
        type: "integer",
        isNullable: true,
      }),
    );

    // Adicionar coluna projeto_id
    await queryRunner.addColumn(
      "notificacoes",
      new TableColumn({
        name: "projeto_id",
        type: "integer",
        isNullable: true,
      }),
    );

    // Adicionar coluna remetente_id
    await queryRunner.addColumn(
      "notificacoes",
      new TableColumn({
        name: "remetente_id",
        type: "integer",
        isNullable: true,
      }),
    );

    // Adicionar coluna link
    await queryRunner.addColumn(
      "notificacoes",
      new TableColumn({
        name: "link",
        type: "text",
        isNullable: true,
      }),
    );

    // Criar foreign key para tarefa_id
    await queryRunner.createForeignKey(
      "notificacoes",
      new TableForeignKey({
        columnNames: ["tarefa_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "tarefas",
        onDelete: "CASCADE",
      }),
    );

    // Criar foreign key para remetente_id
    await queryRunner.createForeignKey(
      "notificacoes",
      new TableForeignKey({
        columnNames: ["remetente_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "SET NULL",
      }),
    );

    // Criar índice para tarefa_id
    await queryRunner.query(
      'CREATE INDEX "IDX_notificacoes_tarefa_id" ON "notificacoes" ("tarefa_id")',
    );

    // Criar índice para projeto_id
    await queryRunner.query(
      'CREATE INDEX "IDX_notificacoes_projeto_id" ON "notificacoes" ("projeto_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query('DROP INDEX "IDX_notificacoes_projeto_id"');
    await queryRunner.query('DROP INDEX "IDX_notificacoes_tarefa_id"');

    // Remover foreign keys
    const table = await queryRunner.getTable("notificacoes");
    const tarefaFk = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("tarefa_id") !== -1,
    );
    const remetenteFk = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("remetente_id") !== -1,
    );

    if (tarefaFk) {
      await queryRunner.dropForeignKey("notificacoes", tarefaFk);
    }

    if (remetenteFk) {
      await queryRunner.dropForeignKey("notificacoes", remetenteFk);
    }

    // Remover colunas
    await queryRunner.dropColumn("notificacoes", "link");
    await queryRunner.dropColumn("notificacoes", "remetente_id");
    await queryRunner.dropColumn("notificacoes", "projeto_id");
    await queryRunner.dropColumn("notificacoes", "tarefa_id");
  }
}
