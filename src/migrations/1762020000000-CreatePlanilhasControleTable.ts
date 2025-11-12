import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlanilhasControleTable1762020000000
  implements MigrationInterface
{
  name = "CreatePlanilhasControleTable1762020000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("planilhas_controle");
    if (hasTable) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "planilhas_controle" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome_original" character varying NOT NULL,
        "caminho" character varying NOT NULL,
        "tamanho_bytes" bigint NOT NULL,
        "data_upload" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_planilhas_controle_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("planilhas_controle");
    if (!hasTable) {
      return;
    }

    await queryRunner.query(`DROP TABLE "planilhas_controle"`);
  }
}
