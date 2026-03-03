import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTipoDocumentoToVarchar1756820000000
  implements MigrationInterface
{
  name = "AlterTipoDocumentoToVarchar1756820000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar o campo tipo_documento de enum para varchar
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos" 
      ALTER COLUMN "tipo_documento" TYPE varchar(255) 
      USING "tipo_documento"::text;
    `);

    // Remover o enum tipo_documento_enum se não estiver sendo usado em outros lugares
    await queryRunner.query(`
      DROP TYPE IF EXISTS tipo_documento_enum;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recriar o enum
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

    // Voltar o campo para enum (apenas valores válidos serão mantidos)
    await queryRunner.query(`
      ALTER TABLE "desarquivamentos" 
      ALTER COLUMN "tipo_documento" TYPE tipo_documento_enum 
      USING CASE 
        WHEN "tipo_documento" IN ('LAUDO', 'AUTO_INFRACAO', 'PROCESSO', 'OFICIO', 'RELATORIO', 'OUTROS') 
        THEN "tipo_documento"::tipo_documento_enum 
        ELSE 'OUTROS'::tipo_documento_enum 
      END;
    `);
  }
}
