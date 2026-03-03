import { MigrationInterface, QueryRunner } from "typeorm";

export class DropRedundantReadIndexes1767900000000
  implements MigrationInterface
{
  name = "DropRedundantReadIndexes1767900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Duplicados exatos: manter IDX_desarquivamentos_* e remover os legados singular.
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamento_instituto"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_desarquivamento_requerente"`,
    );

    // Duplicado de numero_extraido: manter IDX_numero_extraido (usado em migration anterior).
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_84db5d4eba587bf583b1c99984"`,
    );

    // Índice redundante adicional para numero_nic_laudo_auto.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nic`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_desarquivamento_instituto"
      ON "desarquivamentos" ("instituto")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_desarquivamento_requerente"
      ON "desarquivamentos" ("requerente")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_84db5d4eba587bf583b1c99984"
      ON "desarquivamentos" ("numero_extraido")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_desarq_nic
      ON "desarquivamentos" ("numero_nic_laudo_auto")
    `);
  }
}
