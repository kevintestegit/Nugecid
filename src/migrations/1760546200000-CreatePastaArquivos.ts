import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePastaArquivos1760546200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const pastasExists = await queryRunner.hasTable("pastas");

    if (!pastasExists) {
      await queryRunner.query(`
        CREATE TABLE "pastas" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "nome" character varying NOT NULL,
          "descricao" character varying NOT NULL,
          "imagens" integer NOT NULL DEFAULT 0,
          "planilhas" integer NOT NULL DEFAULT 0,
          "data_criacao" TIMESTAMP NOT NULL DEFAULT now(),
          "tags" text NOT NULL,
          CONSTRAINT "PK_43a993b522e01a6a2f0da32041e" PRIMARY KEY ("id")
        )
      `);
    }

    const exists = await queryRunner.hasTable("pasta_arquivos");
    if (exists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "pasta_arquivos" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "pasta_id" uuid NOT NULL,
        "tipo" VARCHAR(20) NOT NULL,
        "nome_original" VARCHAR(255) NOT NULL,
        "caminho" VARCHAR(512) NOT NULL,
        "tamanho_bytes" BIGINT NOT NULL,
        "data_upload" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_pasta_arquivos_pasta" FOREIGN KEY ("pasta_id") REFERENCES "pastas"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_pasta_arquivos_pasta" ON "pasta_arquivos" ("pasta_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pasta_arquivos_tipo" ON "pasta_arquivos" ("tipo");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pasta_arquivos_tipo";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pasta_arquivos_pasta";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pasta_arquivos";`);
    // Não remove a tabela pastas aqui para manter consistência com migrações subsequentes
  }
}
