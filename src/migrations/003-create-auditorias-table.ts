import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditoriasTable1700000003000 implements MigrationInterface {
  name = "CreateAuditoriasTable1700000003000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para actions
    await queryRunner.query(`
      CREATE TYPE audit_action_enum AS ENUM (
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'PASSWORD_RESET',
        'EXPORT',
        'IMPORT',
        'APPROVE',
        'REJECT',
        'ARCHIVE',
        'UNARCHIVE'
      )
    `);

    // Criar tabela auditorias
    await queryRunner.query(`
      CREATE TABLE "auditorias" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" integer,
        "action" audit_action_enum NOT NULL,
        "entity_name" varchar(100) NOT NULL,
        "entity_id" varchar(255),
        "details" jsonb DEFAULT '{}',
        "ip_address" varchar(45),
        "user_agent" text,
        "success" boolean DEFAULT true NOT NULL,
        "error" text,
        "response" jsonb,
        "timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Criar foreign key para usuarios
    await queryRunner.query(`
      ALTER TABLE "auditorias" 
      ADD CONSTRAINT "FK_AUDITORIAS_USER_ID" 
      FOREIGN KEY ("user_id") 
      REFERENCES "usuarios"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_AUDITORIAS_USER_ID" ON "auditorias" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDITORIAS_ACTION" ON "auditorias" ("action")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDITORIAS_ENTITY" ON "auditorias" ("entity_name", "entity_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDITORIAS_TIMESTAMP" ON "auditorias" ("timestamp")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDITORIAS_SUCCESS" ON "auditorias" ("success")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_AUDITORIAS_IP_ADDRESS" ON "auditorias" ("ip_address")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auditorias"`);
    await queryRunner.query(`DROP TYPE IF EXISTS audit_action_enum`);
  }
}
