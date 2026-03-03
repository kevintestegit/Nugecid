import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateBlockedIps1763400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "blocked_ips",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "ip_address",
            type: "varchar",
            length: "45",
            isUnique: true,
          },
          {
            name: "reason",
            type: "text",
            isNullable: true,
          },
          {
            name: "blocked_by",
            type: "int",
            isNullable: true,
          },
          {
            name: "blocked_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "attempts_count",
            type: "int",
            default: 0,
          },
          {
            name: "last_attempt_at",
            type: "timestamp",
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
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    // Índice para busca rápida por IP
    await queryRunner.createIndex(
      "blocked_ips",
      new TableIndex({
        name: "IDX_BLOCKED_IPS_IP_ADDRESS",
        columnNames: ["ip_address"],
      }),
    );

    // Índice para busca de IPs ativos
    await queryRunner.createIndex(
      "blocked_ips",
      new TableIndex({
        name: "IDX_BLOCKED_IPS_IS_ACTIVE",
        columnNames: ["is_active"],
      }),
    );

    // Foreign key para o usuário que bloqueou
    await queryRunner.createForeignKey(
      "blocked_ips",
      new TableForeignKey({
        columnNames: ["blocked_by"],
        referencedColumnNames: ["id"],
        referencedTableName: "usuarios",
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("blocked_ips");
  }
}
