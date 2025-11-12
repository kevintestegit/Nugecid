import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustDesarquivamentoLengths1757948200002
  implements MigrationInterface
{
  name = "AdjustDesarquivamentoLengths1757948200002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE desarquivamentos
      ALTER COLUMN numero_processo TYPE varchar(255)
      USING LEFT(numero_processo, 255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE desarquivamentos
      ALTER COLUMN numero_processo TYPE varchar(100)
      USING LEFT(numero_processo, 100)
    `);
  }
}
