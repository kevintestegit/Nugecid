import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNumeroSolicitacao1759300000001 implements MigrationInterface {
  name = "AddNumeroSolicitacao1759300000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE desarquivamentos
      ADD COLUMN numero_solicitacao SERIAL UNIQUE NOT NULL
    `);

    // Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX IDX_DESARQUIVAMENTOS_NUMERO_SOLICITACAO
      ON desarquivamentos (numero_solicitacao)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_DESARQUIVAMENTOS_NUMERO_SOLICITACAO
    `);

    await queryRunner.query(`
      ALTER TABLE desarquivamentos
      DROP COLUMN numero_solicitacao
    `);
  }
}
