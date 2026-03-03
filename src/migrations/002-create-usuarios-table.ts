import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateUsuariosTable1700000002000 implements MigrationInterface {
  name = "CreateUsuariosTable1700000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "usuarios",
        columns: [
          {
            name: "id",
            type: "serial",
            isPrimary: true,
          },
          {
            name: "nome",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "usuario",
            type: "varchar",
            length: "100",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "senha",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "role_id",
            type: "integer",
            isNullable: false,
          },
          {
            name: "ultimo_login",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "ativo",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "tentativas_login",
            type: "integer",
            default: 0,
            isNullable: false,
          },
          {
            name: "bloqueado_ate",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "token_reset",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "token_reset_expira",
            type: "timestamptz",
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

    // Criar foreign key para roles
    await queryRunner.createForeignKey(
      "usuarios",
      new TableForeignKey({
        columnNames: ["role_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "roles",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      }),
    );

    // Criar índices
    await queryRunner.createIndex(
      "usuarios",
      new TableIndex({
        name: "IDX_USUARIOS_USUARIO",
        columnNames: ["usuario"],
      }),
    );

    await queryRunner.createIndex(
      "usuarios",
      new TableIndex({ name: "IDX_USUARIOS_ATIVO", columnNames: ["ativo"] }),
    );

    await queryRunner.createIndex(
      "usuarios",
      new TableIndex({
        name: "IDX_USUARIOS_ROLE_ID",
        columnNames: ["role_id"],
      }),
    );

    await queryRunner.createIndex(
      "usuarios",
      new TableIndex({
        name: "IDX_USUARIOS_DELETED_AT",
        columnNames: ["deleted_at"],
      }),
    );

    await queryRunner.createIndex(
      "usuarios",
      new TableIndex({
        name: "IDX_USUARIOS_TOKEN_RESET",
        columnNames: ["token_reset"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("usuarios");
  }
}
