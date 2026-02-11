import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCriadoPorIdToPastas1733168500000 implements MigrationInterface {
  name = "AddCriadoPorIdToPastas1733168500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe
    const hasColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pastas' AND column_name = 'criado_por_id'
    `);

    if (hasColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "pastas" 
        ADD COLUMN "criado_por_id" integer
      `);

      await queryRunner.query(`
        ALTER TABLE "pastas" 
        ADD CONSTRAINT "FK_pastas_criado_por" 
        FOREIGN KEY ("criado_por_id") 
        REFERENCES "usuarios"("id") 
        ON DELETE SET NULL
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_pastas_criado_por_id" ON "pastas" ("criado_por_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pastas_criado_por_id"`);
    await queryRunner.query(
      `ALTER TABLE "pastas" DROP CONSTRAINT IF EXISTS "FK_pastas_criado_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pastas" DROP COLUMN IF EXISTS "criado_por_id"`,
    );
  }
}
