import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolesTable1700000001000 implements MigrationInterface {
  name = "CreateRolesTable1700000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(100) UNIQUE NOT NULL,
        "description" text,
        "permissions" jsonb DEFAULT '{}',
        "ativo" boolean DEFAULT true NOT NULL,
        "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_ROLES_NAME" ON "roles" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ROLES_ATIVO" ON "roles" ("ativo")
    `);

    // Inserir roles padrão
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "description", "permissions", "ativo") VALUES 
      (1, 'admin', 'Administrador do sistema', '{"all": true}', true),
      (2, 'coordenador', 'Coordenador', '{"read": true, "create": true, "update": true}', true),
      (3, 'usuario', 'Usuário padrão', '{"read": true}', true)
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
