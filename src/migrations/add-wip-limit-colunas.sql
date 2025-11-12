-- Adicionar coluna wip_limit na tabela colunas
ALTER TABLE colunas ADD COLUMN IF NOT EXISTS wip_limit INTEGER NULL;

-- Criar índice para otimização
CREATE INDEX IF NOT EXISTS idx_colunas_wip_limit ON colunas(wip_limit) WHERE wip_limit IS NOT NULL;

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'colunas'
ORDER BY ordinal_position;
