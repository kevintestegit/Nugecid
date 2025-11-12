-- Migration: Adicionar WIP Limit nas colunas
-- Data: 2025-01-20

-- Adicionar coluna wip_limit
ALTER TABLE colunas 
ADD COLUMN IF NOT EXISTS wip_limit INTEGER;

-- Adicionar comentário
COMMENT ON COLUMN colunas.wip_limit IS 'Limite de Work In Progress (WIP) para a coluna';

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'colunas'
ORDER BY ordinal_position;
