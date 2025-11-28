import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateNotificationPreferences1763500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const tableExists = await queryRunner.hasTable("notification_preferences");

    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: "notification_preferences",
          columns: [
            {
              name: "id",
              type: "integer",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            {
              name: "user_id",
              type: "integer",
              isUnique: true,
              isNullable: false,
            },
            {
              name: "in_app_enabled",
              type: "boolean",
              default: true,
            },
            {
              name: "push_enabled",
              type: "boolean",
              default: false,
            },
            {
              name: "sound_enabled",
              type: "boolean",
              default: true,
            },
            {
              name: "enabled_types",
              type: "jsonb",
              default: `'{
                "solicitacao_pendente": true,
                "novo_processo": true,
                "novo_desarquivamento": true,
                "mencao": true,
                "tarefa_atribuida": true,
                "tarefa_alterada": true,
                "tarefa_comentada": true,
                "prazo_proximo": true,
                "tarefa_atrasada": true,
                "projeto_atualizado": true,
                "novo_registro": true,
                "pasta_criada": true,
                "evento_auditoria": false
              }'::jsonb`,
            },
            {
              name: "push_subscription",
              type: "jsonb",
              isNullable: true,
            },
            {
              name: "created_at",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
            {
              name: "updated_at",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        "notification_preferences",
        new TableForeignKey({
          columnNames: ["user_id"],
          referencedTableName: "usuarios",
          referencedColumnNames: ["id"],
          onDelete: "CASCADE",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_preferences");
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("user_id") !== -1,
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey("notification_preferences", foreignKey);
    }

    await queryRunner.dropTable("notification_preferences");
  }
}
