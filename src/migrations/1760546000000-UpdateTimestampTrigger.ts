import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTimestampTrigger1760546000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      DECLARE
        new_record JSONB;
      BEGIN
        new_record := to_jsonb(NEW);

        IF new_record ? 'updated_at' THEN
          NEW.updated_at := CURRENT_TIMESTAMP;
        ELSIF new_record ? 'data_atualizacao' THEN
          NEW.data_atualizacao := CURRENT_TIMESTAMP;
        ELSE
          RAISE WARNING 'update_updated_at_column: coluna de atualizaÃ§Ã£o nÃ£o encontrada na tabela %', TG_TABLE_NAME;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
