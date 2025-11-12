-- Script SQL para adicionar colunas faltantes na tabela notificacoes
-- Execute este script diretamente no PostgreSQL

-- 1. Adicionar colunas faltantes
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS tarefa_id INTEGER,
ADD COLUMN IF NOT EXISTS projeto_id INTEGER,
ADD COLUMN IF NOT EXISTS remetente_id INTEGER,
ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. Adicionar foreign key para tarefa_id
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

-- 3. Adicionar foreign key para remetente_id
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

-- 4. Atualizar enum de tipos de notificação
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'mencao' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'mencao';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tarefa_atribuida' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'tarefa_atribuida';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tarefa_alterada' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'tarefa_alterada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tarefa_comentada' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'tarefa_comentada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'prazo_proximo' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'prazo_proximo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tarefa_atrasada' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'tarefa_atrasada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'projeto_atualizado' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificacao_tipo_enum')
  ) THEN
    ALTER TYPE notificacao_tipo_enum ADD VALUE 'projeto_atualizado';
  END IF;
END $$;

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_notificacoes_tarefa ON notificacoes(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_projeto ON notificacoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_remetente ON notificacoes(remetente_id);

-- 6. Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notificacoes' 
ORDER BY ordinal_position;
