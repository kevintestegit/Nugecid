import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePastasTableManual1760546400000
  implements MigrationInterface
{
  name = "CreatePastasTableManual1760546400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("pastas");
    if (!exists) {
      await queryRunner.query(
        `CREATE TABLE "pastas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying NOT NULL, "descricao" character varying NOT NULL, "imagens" integer NOT NULL DEFAULT '0', "planilhas" integer NOT NULL DEFAULT '0', "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "tags" text NOT NULL, CONSTRAINT "PK_43a993b522e01a6a2f0da32041e" PRIMARY KEY ("id"))`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pastas"`);
  }
}
