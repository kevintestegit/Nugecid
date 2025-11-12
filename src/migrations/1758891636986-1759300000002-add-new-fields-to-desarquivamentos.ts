import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewFieldsToDesarquivamentos1758891636986
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna para texto da solicitação de prorrogação
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos"
            ADD COLUMN "solicitacao_prorrogacao_texto" text
        `);

    // Adicionar coluna para dados adicionais
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos"
            ADD COLUMN "dados_adicionais" text
        `);

    // A coluna urgente já existe, então não precisa adicionar
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover as colunas adicionadas
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos"
            DROP COLUMN "dados_adicionais"
        `);

    await queryRunner.query(`
            ALTER TABLE "desarquivamentos"
            DROP COLUMN "solicitacao_prorrogacao_texto"
        `);
  }
}
