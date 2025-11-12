import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Garante que o enum notificacoes_tipo_enum possua o valor
 * 'novo_desarquivamento', necessário para notificar o criador
 * de uma nova solicitação. Sem isso o INSERT falha.
 */
export class AddNovoDesarquivamentoTipo1737060000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "notificacoes_tipo_enum"
      ADD VALUE IF NOT EXISTS 'novo_desarquivamento';
    `);
  }

  // Não é possível remover valores de ENUM do Postgres facilmente;
  // manter o método down sem ação documenta essa limitação.
  public async down(): Promise<void> {
    return;
  }
}
