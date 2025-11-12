-- Migração para criar a tabela de notificações
-- Data: 2024-01-20
-- Descrição: Criação da tabela para gerenciar notificações do sistema

-- Tabela de notificações
CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    detalhes JSONB,
    lida BOOLEAN DEFAULT false,
    prioridade VARCHAR(10) DEFAULT 'media',
    usuario_id INTEGER NOT NULL,
    solicitacao_id INTEGER,
    processo_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitacao_id) REFERENCES tarefas(id) ON DELETE CASCADE,
    CHECK (tipo IN ('solicitacao_pendente', 'novo_processo')),
    CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica'))
);

-- Índices para performance
CREATE INDEX idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);
CREATE INDEX idx_notificacoes_tipo_created ON notificacoes(tipo, created_at);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_prioridade ON notificacoes(prioridade);
CREATE INDEX idx_notificacoes_solicitacao ON notificacoes(solicitacao_id) WHERE solicitacao_id IS NOT NULL;
CREATE INDEX idx_notificacoes_processo ON notificacoes(processo_id) WHERE processo_id IS NOT NULL;
CREATE INDEX idx_notificacoes_created_at ON notificacoes(created_at);
CREATE INDEX idx_notificacoes_deleted_at ON notificacoes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índice composto para consultas frequentes
CREATE INDEX idx_notificacoes_usuario_tipo_lida ON notificacoes(usuario_id, tipo, lida);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_notificacoes_updated_at BEFORE UPDATE ON notificacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar notificação de solicitação pendente
CREATE OR REPLACE FUNCTION criar_notificacao_solicitacao_pendente(
    p_usuario_id INTEGER,
    p_solicitacao_id INTEGER,
    p_dias_pendentes INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_titulo VARCHAR(255);
    v_descricao TEXT;
    v_detalhes JSONB;
    v_notificacao_id INTEGER;
BEGIN
    -- Montar título e descrição
    v_titulo := 'Solicitação Pendente há ' || p_dias_pendentes || ' dias';
    v_descricao := 'Uma solicitação está pendente há mais de 5 dias sem movimentação.';
    
    -- Montar detalhes em JSON
    v_detalhes := json_build_object(
        'dias_pendentes', p_dias_pendentes,
        'data_limite', CURRENT_DATE + INTERVAL '2 days',
        'acao_requerida', 'Verificar status da solicitação'
    );
    
    -- Inserir notificação
    INSERT INTO notificacoes (
        tipo, titulo, descricao, detalhes, usuario_id, solicitacao_id, prioridade
    ) VALUES (
        'solicitacao_pendente', v_titulo, v_descricao, v_detalhes, p_usuario_id, p_solicitacao_id, 'alta'
    ) RETURNING id INTO v_notificacao_id;
    
    RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação de novo processo SEIRN
CREATE OR REPLACE FUNCTION criar_notificacao_novo_processo(
    p_usuario_id INTEGER,
    p_processo_id INTEGER,
    p_numero_processo VARCHAR(50)
)
RETURNS INTEGER AS $$
DECLARE
    v_titulo VARCHAR(255);
    v_descricao TEXT;
    v_detalhes JSONB;
    v_notificacao_id INTEGER;
BEGIN
    -- Montar título e descrição
    v_titulo := 'Novo Processo de Desarquivamento';
    v_descricao := 'Um novo processo de desarquivamento foi extraído do SEIRN: ' || p_numero_processo;
    
    -- Montar detalhes em JSON
    v_detalhes := json_build_object(
        'numero_processo', p_numero_processo,
        'fonte', 'SEIRN',
        'data_extracao', CURRENT_TIMESTAMP,
        'acao_requerida', 'Analisar novo processo'
    );
    
    -- Inserir notificação
    INSERT INTO notificacoes (
        tipo, titulo, descricao, detalhes, usuario_id, processo_id, prioridade
    ) VALUES (
        'novo_processo', v_titulo, v_descricao, v_detalhes, p_usuario_id, p_processo_id, 'media'
    ) RETURNING id INTO v_notificacao_id;
    
    RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION marcar_notificacao_lida(p_notificacao_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notificacoes 
    SET lida = true, updated_at = CURRENT_TIMESTAMP 
    WHERE id = p_notificacao_id AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar múltiplas notificações como lidas
CREATE OR REPLACE FUNCTION marcar_notificacoes_lidas_usuario(p_usuario_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notificacoes 
    SET lida = true, updated_at = CURRENT_TIMESTAMP 
    WHERE usuario_id = p_usuario_id AND lida = false AND deleted_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar notificações não lidas por usuário
CREATE OR REPLACE FUNCTION buscar_notificacoes_nao_lidas(p_usuario_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    tipo VARCHAR(50),
    titulo VARCHAR(255),
    descricao TEXT,
    detalhes JSONB,
    prioridade VARCHAR(10),
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.tipo, n.titulo, n.descricao, n.detalhes, n.prioridade, n.created_at
    FROM notificacoes n
    WHERE n.usuario_id = p_usuario_id 
      AND n.lida = false 
      AND n.deleted_at IS NULL
    ORDER BY 
        CASE n.prioridade 
            WHEN 'critica' THEN 1
            WHEN 'alta' THEN 2
            WHEN 'media' THEN 3
            WHEN 'baixa' THEN 4
        END,
        n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- View para estatísticas de notificações
CREATE VIEW vw_estatisticas_notificacoes AS
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    COUNT(*) as total_notificacoes,
    COUNT(CASE WHEN n.lida = false THEN 1 END) as nao_lidas,
    COUNT(CASE WHEN n.lida = true THEN 1 END) as lidas,
    COUNT(CASE WHEN n.tipo = 'solicitacao_pendente' THEN 1 END) as solicitacoes_pendentes,
    COUNT(CASE WHEN n.tipo = 'novo_processo' THEN 1 END) as novos_processos,
    COUNT(CASE WHEN n.prioridade = 'critica' THEN 1 END) as criticas,
    COUNT(CASE WHEN n.prioridade = 'alta' THEN 1 END) as altas
FROM usuarios u
LEFT JOIN notificacoes n ON u.id = n.usuario_id AND n.deleted_at IS NULL
GROUP BY u.id, u.nome;

-- Comentários para documentação
COMMENT ON TABLE notificacoes IS 'Tabela para gerenciar notificações do sistema';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo da notificação: solicitacao_pendente ou novo_processo';
COMMENT ON COLUMN notificacoes.detalhes IS 'Dados específicos em JSON como dias pendentes, número do processo, etc.';
COMMENT ON COLUMN notificacoes.solicitacao_id IS 'ID da solicitação relacionada (opcional)';
COMMENT ON COLUMN notificacoes.processo_id IS 'ID do processo relacionado (opcional)';
COMMENT ON COLUMN notificacoes.prioridade IS 'Prioridade da notificação: baixa, media, alta, critica';

-- Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO notificacoes (tipo, titulo, descricao, detalhes, usuario_id, prioridade) VALUES
-- ('solicitacao_pendente', 'Solicitação Pendente há 7 dias', 'Uma solicitação está pendente há mais de 5 dias.', '{"dias_pendentes": 7}', 1, 'alta'),
-- ('novo_processo', 'Novo Processo SEIRN', 'Novo processo de desarquivamento extraído.', '{"numero_processo": "2024.001"}', 1, 'media');