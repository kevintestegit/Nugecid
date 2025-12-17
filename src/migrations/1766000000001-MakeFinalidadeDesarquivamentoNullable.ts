import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFinalidadeDesarquivamentoNullable1766000000001
  implements MigrationInterface
{
  name = "MakeFinalidadeDesarquivamentoNullable1766000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "finalidade_desarquivamento" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "desarquivamentos"
      SET "finalidade_desarquivamento" = ''
      WHERE "finalidade_desarquivamento" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "finalidade_desarquivamento" SET NOT NULL
    `);
  }
}

