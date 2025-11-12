import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEditadoToComentariosManual1760545200000
  implements MigrationInterface
{
  name = "AddEditadoToComentariosManual1760545200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnCheck = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comentarios' AND column_name = 'editado'
    `);

    if (columnCheck.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "comentarios" ADD "editado" boolean NOT NULL DEFAULT false`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnCheck = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comentarios' AND column_name = 'editado'
    `);

    if (columnCheck.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "comentarios" DROP COLUMN "editado"`,
      );
    }
  }
}
