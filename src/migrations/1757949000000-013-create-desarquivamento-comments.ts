import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDesarquivamentoComments1757949000000
  implements MigrationInterface
{
  name = "CreateDesarquivamentoComments1757949000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS desarquivamento_comments (
        id SERIAL PRIMARY KEY,
        desarquivamento_id INTEGER NOT NULL,
        user_id INTEGER,
        author_name VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_DESARQ_COMMENT_DESARQ FOREIGN KEY (desarquivamento_id)
          REFERENCES desarquivamentos(id) ON DELETE CASCADE,
        CONSTRAINT FK_DESARQ_COMMENT_USER FOREIGN KEY (user_id)
          REFERENCES usuarios(id) ON DELETE SET NULL
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_DESARQ_COMMENTS_DESARQ" ON desarquivamento_comments (desarquivamento_id)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_DESARQ_COMMENTS_USER" ON desarquivamento_comments (user_id)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_DESARQ_COMMENTS_USER"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_DESARQ_COMMENTS_DESARQ"',
    );
    await queryRunner.query("DROP TABLE IF EXISTS desarquivamento_comments");
  }
}
