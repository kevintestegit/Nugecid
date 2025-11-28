import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from "typeorm";

export class AddNumeroExtraido1730988000000 implements MigrationInterface {
  name = "AddNumeroExtraido1730988000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover índice unique do numero_nic_laudo_auto se existir
    try {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_numero_nic_laudo_auto"`,
      );
    } catch (error) {
      // Ignorar se não existir
    }

    // 2. Alterar tamanho da coluna numero_nic_laudo_auto de 100 para 500
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos" 
            ALTER COLUMN "numero_nic_laudo_auto" TYPE VARCHAR(500)
        `);

    // 3. Adicionar nova coluna numero_extraido
    await queryRunner.addColumn(
      "desarquivamentos",
      new TableColumn({
        name: "numero_extraido",
        type: "varchar",
        length: "50",
        isNullable: true,
      }),
    );

    // 4. Criar índice para numero_extraido (não unique)
    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_numero_extraido",
        columnNames: ["numero_extraido"],
      }),
    );

    // 5. Criar índice para numero_nic_laudo_auto (não unique)
    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_numero_nic_laudo_auto",
        columnNames: ["numero_nic_laudo_auto"],
      }),
    );

    // 6. Extrair números dos registros existentes
    await queryRunner.query(`
            UPDATE "desarquivamentos"
            SET "numero_extraido" = (
                SELECT SUBSTRING(
                    REGEXP_REPLACE("numero_nic_laudo_auto", '[.,\\-\\s]', '', 'g')
                    FROM '\\d{4,}'
                )
            )
            WHERE "numero_nic_laudo_auto" IS NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remover índices
    await queryRunner.dropIndex("desarquivamentos", "IDX_numero_extraido");
    await queryRunner.dropIndex(
      "desarquivamentos",
      "IDX_numero_nic_laudo_auto",
    );

    // 2. Remover coluna numero_extraido
    await queryRunner.dropColumn("desarquivamentos", "numero_extraido");

    // 3. Voltar tamanho da coluna numero_nic_laudo_auto para 100
    await queryRunner.query(`
            ALTER TABLE "desarquivamentos" 
            ALTER COLUMN "numero_nic_laudo_auto" TYPE VARCHAR(100)
        `);

    // 4. Recriar índice unique
    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_numero_nic_laudo_auto",
        columnNames: ["numero_nic_laudo_auto"],
        isUnique: true,
      }),
    );
  }
}
