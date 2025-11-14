import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from "typeorm";

export class AddNumeroProcessoToDesarquivamentoAnexos1763000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna numero_processo
    await queryRunner.addColumn(
      "desarquivamento_anexos",
      new TableColumn({
        name: "numero_processo",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // 2. Tornar desarquivamento_id NULLABLE (para permitir anexos apenas por processo)
    await queryRunner.changeColumn(
      "desarquivamento_anexos",
      "desarquivamento_id",
      new TableColumn({
        name: "desarquivamento_id",
        type: "integer",
        isNullable: true,
      }),
    );

    // 3. Adicionar constraint para garantir que ao menos um dos campos esteja preenchido
    await queryRunner.query(`
      ALTER TABLE desarquivamento_anexos 
      ADD CONSTRAINT chk_anexo_vinculo 
      CHECK (
        desarquivamento_id IS NOT NULL OR numero_processo IS NOT NULL
      )
    `);

    // 4. Criar índice para melhor performance nas buscas por processo
    await queryRunner.createIndex(
      "desarquivamento_anexos",
      new TableIndex({
        name: "IDX_desarquivamento_anexos_numero_processo",
        columnNames: ["numero_processo"],
      }),
    );

    // 5. Criar índice composto para buscas otimizadas
    await queryRunner.createIndex(
      "desarquivamento_anexos",
      new TableIndex({
        name: "IDX_desarquivamento_anexos_processo_tipo",
        columnNames: ["numero_processo", "tipo_anexo"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex(
      "desarquivamento_anexos",
      "IDX_desarquivamento_anexos_processo_tipo",
    );
    await queryRunner.dropIndex(
      "desarquivamento_anexos",
      "IDX_desarquivamento_anexos_numero_processo",
    );

    // Remover constraint
    await queryRunner.query(`
      ALTER TABLE desarquivamento_anexos 
      DROP CONSTRAINT IF EXISTS chk_anexo_vinculo
    `);

    // Tornar desarquivamento_id NOT NULL novamente
    await queryRunner.changeColumn(
      "desarquivamento_anexos",
      "desarquivamento_id",
      new TableColumn({
        name: "desarquivamento_id",
        type: "integer",
        isNullable: false,
      }),
    );

    // Remover coluna numero_processo
    await queryRunner.dropColumn("desarquivamento_anexos", "numero_processo");
  }
}
