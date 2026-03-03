import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAtivaToColunas1759300000000 implements MigrationInterface {
  name = "AddAtivaToColunas1759300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "colunas" ADD COLUMN IF NOT EXISTS "ativa" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "colunas" SET "ativa" = true WHERE "ativa" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "colunas" DROP COLUMN IF EXISTS "ativa"`,
    );
  }
}
