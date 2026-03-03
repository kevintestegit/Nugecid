import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProcessoSetorNullable1767600000000
  implements MigrationInterface
{
  name = "MakeProcessoSetorNullable1767600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "numero_processo" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "setor_demandante" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "desarquivamentos"
      SET "numero_processo" = ''
      WHERE "numero_processo" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "desarquivamentos"
      SET "setor_demandante" = ''
      WHERE "setor_demandante" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "numero_processo" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "setor_demandante" SET NOT NULL
    `);
  }
}
