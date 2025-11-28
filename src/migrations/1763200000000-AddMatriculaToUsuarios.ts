import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMatriculaToUsuarios1763200000000 implements MigrationInterface {
  name = "AddMatriculaToUsuarios1763200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "matricula" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "matricula"`);
  }
}
