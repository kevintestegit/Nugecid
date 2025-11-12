-- Migration: Criar tabela historico_tarefas para auditoria
-- Data: 2024
-- Descrição: Tabela para armazenar histórico de alterações das tarefas

CREATE TABLE IF NOT EXISTS historico_tarefas (
    id SERIAL PRIMARY KEY,
    tarefa_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    acao VARCHAR(50) NOT NULL, -- 'CRIADA', 'ATUALIZADA', 'MOVIDA', 'EXCLUIDA', 'STATUS_ALTERADO', 'PRIORIDADE_ALTERADA'
    campo_alterado VARCHAR(100), -- campo que foi alterado (opcional)
    valor_anterior TEXT, -- valor anterior do campo (opcional)
    valor_novo TEXT, -- novo valor do campo (opcional)
    observacoes TEXT, -- observações adicionais sobre a alteração
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_historico_tarefa FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_historico_tarefas_tarefa_id ON historico_tarefas(tarefa_id);
CREATE INDEX idx_historico_tarefas_usuario_id ON historico_tarefas(usuario_id);
CREATE INDEX idx_historico_tarefas_data_alteracao ON historico_tarefas(data_alteracao);
CREATE INDEX idx_historico_tarefas_acao ON historico_tarefas(acao);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_historico_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_historico_tarefas_updated_at
    BEFORE UPDATE ON historico_tarefas
    FOR EACH ROW
    EXECUTE FUNCTION update_historico_tarefas_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE historico_tarefas IS 'Tabela para armazenar histórico de alterações das tarefas';
COMMENT ON COLUMN historico_tarefas.tarefa_id IS 'ID da tarefa que foi alterada';
COMMENT ON COLUMN historico_tarefas.usuario_id IS 'ID do usuário que fez a alteração';
COMMENT ON COLUMN historico_tarefas.acao IS 'Tipo de ação realizada na tarefa';
COMMENT ON COLUMN historico_tarefas.campo_alterado IS 'Nome do campo que foi alterado';
COMMENT ON COLUMN historico_tarefas.valor_anterior IS 'Valor anterior do campo alterado';
COMMENT ON COLUMN historico_tarefas.valor_novo IS 'Novo valor do campo alterado';
COMMENT ON COLUMN historico_tarefas.observacoes IS 'Observações adicionais sobre a alteração';
COMMENT ON COLUMN historico_tarefas.data_alteracao IS 'Data e hora da alteração';