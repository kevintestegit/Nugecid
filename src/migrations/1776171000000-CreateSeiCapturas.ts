import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSeiCapturas1776171000000 implements MigrationInterface {
  name = "CreateSeiCapturas1776171000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE "sei_capturas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero_processo_sei" character varying(255),
        "numero_pci" character varying(100),
        "data_entrada_sei" TIMESTAMP,
        "unidade_origem" character varying(255),
        "unidade_atual" character varying(255),
        "interessado" character varying(255),
        "assunto" text,
        "tipo_processo" character varying(255),
        "texto_resumo" text,
        "link_sei" text,
        "status" character varying(50) NOT NULL DEFAULT 'novo',
        "motivo_status" text,
        "campos_ausentes" text,
        "duplicidade_forte" boolean NOT NULL DEFAULT false,
        "duplicidade_provavel" boolean NOT NULL DEFAULT false,
        "desarquivamento_id" integer,
        "arquivo_origem" character varying(255),
        "linha_origem" integer,
        "dados_originais" jsonb NOT NULL,
        "criado_por_id" integer,
        "aprovado_por_id" integer,
        "importado_em" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sei_capturas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sei_capturas_numero_processo_sei" ON "sei_capturas" ("numero_processo_sei")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sei_capturas_numero_pci" ON "sei_capturas" ("numero_pci")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sei_capturas_status" ON "sei_capturas" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sei_capturas_created_at" ON "sei_capturas" ("created_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sei_capturas" ADD CONSTRAINT "FK_sei_capturas_desarquivamento" FOREIGN KEY ("desarquivamento_id") REFERENCES "desarquivamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sei_capturas" DROP CONSTRAINT "FK_sei_capturas_desarquivamento"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_sei_capturas_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_sei_capturas_status"`);
    await queryRunner.query(`DROP INDEX "IDX_sei_capturas_numero_pci"`);
    await queryRunner.query(
      `DROP INDEX "IDX_sei_capturas_numero_processo_sei"`,
    );
    await queryRunner.query(`DROP TABLE "sei_capturas"`);
  }
}
