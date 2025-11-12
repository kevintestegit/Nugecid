import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToComentarios1760534469393
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna deleted_at à tabela comentarios se não existir
    await queryRunner.query(`
            ALTER TABLE "comentarios"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
        `);

    // Criar index na coluna deleted_at
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_comentarios_deleted_at"
            ON "comentarios" ("deleted_at")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover index
    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_comentarios_deleted_at"
        `);

    // Remover coluna deleted_at
    await queryRunner.query(`
            ALTER TABLE "comentarios"
            DROP COLUMN IF EXISTS "deleted_at"
        `);
  }
}
