import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjetosTable1758124112456 implements MigrationInterface {
  name = "014CreateProjetosTable1758124112456";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auditorias" DROP CONSTRAINT "FK_AUDITORIAS_USER_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "FK_933f1f766daaa16d3848d186a59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP CONSTRAINT "FK_22f094b11205fc0a5fd1806db89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP CONSTRAINT "FK_5953b78a5f8eac818837a842008"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ROLES_NAME"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ROLES_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ROLES_SETTINGS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIAS_USER_ID"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIAS_ACTION"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIAS_ENTITY"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIAS_TIMESTAMP"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIAS_SUCCESS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_AUDITORIAS_IP_ADDRESS"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUDITORIAS_USER_TIMESTAMP"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_AUDITORIAS_ENTITY_ACTION"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_USUARIO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_ROLE_ID"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_DELETED_AT"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_TOKEN_RESET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_ROLE_ATIVO"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_USUARIOS_ATIVO_NOT_DELETED"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_USUARIOS_SETTINGS"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_NUMERO_NIC"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_DESARQUIVAMENTOS_TIPO"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_CREATED_BY"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_DELETED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_RESPONSAVEL"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_URGENTE"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_DESARQUIVAMENTOS_SETOR"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_STATUS"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_STATUS_DATA"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_NOT_DELETED"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_URGENTE_PENDENTE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_DESARQUIVAMENTOS_NUMERO_PROCESSO"`,
    );
    await queryRunner.query(
      `CREATE TABLE "colunas" ("id" SERIAL NOT NULL, "projeto_id" integer NOT NULL, "nome" character varying(100) NOT NULL, "cor" character varying(7) NOT NULL DEFAULT '#3B82F6', "ordem" integer NOT NULL, "ativa" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21100b0dba579f40b31338561ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membros_projeto_papel_enum" AS ENUM('admin', 'editor', 'viewer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "membros_projeto" ("id" SERIAL NOT NULL, "projeto_id" integer NOT NULL, "usuario_id" integer NOT NULL, "papel" "public"."membros_projeto_papel_enum" NOT NULL DEFAULT 'viewer', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cbb8a02588c227904da9b1adb2a" UNIQUE ("projeto_id", "usuario_id"), CONSTRAINT "PK_880851f4e6c101277a40a808729" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "projetos" ("id" SERIAL NOT NULL, "nome" character varying(255) NOT NULL, "descricao" text, "criador_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb6b6aed4b30e10b976fe8bdf5b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comentarios" ("id" SERIAL NOT NULL, "tarefa_id" integer NOT NULL, "autor_id" integer NOT NULL, "conteudo" text NOT NULL, "editado" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b60b1468bb275db8d5e875c4a78" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "itens_checklist" ("id" SERIAL NOT NULL, "checklist_id" integer NOT NULL, "texto" character varying(500) NOT NULL, "concluido" boolean NOT NULL DEFAULT false, "ordem" integer NOT NULL, "concluido_por_id" integer, "concluido_em" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_247b3e0f6ebc51c54c884df0787" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "checklists" ("id" SERIAL NOT NULL, "tarefa_id" integer NOT NULL, "titulo" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_336ade2047f3d713e1afa20d2c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "anexos" ("id" SERIAL NOT NULL, "tarefa_id" integer NOT NULL, "usuario_id" integer NOT NULL, "nome_original" character varying(255) NOT NULL, "nome_arquivo" character varying(255) NOT NULL, "caminho_arquivo" character varying(500) NOT NULL, "tipo_mime" character varying(100) NOT NULL, "tamanho_bytes" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da398d73b0fa1e7549520adc9f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."historico_tarefas_acao_enum" AS ENUM('criacao', 'edicao', 'movimentacao', 'atribuicao', 'prazo_alterado', 'prioridade_alterada', 'comentario_adicionado', 'comentario', 'anexo_adicionado', 'checklist_adicionado', 'item_checklist_concluido', 'tag_adicionada', 'tag_removida', 'exclusao')`,
    );
    await queryRunner.query(
      `CREATE TABLE "historico_tarefas" ("id" SERIAL NOT NULL, "tarefa_id" integer NOT NULL, "usuario_id" integer NOT NULL, "acao" "public"."historico_tarefas_acao_enum" NOT NULL, "descricao" text, "dadosAnteriores" jsonb, "dadosNovos" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1607a878f2c8e4b8ea1d62e64c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tarefas_prioridade_enum" AS ENUM('baixa', 'media', 'alta', 'critica')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tarefas" ("id" SERIAL NOT NULL, "projeto_id" integer NOT NULL, "coluna_id" integer NOT NULL, "titulo" character varying(255) NOT NULL, "descricao" text, "criador_id" integer NOT NULL, "responsavel_id" integer, "prazo" date, "prioridade" "public"."tarefas_prioridade_enum" NOT NULL DEFAULT 'media', "ordem" integer NOT NULL, "tags" jsonb NOT NULL DEFAULT '[]'::jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_2f57a4443470e61ac5de297e30a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "registros" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numero_processo" character varying(255) NOT NULL, "delegacia_origem" character varying(255) NOT NULL, "nome_vitima" character varying(255) NOT NULL, "data_fato" date NOT NULL, "investigador_responsavel" character varying(255), "idade_vitima" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_34c305689a504166a73ccaec0b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "tipo_desarquivamento"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tipo_desarquivamento_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."desarquivamentos_desarquivamento_fisico_digital_enum" AS ENUM('FISICO', 'DIGITAL', 'NAO_LOCALIZADO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "desarquivamento_fisico_digital" "public"."desarquivamentos_desarquivamento_fisico_digital_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_name_key"`,
    );

    // Ajuste seguro para reduzir o tamanho da coluna sem perder dados
    await queryRunner.query(
      `ALTER TABLE "roles" RENAME COLUMN "name" TO "name_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "name" character varying(50)`,
    );
    await queryRunner.query(`UPDATE "roles" SET "name" = LEFT("name_old", 50)`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name_old"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name")`,
    );

    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "description" TYPE character varying(255) USING LEFT("description", 255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "settings" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "settings" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE text USING "permissions"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "created_at" TYPE TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "updated_at" TYPE TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" DROP CONSTRAINT "auditorias_pkey"`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD CONSTRAINT "PK_b84b3505f313ab1a44e7b684ee2" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "action"`);
    await queryRunner.query(`DROP TYPE "public"."audit_action_enum"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "action" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "entity_id"`);
    await queryRunner.query(`ALTER TABLE "auditorias" ADD "entity_id" integer`);
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "details"`);
    await queryRunner.query(`ALTER TABLE "auditorias" ADD "details" text`);
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "response"`);
    await queryRunner.query(`ALTER TABLE "auditorias" ADD "response" text`);
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "timestamp"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "timestamp" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "UQ_0790a401b9d234fa921e9aa1777"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "usuario"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "usuario" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "UQ_0790a401b9d234fa921e9aa1777" UNIQUE ("usuario")`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "role_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "ultimo_login"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "ultimo_login" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "bloqueado_ate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "bloqueado_ate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "token_reset_expira"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "token_reset_expira" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "settings" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "settings" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."status_desarquivamento_enum" RENAME TO "status_desarquivamento_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."desarquivamentos_status_enum" AS ENUM('FINALIZADO', 'DESARQUIVADO', 'NAO_COLETADO', 'SOLICITADO', 'REARQUIVAMENTO_SOLICITADO', 'RETIRADO_PELO_SETOR', 'NAO_LOCALIZADO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" TYPE "public"."desarquivamentos_status_enum" USING "status"::"text"::"public"."desarquivamentos_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" SET DEFAULT 'SOLICITADO'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."status_desarquivamento_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "numero_processo" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "tipo_documento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "tipo_documento" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "data_solicitacao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "data_solicitacao" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "data_desarquivamento_sag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "data_desarquivamento_sag" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "data_devolucao_setor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "data_devolucao_setor" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "urgente" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22f094b11205fc0a5fd1806db8" ON "desarquivamentos" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70c402d367e5bd15d2cdbcf36c" ON "desarquivamentos" ("data_solicitacao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94b0719f893403890a79cfb30b" ON "desarquivamentos" ("desarquivamento_fisico_digital") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73e021d4d498eda6f6a8ea6750" ON "desarquivamentos" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_900d44fa1a3c1812c0d439a90e" ON "desarquivamentos" ("numero_processo") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1f854addb916eae485509b5f97" ON "desarquivamentos" ("numero_nic_laudo_auto") `,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD CONSTRAINT "FK_21b7d36a2eed9a8d26ebb80f51e" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "FK_933f1f766daaa16d3848d186a59" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "colunas" ADD CONSTRAINT "FK_dc1c91ba3046abf8aa44be533bd" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membros_projeto" ADD CONSTRAINT "FK_e6965151e12e96cb0318a506c31" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membros_projeto" ADD CONSTRAINT "FK_9655da2f96b65913b0666cd81d7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projetos" ADD CONSTRAINT "FK_9dd48438e8e95939b63880efae2" FOREIGN KEY ("criador_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios" ADD CONSTRAINT "FK_d4ccf77b40c5697b7f136170f47" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios" ADD CONSTRAINT "FK_c30e8d64c125cf3a1ece50126a2" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_checklist" ADD CONSTRAINT "FK_b49a1c5f0d6b6816fb7f53dba14" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_checklist" ADD CONSTRAINT "FK_658ca7dba1fd484b1f70607e71d" FOREIGN KEY ("concluido_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklists" ADD CONSTRAINT "FK_0c4c36caf8f0abd154e593cf22d" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos" ADD CONSTRAINT "FK_7f2ca515a3bbfa46eac7ead198a" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos" ADD CONSTRAINT "FK_1ed88f32d5c33ad81740fc35490" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_tarefas" ADD CONSTRAINT "FK_4e178ffeb5373a9176e5a50cc95" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_tarefas" ADD CONSTRAINT "FK_7128414e74109ef8339d65aa88d" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" ADD CONSTRAINT "FK_fa270c973649c58c1d561145050" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" ADD CONSTRAINT "FK_9234be58f5b6d6d9ad55ceb036b" FOREIGN KEY ("coluna_id") REFERENCES "colunas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" ADD CONSTRAINT "FK_7b5f8bbda19b2ef0cb37d013a3d" FOREIGN KEY ("criador_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" ADD CONSTRAINT "FK_a1dea9cc06ee0b625201bc6c71a" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD CONSTRAINT "FK_22f094b11205fc0a5fd1806db89" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD CONSTRAINT "FK_5953b78a5f8eac818837a842008" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP CONSTRAINT "FK_5953b78a5f8eac818837a842008"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP CONSTRAINT "FK_22f094b11205fc0a5fd1806db89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" DROP CONSTRAINT "FK_a1dea9cc06ee0b625201bc6c71a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" DROP CONSTRAINT "FK_7b5f8bbda19b2ef0cb37d013a3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" DROP CONSTRAINT "FK_9234be58f5b6d6d9ad55ceb036b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefas" DROP CONSTRAINT "FK_fa270c973649c58c1d561145050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_tarefas" DROP CONSTRAINT "FK_7128414e74109ef8339d65aa88d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_tarefas" DROP CONSTRAINT "FK_4e178ffeb5373a9176e5a50cc95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos" DROP CONSTRAINT "FK_1ed88f32d5c33ad81740fc35490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "anexos" DROP CONSTRAINT "FK_7f2ca515a3bbfa46eac7ead198a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklists" DROP CONSTRAINT "FK_0c4c36caf8f0abd154e593cf22d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_checklist" DROP CONSTRAINT "FK_658ca7dba1fd484b1f70607e71d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_checklist" DROP CONSTRAINT "FK_b49a1c5f0d6b6816fb7f53dba14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios" DROP CONSTRAINT "FK_c30e8d64c125cf3a1ece50126a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentarios" DROP CONSTRAINT "FK_d4ccf77b40c5697b7f136170f47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projetos" DROP CONSTRAINT "FK_9dd48438e8e95939b63880efae2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membros_projeto" DROP CONSTRAINT "FK_9655da2f96b65913b0666cd81d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membros_projeto" DROP CONSTRAINT "FK_e6965151e12e96cb0318a506c31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "colunas" DROP CONSTRAINT "FK_dc1c91ba3046abf8aa44be533bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "FK_933f1f766daaa16d3848d186a59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" DROP CONSTRAINT "FK_21b7d36a2eed9a8d26ebb80f51e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f854addb916eae485509b5f97"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_900d44fa1a3c1812c0d439a90e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73e021d4d498eda6f6a8ea6750"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94b0719f893403890a79cfb30b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70c402d367e5bd15d2cdbcf36c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_22f094b11205fc0a5fd1806db8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "urgente" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "data_devolucao_setor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "data_devolucao_setor" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "data_desarquivamento_sag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "data_desarquivamento_sag" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "data_solicitacao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "data_solicitacao" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "tipo_documento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "tipo_documento" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "numero_processo" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."status_desarquivamento_enum_old" AS ENUM('FINALIZADO', 'DESARQUIVADO', 'NAO_COLETADO', 'SOLICITADO', 'REARQUIVAMENTO_SOLICITADO', 'RETIRADO_PELO_SETOR', 'NAO_LOCALIZADO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" TYPE "public"."status_desarquivamento_enum_old" USING "status"::"text"::"public"."status_desarquivamento_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ALTER COLUMN "status" SET DEFAULT 'SOLICITADO'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."desarquivamentos_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."status_desarquivamento_enum_old" RENAME TO "status_desarquivamento_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "settings" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "settings" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "token_reset_expira"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "token_reset_expira" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "bloqueado_ate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "bloqueado_ate" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "ultimo_login"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "ultimo_login" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "role_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "UQ_0790a401b9d234fa921e9aa1777"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "usuario"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "usuario" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "UQ_0790a401b9d234fa921e9aa1777" UNIQUE ("usuario")`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "timestamp"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "response"`);
    await queryRunner.query(`ALTER TABLE "auditorias" ADD "response" jsonb`);
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "details"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "details" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "entity_id"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "entity_id" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "action"`);
    await queryRunner.query(
      `CREATE TYPE "public"."audit_action_enum" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ARCHIVE', 'UNARCHIVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "action" "public"."audit_action_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" DROP CONSTRAINT "PK_b84b3505f313ab1a44e7b684ee2"`,
    );
    await queryRunner.query(`ALTER TABLE "auditorias" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "permissions"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "permissions" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "settings" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "settings" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "name" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "roles_name_key" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" DROP COLUMN "desarquivamento_fisico_digital"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."desarquivamentos_desarquivamento_fisico_digital_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tipo_desarquivamento_enum" AS ENUM('LAUDO_AUTO', 'PROCESSO_JUDICIAL', 'DOCUMENTO_ADMINISTRATIVO', 'OUTROS', 'FISICO', 'DIGITAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD "tipo_desarquivamento" "public"."tipo_desarquivamento_enum" NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "registros"`);
    await queryRunner.query(`DROP TABLE "tarefas"`);
    await queryRunner.query(`DROP TYPE "public"."tarefas_prioridade_enum"`);
    await queryRunner.query(`DROP TABLE "historico_tarefas"`);
    await queryRunner.query(`DROP TYPE "public"."historico_tarefas_acao_enum"`);
    await queryRunner.query(`DROP TABLE "anexos"`);
    await queryRunner.query(`DROP TABLE "checklists"`);
    await queryRunner.query(`DROP TABLE "itens_checklist"`);
    await queryRunner.query(`DROP TABLE "comentarios"`);
    await queryRunner.query(`DROP TABLE "projetos"`);
    await queryRunner.query(`DROP TABLE "membros_projeto"`);
    await queryRunner.query(`DROP TYPE "public"."membros_projeto_papel_enum"`);
    await queryRunner.query(`DROP TABLE "colunas"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_NUMERO_PROCESSO" ON "desarquivamentos" ("numero_processo") WHERE (numero_processo IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_URGENTE_PENDENTE" ON "desarquivamentos" ("status", "urgente") WHERE ((urgente = true) AND (status = 'SOLICITADO'::status_desarquivamento_enum))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_NOT_DELETED" ON "desarquivamentos" ("status") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_STATUS_DATA" ON "desarquivamentos" ("status", "data_solicitacao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_STATUS" ON "desarquivamentos" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_SETOR" ON "desarquivamentos" ("setor_demandante") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_URGENTE" ON "desarquivamentos" ("urgente") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_RESPONSAVEL" ON "desarquivamentos" ("responsavel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_DELETED_AT" ON "desarquivamentos" ("deleted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_CREATED_BY" ON "desarquivamentos" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_DATA_SOLICITACAO" ON "desarquivamentos" ("data_solicitacao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_TIPO" ON "desarquivamentos" ("tipo_desarquivamento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_DESARQUIVAMENTOS_NUMERO_NIC" ON "desarquivamentos" ("numero_nic_laudo_auto") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_SETTINGS" ON "usuarios" ("settings") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_ATIVO_NOT_DELETED" ON "usuarios" ("ativo") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_ROLE_ATIVO" ON "usuarios" ("role_id", "ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_TOKEN_RESET" ON "usuarios" ("token_reset") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_DELETED_AT" ON "usuarios" ("deleted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_ROLE_ID" ON "usuarios" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_ATIVO" ON "usuarios" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USUARIOS_USUARIO" ON "usuarios" ("usuario") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_ENTITY_ACTION" ON "auditorias" ("action", "entity_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_USER_TIMESTAMP" ON "auditorias" ("user_id", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_IP_ADDRESS" ON "auditorias" ("ip_address") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_SUCCESS" ON "auditorias" ("success") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_TIMESTAMP" ON "auditorias" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_ENTITY" ON "auditorias" ("entity_name", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_ACTION" ON "auditorias" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_AUDITORIAS_USER_ID" ON "auditorias" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ROLES_SETTINGS" ON "roles" ("settings") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ROLES_ATIVO" ON "roles" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ROLES_NAME" ON "roles" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD CONSTRAINT "FK_5953b78a5f8eac818837a842008" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "desarquivamentos" ADD CONSTRAINT "FK_22f094b11205fc0a5fd1806db89" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "FK_933f1f766daaa16d3848d186a59" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "auditorias" ADD CONSTRAINT "FK_AUDITORIAS_USER_ID" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}
