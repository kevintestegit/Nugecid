import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { kanbanService } from '../services/kanbanService';
import { Projeto, Coluna, Tarefa } from '../components/kanban';

interface UseKanbanProps {
  projetoId: number;
}

interface UseKanbanReturn {
  projeto: Projeto | null;
  colunas: Coluna[];
  tarefas: Tarefa[];
  loading: boolean;
  error: string | null;
  
  // Projeto
  updateProjeto: (data: Partial<Projeto>) => Promise<void>;
  
  // Colunas
  createColuna: (data: Omit<Coluna, 'id' | 'projeto_id' | 'ordem'>) => Promise<void>;
  updateColuna: (id: number, data: Partial<Coluna>) => Promise<void>;
  deleteColuna: (id: number) => Promise<void>;
  moveColuna: (colunaId: number, newOrder: number) => Promise<void>;
  
  // Tarefas
  createTarefa: (data: Omit<Tarefa, 'id' | 'ordem'>) => Promise<void>;
  updateTarefa: (id: number, data: Partial<Tarefa>) => Promise<void>;
  deleteTarefa: (id: number) => Promise<void>;
  moveTarefa: (tarefaId: number, sourceColunaId: number, targetColunaId: number, newOrder: number) => Promise<void>;
  reorderTarefas: (colunaId: number, tarefaIds: number[]) => Promise<void>;
  
  // Utilitários
  refresh: () => Promise<void>;
}

export const useKanban = ({ projetoId }: UseKanbanProps): UseKanbanReturn => {
  const { user, isAuthenticated } = useAuth();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [colunas, setColunas] = useState<Coluna[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeTarefa = useCallback((t: any): Tarefa => {
    return {
      ...t,
      coluna_id: t.coluna_id ?? t.colunaId,
      colunaId: t.colunaId ?? t.coluna_id,
      responsavelId: t.responsavelId ?? t.responsavel_id,
      criadorId: t.criadorId ?? t.criador_id,
    } as Tarefa;
  }, []);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projetoData, colunasData, tarefasData] = await Promise.all([
        kanbanService.getProjeto(projetoId),
        kanbanService.getColunas(projetoId),
        kanbanService.getTarefas(projetoId),
      ]);

      setProjeto(projetoData);
      setColunas(Array.isArray(colunasData) ? colunasData : []);
      const tarefasArray = Array.isArray(tarefasData) ? tarefasData : [];
      setTarefas(tarefasArray.map(normalizeTarefa));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Projeto
  const updateProjeto = useCallback(async (data: Partial<Projeto>) => {
    try {
      const updatedProjeto = await kanbanService.updateProjeto(projetoId, data);
      setProjeto(updatedProjeto);
      toast.success('Projeto atualizado com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
      toast.error(message);
      throw err;
    }
  }, [projetoId]);

  // Colunas
  const createColuna = useCallback(async (data: Omit<Coluna, 'id' | 'projeto_id' | 'ordem'>) => {
    try {
      const newColuna = await kanbanService.createColuna({
        ...data,
        projeto_id: projetoId,
        ordem: colunas.length,
      });
      setColunas(prev => [...prev, newColuna]);
      toast.success('Coluna criada com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar coluna';
      toast.error(message);
      throw err;
    }
  }, [projetoId, colunas.length]);

  const updateColuna = useCallback(async (id: number, data: Partial<Coluna>) => {
    try {
      const updatedColuna = await kanbanService.updateColuna(id, data);
      setColunas(prev => prev.map(col => col.id === id ? updatedColuna : col));
      toast.success('Coluna atualizada com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar coluna';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteColuna = useCallback(async (id: number) => {
    try {
      await kanbanService.deleteColuna(id);
      setColunas(prev => prev.filter(col => col.id !== id));
      setTarefas(prev => prev.filter(tarefa => tarefa.coluna_id !== id));
      toast.success('Coluna excluída com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir coluna';
      toast.error(message);
      throw err;
    }
  }, []);

  const moveColuna = useCallback(async (colunaId: number, newOrder: number) => {
    try {
      await kanbanService.moveColuna(colunaId, newOrder);
      // Reordenar localmente
      setColunas(prev => {
        const updated = [...prev];
        const colunaIndex = updated.findIndex(col => col.id === colunaId);
        if (colunaIndex !== -1) {
          const [coluna] = updated.splice(colunaIndex, 1);
          updated.splice(newOrder, 0, { ...coluna, ordem: newOrder });
          return updated.map((col, index) => ({ ...col, ordem: index }));
        }
        return updated;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao mover coluna';
      toast.error(message);
      throw err;
    }
  }, []);

  // Tarefas
  const createTarefa = useCallback(async (data: Omit<Tarefa, 'id' | 'ordem'>) => {
    if (!isAuthenticated || !user) {
      toast.error('Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    try {
      const tarefasNaColuna = tarefas.filter(t => t.coluna_id === data.coluna_id);
      const newTarefa = await kanbanService.createTarefa({
        ...data,
        ordem: tarefasNaColuna.length,
        criado_por_id: user.id,
      });
      setTarefas(prev => [...prev, normalizeTarefa(newTarefa)]);
      toast.success('Tarefa criada com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      toast.error(message);
      throw err;
    }
  }, [tarefas, isAuthenticated, user]);

  const updateTarefa = useCallback(async (id: number, data: Partial<Tarefa>) => {
    if (!isAuthenticated || !user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    // Verificar se o usuário tem permissão para atualizar tarefas
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa && user.role?.name === 'usuario' && tarefa.criado_por_id !== user.id) {
      toast.error('Você só pode atualizar suas próprias tarefas');
      return;
    }

    try {
      const updatedTarefa = await kanbanService.updateTarefa(id, data);
      setTarefas(prev => prev.map(tarefa => tarefa.id === id ? normalizeTarefa(updatedTarefa) : tarefa));
      toast.success('Tarefa atualizada com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      toast.error(message);
      throw err;
    }
  }, [isAuthenticated, user, tarefas]);

  const deleteTarefa = useCallback(async (id: number) => {
    if (!isAuthenticated || !user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return;
    }

    // Verificar se o usuário tem permissão para excluir tarefas
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa && user.role?.name === 'usuario' && tarefa.criado_por_id !== user.id) {
      toast.error('Você só pode excluir suas próprias tarefas');
      return;
    }

    try {
      await kanbanService.deleteTarefa(id);
      setTarefas(prev => prev.filter(tarefa => tarefa.id !== id));
      toast.success('Tarefa excluída com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      toast.error(message);
      throw err;
    }
  }, [isAuthenticated, user, tarefas]);

  const moveTarefa = useCallback(async (
    tarefaId: number,
    sourceColunaId: number,
    targetColunaId: number,
    newOrder: number
  ) => {
    try {
      await kanbanService.moveTarefa(tarefaId, targetColunaId, newOrder);
      
      // Atualizar estado local
      setTarefas(prev => {
        const updated = prev.map(tarefa => {
          if (tarefa.id === tarefaId) {
            return { ...tarefa, coluna_id: targetColunaId, ordem: newOrder };
          }
          return tarefa;
        });
        
        // Reordenar tarefas na coluna de destino
        const targetTasks = updated
          .filter(t => t.coluna_id === targetColunaId)
          .sort((a, b) => a.ordem - b.ordem);
        
        return updated.map(tarefa => {
          if (tarefa.coluna_id === targetColunaId) {
            const index = targetTasks.findIndex(t => t.id === tarefa.id);
            return { ...tarefa, ordem: index };
          }
          return tarefa;
        });
      });
      
      toast.success('Tarefa movida com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao mover tarefa';
      toast.error(message);
      // Recarregar dados em caso de erro
      await loadData();
      throw err;
    }
  }, [loadData]);

  const reorderTarefas = useCallback(async (colunaId: number, tarefaIds: number[]) => {
    try {
      await kanbanService.reorderTarefas(colunaId, tarefaIds);
      
      // Atualizar ordem local
      setTarefas(prev => prev.map(tarefa => {
        if (tarefa.coluna_id === colunaId) {
          const newOrder = tarefaIds.indexOf(tarefa.id);
          return { ...tarefa, ordem: newOrder };
        }
        return tarefa;
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reordenar tarefas';
      toast.error(message);
      // Recarregar dados em caso de erro
      await loadData();
      throw err;
    }
  }, [loadData]);

  const updateTarefaStatus = useCallback(async (tarefaId: number, novoStatus: string) => {
    if (!isAuthenticated || !user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    // Verificar se o usuário tem permissão para atualizar tarefas
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (tarefa && user.role?.name === 'usuario' && tarefa.criado_por_id !== user.id) {
      toast.error('Você só pode atualizar suas próprias tarefas');
      return;
    }

    try {
      const tarefaAtualizada = await kanbanService.updateTarefa(tarefaId, { status: novoStatus });
      
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === tarefaId ? tarefaAtualizada : tarefa
      ));
      
      toast.success('Status da tarefa atualizado!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao atualizar status da tarefa';
      toast.error(message);
    }
  }, [isAuthenticated, user, tarefas]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    projeto,
    colunas,
    tarefas,
    loading,
    error,
    updateProjeto,
    createColuna,
    updateColuna,
    deleteColuna,
    moveColuna,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    moveTarefa,
    reorderTarefas,
    updateTarefaStatus,
    refresh,
  };
};
