import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateSystemAnnouncements1763600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela system_announcements
    await queryRunner.createTable(
      new Table({
        name: 'system_announcements',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
            default: "'medium'",
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'target_roles',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key para criador
    await queryRunner.createForeignKey(
      'system_announcements',
      new TableForeignKey({
        columnNames: ['created_by_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índices
    await queryRunner.createIndex(
      'system_announcements',
      new TableIndex({
        name: 'IDX_ANNOUNCEMENTS_ACTIVE',
        columnNames: ['active'],
      }),
    );

    await queryRunner.createIndex(
      'system_announcements',
      new TableIndex({
        name: 'IDX_ANNOUNCEMENTS_DATES',
        columnNames: ['start_date', 'end_date'],
      }),
    );

    // Criar tabela announcement_viewed
    await queryRunner.createTable(
      new Table({
        name: 'announcement_viewed',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'announcement_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'viewed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'announcement_viewed',
      new TableForeignKey({
        columnNames: ['announcement_id'],
        referencedTableName: 'system_announcements',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'announcement_viewed',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índice único para evitar duplicatas
    await queryRunner.createIndex(
      'announcement_viewed',
      new TableIndex({
        name: 'IDX_ANNOUNCEMENT_VIEWED_UNIQUE',
        columnNames: ['announcement_id', 'user_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabelas
    await queryRunner.dropTable('announcement_viewed', true);
    await queryRunner.dropTable('system_announcements', true);
  }
}
