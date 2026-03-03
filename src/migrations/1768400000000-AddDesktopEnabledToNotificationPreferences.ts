import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDesktopEnabledToNotificationPreferences1768400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_preferences");
    if (!table) {
      return;
    }

    const desktopEnabledColumn = table.findColumnByName("desktop_enabled");
    if (!desktopEnabledColumn) {
      await queryRunner.addColumn(
        "notification_preferences",
        new TableColumn({
          name: "desktop_enabled",
          type: "boolean",
          default: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("notification_preferences");
    const desktopEnabledColumn = table?.findColumnByName("desktop_enabled");

    if (desktopEnabledColumn) {
      await queryRunner.dropColumn(
        "notification_preferences",
        "desktop_enabled",
      );
    }
  }
}
