-- Migration: Adicionar novos campos e tipos de notificações
-- Data: 2025-01-20

-- 1. Adicionar novos valores ao enum tipo
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'mencao';
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_atribuida';
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_alterada';
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_comentada';
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'prazo_proximo';
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'tarefa_atrasada';
ALTER TYPE "notificacoes_tipo_enum" ADD VALUE IF NOT EXISTS 'projeto_atualizado';

-- 2. Adicionar nova coluna tarefa_id
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS tarefa_id INTEGER;

-- 3. Adicionar nova coluna projeto_id
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS projeto_id INTEGER;

-- 4. Adicionar nova coluna remetente_id
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS remetente_id INTEGER;

-- 5. Adicionar nova coluna link
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS link TEXT;

-- 6. Criar foreign key para tarefa_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_notificacoes_tarefa'
    ) THEN
        ALTER TABLE notificacoes
        ADD CONSTRAINT fk_notificacoes_tarefa
        FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Criar foreign key para remetente_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_notificacoes_remetente'
    ) THEN
        ALTER TABLE notificacoes
        ADD CONSTRAINT fk_notificacoes_remetente
        FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_tarefa_id ON notificacoes(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_projeto_id ON notificacoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_remetente_id ON notificacoes(remetente_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_lida ON notificacoes(tipo, lida);

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notificacoes'
ORDER BY ordinal_position;
