import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RemoveWebPushColumns1767700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_preferences");
    if (!table) {
      return;
    }

    const pushEnabledColumn = table.findColumnByName("push_enabled");
    if (pushEnabledColumn) {
      await queryRunner.dropColumn("notification_preferences", "push_enabled");
    }

    const pushSubscriptionColumn = table.findColumnByName("push_subscription");
    if (pushSubscriptionColumn) {
      await queryRunner.dropColumn(
        "notification_preferences",
        "push_subscription",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("notification_preferences", [
      new TableColumn({
        name: "push_enabled",
        type: "boolean",
        default: false,
      }),
      new TableColumn({
        name: "push_subscription",
        type: "jsonb",
        isNullable: true,
      }),
    ]);
  }
}
