import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesToInstitutoRequerente1733754977000
  implements MigrationInterface
{
  name = "AddIndexesToInstitutoRequerente1733754977000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar índices para melhorar performance nas buscas
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_desarquivamento_instituto" 
            ON "desarquivamentos" ("instituto")
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_desarquivamento_requerente" 
            ON "desarquivamentos" ("requerente")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamento_requerente"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamento_instituto"`,
    );
  }
}
