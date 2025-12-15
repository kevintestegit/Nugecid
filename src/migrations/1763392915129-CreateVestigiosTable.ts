import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateVestigiosTable1763392915129 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "vestigios",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "codigo_scv",
            type: "varchar",
            length: "100",
          },
          {
            name: "classe_principal",
            type: "varchar",
            length: "50",
          },
          {
            name: "grupo_codigo",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "subdivisao_codigo",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "facetas",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "facetas_descricoes",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "numero_vestigio",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "numero_caso",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "categoria",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "delegacia",
            type: "varchar",
            length: "200",
            isNullable: true,
          },
          {
            name: "mes_referencia",
            type: "varchar",
            length: "10",
            isNullable: true,
          },
          {
            name: "etiqueta_completa",
            type: "text",
          },
          {
            name: "status",
            type: "varchar",
            length: "50",
            default: "'ativo'",
          },
          {
            name: "observacoes",
            type: "text",
            isNullable: true,
          },
          {
            name: "criado_por_id",
            type: "integer",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "vestigios",
      new TableForeignKey({
        columnNames: ["criado_por_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "usuarios",
        onDelete: "SET NULL",
      }),
    );

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_vestigios_codigo_scv ON vestigios(codigo_scv);
            CREATE INDEX IF NOT EXISTS idx_vestigios_numero_vestigio ON vestigios(numero_vestigio);
            CREATE INDEX IF NOT EXISTS idx_vestigios_numero_caso ON vestigios(numero_caso);
            CREATE INDEX IF NOT EXISTS idx_vestigios_status ON vestigios(status);
            CREATE INDEX IF NOT EXISTS idx_vestigios_categoria ON vestigios(categoria);
            CREATE INDEX IF NOT EXISTS idx_vestigios_delegacia ON vestigios(delegacia);
            CREATE INDEX IF NOT EXISTS idx_vestigios_mes_referencia ON vestigios(mes_referencia);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX IF EXISTS idx_vestigios_mes_referencia;
            DROP INDEX IF EXISTS idx_vestigios_delegacia;
            DROP INDEX IF EXISTS idx_vestigios_categoria;
            DROP INDEX IF EXISTS idx_vestigios_status;
            DROP INDEX IF EXISTS idx_vestigios_numero_caso;
            DROP INDEX IF EXISTS idx_vestigios_numero_vestigio;
            DROP INDEX IF EXISTS idx_vestigios_codigo_scv;
        `);

    const table = await queryRunner.getTable("vestigios");
    const foreignKey = table!.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("criado_por_id") !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("vestigios", foreignKey);
    }

    await queryRunner.dropTable("vestigios");
  }
}
