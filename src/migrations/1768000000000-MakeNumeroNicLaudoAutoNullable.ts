import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeNumeroNicLaudoAutoNullable1768000000000
  implements MigrationInterface
{
  name = "MakeNumeroNicLaudoAutoNullable1768000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "numero_nic_laudo_auto" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "desarquivamentos"
      SET "numero_nic_laudo_auto" = 'NAO-INFORMADO'
      WHERE "numero_nic_laudo_auto" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "numero_nic_laudo_auto" SET NOT NULL
    `);
  }
}
