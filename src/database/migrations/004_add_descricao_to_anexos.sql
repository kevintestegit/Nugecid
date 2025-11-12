-- Migration: Adicionar coluna descricao na tabela desarquivamento_anexos
-- Data: 2025-01-20
-- Descrição: Permite adicionar título/descrição aos anexos de desarquivamentos

-- Adicionar coluna descricao
ALTER TABLE desarquivamento_anexos 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Comentário explicativo
COMMENT ON COLUMN desarquivamento_anexos.descricao IS 'Título ou descrição do anexo para melhor identificação';
