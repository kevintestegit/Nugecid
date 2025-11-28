import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFieldsNullable1730988100000 implements MigrationInterface {
  name = "MakeFieldsNullable1730988100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tornar numero_processo nullable
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos" 
            ALTER COLUMN "numero_processo" DROP NOT NULL
        `);

    // Tornar setor_demandante nullable
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos" 
            ALTER COLUMN "setor_demandante" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Voltar numero_processo para NOT NULL
    // Preencher valores vazios antes de aplicar NOT NULL
    await queryRunner.query(`
            UPDATE "desarquivamentos" 
            SET "numero_processo" = 'Não informado' 
            WHERE "numero_processo" IS NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "desarquivamentos" 
            ALTER COLUMN "numero_processo" SET NOT NULL
        `);

    // Voltar setor_demandante para NOT NULL
    await queryRunner.query(`
            UPDATE "desarquivamentos" 
            SET "setor_demandante" = 'Não informado' 
            WHERE "setor_demandante" IS NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "desarquivamentos" 
            ALTER COLUMN "setor_demandante" SET NOT NULL
        `);
  }
}
