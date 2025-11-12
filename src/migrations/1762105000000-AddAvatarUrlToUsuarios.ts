import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarUrlToUsuarios1762105000000
  implements MigrationInterface
{
  name = "AddAvatarUrlToUsuarios1762105000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "avatar_url" character varying(512)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "avatar_url"`,
    );
  }
}
