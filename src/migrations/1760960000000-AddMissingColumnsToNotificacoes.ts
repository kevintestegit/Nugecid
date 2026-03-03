import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToNotificacoes1760960000000
  implements MigrationInterface
{
  name = "AddMissingColumnsToNotificacoes1760960000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novas colunas de relacionamentos
    await queryRunner.query(`
      ALTER TABLE notificacoes 
      ADD COLUMN IF NOT EXISTS tarefa_id INTEGER,
      ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
      ADD COLUMN IF NOT EXISTS remetente_id INTEGER,
      ADD COLUMN IF NOT EXISTS link TEXT;
    `);

    // Adicionar foreign key para tarefa_id
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'fk_notificacoes_tarefa'
        ) THEN
          ALTER TABLE notificacoes 
          ADD CONSTRAINT fk_notificacoes_tarefa 
          FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Adicionar foreign key para remetente_id
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'fk_notificacoes_remetente'
        ) THEN
          ALTER TABLE notificacoes 
          ADD CONSTRAINT fk_notificacoes_remetente 
          FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Atualizar enum de tipos de notificação para incluir novos tipos
    await queryRunner.query(`
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'mencao';
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'tarefa_atribuida';
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'tarefa_alterada';
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'tarefa_comentada';
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'prazo_proximo';
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'tarefa_atrasada';
      ALTER TYPE notificacao_tipo_enum ADD VALUE IF NOT EXISTS 'projeto_atualizado';
    `);

    // Criar índice para tarefa_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_tarefa 
      ON notificacoes(tarefa_id);
    `);

    // Criar índice para projeto_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_projeto 
      ON notificacoes(projeto_id);
    `);

    // Criar índice para remetente_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_remetente 
      ON notificacoes(remetente_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notificacoes_tarefa;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notificacoes_projeto;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notificacoes_remetente;`);

    // Remover foreign keys
    await queryRunner.query(
      `ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS fk_notificacoes_tarefa;`,
    );
    await queryRunner.query(
      `ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS fk_notificacoes_remetente;`,
    );

    // Remover colunas
    await queryRunner.query(`
      ALTER TABLE notificacoes 
      DROP COLUMN IF EXISTS tarefa_id,
      DROP COLUMN IF EXISTS projeto_id,
      DROP COLUMN IF EXISTS remetente_id,
      DROP COLUMN IF EXISTS link;
    `);

    // Nota: Não podemos remover valores de enum facilmente no PostgreSQL
    // Seria necessário recriar o enum, o que é complexo e pode quebrar dados existentes
  }
}
