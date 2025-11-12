import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateDesarquivamentosTable1700000004000
  implements MigrationInterface
{
  name = "CreateDesarquivamentosTable1700000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums para desarquivamentos (se não existirem)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_desarquivamento_enum AS ENUM (
          'FISICO',
          'DIGITAL',
          'NAO_LOCALIZADO'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE status_desarquivamento_enum AS ENUM (
          'PENDENTE',
          'EM_ANDAMENTO',
          'DESARQUIVADO',
          'DEVOLVIDO',
          'CANCELADO'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_documento_enum AS ENUM (
          'LAUDO',
          'AUTO_INFRACAO',
          'PROCESSO',
          'OFICIO',
          'RELATORIO',
          'OUTROS'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: "desarquivamentos",
        columns: [
          {
            name: "id",
            type: "serial",
            isPrimary: true,
          },
          {
            name: "tipo_desarquivamento",
            type: "tipo_desarquivamento_enum",
            isNullable: false,
          },
          {
            name: "status",
            type: "status_desarquivamento_enum",
            default: "'PENDENTE'",
            isNullable: false,
          },
          {
            name: "nome_completo",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "numero_nic_laudo_auto",
            type: "varchar",
            length: "100",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "numero_processo",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "tipo_documento",
            type: "tipo_documento_enum",
            isNullable: false,
          },
          {
            name: "data_solicitacao",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "data_desarquivamento_sag",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "data_devolucao_setor",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "setor_demandante",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "servidor_responsavel",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "finalidade_desarquivamento",
            type: "text",
            isNullable: false,
          },
          {
            name: "solicitacao_prorrogacao",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "urgente",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "created_by",
            type: "integer",
            isNullable: false,
          },
          {
            name: "responsavel_id",
            type: "integer",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "deleted_at",
            type: "timestamptz",
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      "desarquivamentos",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedColumnNames: ["id"],
        referencedTableName: "usuarios",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "desarquivamentos",
      new TableForeignKey({
        columnNames: ["responsavel_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "usuarios",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      }),
    );

    // Criar índices
    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_NUMERO_NIC",
        columnNames: ["numero_nic_laudo_auto"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_STATUS",
        columnNames: ["status"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_TIPO",
        columnNames: ["tipo_desarquivamento"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO",
        columnNames: ["data_solicitacao"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_CREATED_BY",
        columnNames: ["created_by"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_RESPONSAVEL",
        columnNames: ["responsavel_id"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_URGENTE",
        columnNames: ["urgente"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_DELETED_AT",
        columnNames: ["deleted_at"],
      }),
    );

    await queryRunner.createIndex(
      "desarquivamentos",
      new TableIndex({
        name: "IDX_DESARQUIVAMENTOS_SETOR",
        columnNames: ["setor_demandante"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("desarquivamentos");
    await queryRunner.query("DROP TYPE IF EXISTS tipo_desarquivamento_enum;");
    await queryRunner.query("DROP TYPE IF EXISTS status_desarquivamento_enum;");
    await queryRunner.query("DROP TYPE IF EXISTS tipo_documento_enum;");
  }
}
