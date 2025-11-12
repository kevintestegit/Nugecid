import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNumeroNicLaudoAutoUniqueConstraint1758896630308
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remover a constraint única da coluna numero_nic_laudo_auto
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos"
            DROP CONSTRAINT IF EXISTS "UQ_1f854addb916eae485509b5f97a"
        `);

    // Remover o index único se existir
    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_1f854addb916eae485509b5f97a"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recriar a constraint única (rollback)
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos"
            ADD CONSTRAINT "UQ_1f854addb916eae485509b5f97a" UNIQUE ("numero_nic_laudo_auto")
        `);
  }
}
