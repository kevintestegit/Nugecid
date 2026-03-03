import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPushEnabledToNotificationPreferences1768600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_preferences");
    if (!table) {
      return;
    }

    const pushEnabledColumn = table.findColumnByName("push_enabled");
    if (!pushEnabledColumn) {
      await queryRunner.addColumn(
        "notification_preferences",
        new TableColumn({
          name: "push_enabled",
          type: "boolean",
          default: false,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE notification_preferences
      SET push_enabled = COALESCE(desktop_enabled, false)
      WHERE push_enabled IS DISTINCT FROM COALESCE(desktop_enabled, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_preferences");
    const pushEnabledColumn = table?.findColumnByName("push_enabled");

    if (pushEnabledColumn) {
      await queryRunner.dropColumn("notification_preferences", "push_enabled");
    }
  }
}
