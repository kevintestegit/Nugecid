-- Adicionar coluna wip_limit na tabela colunas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colunas' AND column_name = 'wip_limit'
    ) THEN
        ALTER TABLE colunas ADD COLUMN wip_limit INTEGER;
        RAISE NOTICE 'Coluna wip_limit adicionada';
    ELSE
        RAISE NOTICE 'Coluna wip_limit já existe';
    END IF;
END $$;

-- Verificar estrutura da tabela colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'colunas'
ORDER BY ordinal_position;
