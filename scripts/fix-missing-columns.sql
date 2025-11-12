-- Script para adicionar colunas faltantes no banco de dados
-- Autor: Claude
-- Data: 2025-10-31

-- =============================================
-- 1. CORRIGIR TABELA TAREFAS
-- =============================================

-- Adicionar colunas data_criacao e data_atualizacao
-- (aliases para created_at e updated_at)
ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT NOW();

ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT NOW();

-- Copiar valores existentes de created_at e updated_at
UPDATE tarefas
SET data_criacao = created_at,
    data_atualizacao = updated_at
WHERE data_criacao IS NULL OR data_atualizacao IS NULL;

-- Criar triggers para manter as colunas sincronizadas
CREATE OR REPLACE FUNCTION sync_tarefas_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_criacao = NEW.created_at;
  NEW.data_atualizacao = NEW.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tarefas_sync_timestamps ON tarefas;
CREATE TRIGGER tarefas_sync_timestamps
  BEFORE INSERT OR UPDATE ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION sync_tarefas_timestamps();

-- =============================================
-- 2. CORRIGIR TABELA DESARQUIVAMENTOS
-- =============================================

-- Adicionar coluna tipo_desarquivamento
-- (será um alias/cópia de desarquivamento_fisico_digital)
ALTER TABLE desarquivamentos
  ADD COLUMN IF NOT EXISTS tipo_desarquivamento VARCHAR(50);

-- Copiar valores de desarquivamento_fisico_digital para tipo_desarquivamento
UPDATE desarquivamentos
SET tipo_desarquivamento = desarquivamento_fisico_digital::text
WHERE tipo_desarquivamento IS NULL;

-- Definir valor padrão para novos registros
ALTER TABLE desarquivamentos
  ALTER COLUMN tipo_desarquivamento SET DEFAULT 'FISICO';

-- Criar trigger para manter sincronizado
CREATE OR REPLACE FUNCTION sync_desarquivamento_tipo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.desarquivamento_fisico_digital IS NOT NULL THEN
    NEW.tipo_desarquivamento = NEW.desarquivamento_fisico_digital::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS desarquivamentos_sync_tipo ON desarquivamentos;
CREATE TRIGGER desarquivamentos_sync_tipo
  BEFORE INSERT OR UPDATE ON desarquivamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_desarquivamento_tipo();

-- =============================================
-- 3. VERIFICAÇÃO
-- =============================================

-- Verificar se as colunas foram criadas
SELECT
  'tarefas' AS tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tarefas'
  AND column_name IN ('data_criacao', 'data_atualizacao')
UNION ALL
SELECT
  'desarquivamentos' AS tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'desarquivamentos'
  AND column_name = 'tipo_desarquivamento';

-- Verificar contagem de registros
SELECT
  'tarefas' AS tabela,
  COUNT(*) AS total,
  COUNT(data_criacao) AS com_data_criacao,
  COUNT(data_atualizacao) AS com_data_atualizacao
FROM tarefas
UNION ALL
SELECT
  'desarquivamentos' AS tabela,
  COUNT(*) AS total,
  COUNT(tipo_desarquivamento) AS com_tipo,
  0
FROM desarquivamentos;
