import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateNotificationPushSubscriptions1768500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(
      "notification_push_subscriptions",
    );

    if (tableExists) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: "notification_push_subscriptions",
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
            isNullable: false,
          },
          {
            name: "endpoint",
            type: "text",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "subscription",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "user_agent",
            type: "text",
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
        indices: [
          {
            name: "IDX_notification_push_subscriptions_user_id",
            columnNames: ["user_id"],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "notification_push_subscriptions",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "usuarios",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_push_subscriptions");
    if (!table) {
      return;
    }

    const userForeignKey = table.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes("user_id"),
    );

    if (userForeignKey) {
      await queryRunner.dropForeignKey(
        "notification_push_subscriptions",
        userForeignKey,
      );
    }

    await queryRunner.dropTable("notification_push_subscriptions");
  }
}
