import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStatusEnum1756810640639 implements MigrationInterface {
  name = "UpdateStatusEnum1756810640639";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover o índice conflitante
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_DESARQUIVAMENTOS_URGENTE_PENDENTE"`,
    );

    // 2. Renomear o enum existente
    await queryRunner.query(
      `ALTER TYPE "status_desarquivamento_enum" RENAME TO "status_desarquivamento_enum_old"`,
    );

    // 3. Criar o novo enum com os valores corretos
    await queryRunner.query(`
      CREATE TYPE "status_desarquivamento_enum" AS ENUM (
        'FINALIZADO',
        'DESARQUIVADO',
        'NAO_COLETADO',
        'SOLICITADO',
        'REARQUIVAMENTO_SOLICITADO',
        'RETIRADO_PELO_SETOR',
        'NAO_LOCALIZADO'
      );
    `);

    // 4. Remover o valor padrão antigo
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" DROP DEFAULT`,
    );

    // 5. Alterar a coluna para usar o novo enum, convertendo os valores
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "status" TYPE "status_desarquivamento_enum"
      USING CASE "status"::text
        WHEN 'PENDENTE' THEN 'SOLICITADO'::"status_desarquivamento_enum"
        ELSE "status"::text::"status_desarquivamento_enum"
      END;
    `);

    // 6. Definir o novo valor padrão
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" SET DEFAULT 'SOLICITADO'`,
    );

    // 7. Remover o enum antigo
    await queryRunner.query(`DROP TYPE "status_desarquivamento_enum_old"`);

    // 8. Recriar o índice com o novo valor
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_URGENTE_PENDENTE" ON "desarquivamentos" ("urgente", "status") WHERE urgente = true AND status = 'SOLICITADO'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Criar o enum antigo
    await queryRunner.query(`
      CREATE TYPE "status_desarquivamento_enum_old" AS ENUM (
        'PENDENTE',
        'EM_ANDAMENTO',
        'DESARQUIVADO',
        'DEVOLVIDO',
        'CANCELADO'
      );
    `);

    // Alterar a coluna de volta para o enum antigo
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos"
      ALTER COLUMN "status" TYPE "status_desarquivamento_enum_old"
      USING CASE "status"::text
        WHEN 'SOLICITADO' THEN 'PENDENTE'::"status_desarquivamento_enum_old"
        ELSE "status"::text::"status_desarquivamento_enum_old"
      END;
    `);

    // Remover o novo enum
    await queryRunner.query(`DROP TYPE "status_desarquivamento_enum"`);

    // Renomear o enum antigo de volta
    await queryRunner.query(
      `ALTER TYPE "status_desarquivamento_enum_old" RENAME TO "status_desarquivamento_enum"`,
    );
  }
}
