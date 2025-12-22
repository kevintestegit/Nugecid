import { api } from './api';
import { Projeto, Coluna, Tarefa, Checklist, ItemChecklist } from '../types/kanban.types';

type ApiEnvelope<T> = { data: T; success?: boolean };

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

const unwrapArrayData = <T>(payload: unknown): T[] => {
  const data = unwrapData<unknown>(payload);
  return Array.isArray(data) ? (data as T[]) : [];
};

// Interfaces para DTOs
interface CreateProjetoDto {
  nome: string;
  descricao?: string;
  cor?: string;
}

interface UpdateProjetoDto {
  nome?: string;
  descricao?: string;
  cor?: string;
  ativo?: boolean;
}

interface CreateColunaDto {
  nome: string;
  cor?: string;
  wipLimit?: number;
  projetoId: number;
  ordem: number;
}

interface UpdateColunaDto {
  nome?: string;
  cor?: string;
  wipLimit?: number;
  ordem?: number;
}

interface CreateTarefaDto {
  titulo: string;
  descricao?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  prazo?: string;
  tags?: string[];
  responsavelId?: number;
  responsavelIds?: number[];
  projetoId: number;
  colunaId: number;
  ordem: number;
  parentId?: number;
}

interface UpdateTarefaDto {
  titulo?: string;
  descricao?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  prazo?: string;
  tags?: string[];
  responsavelId?: number;
  responsavelIds?: number[];
  colunaId?: number;
  ordem?: number;
  estado?: string;
}

interface MoveTarefaDto {
  colunaId: number;
  ordem: number;
}

interface ReorderTarefasDto {
  tarefa_ids: number[];
}

interface MoveColumnDto {
  ordem: number;
}

type PapelMembro = 'admin' | 'editor' | 'viewer';

interface ProjetoMembro {
  id: number;
  projetoId?: number;
  usuarioId: number;
  papel: PapelMembro;
  usuario?: {
    id: number;
    nome?: string;
    usuario?: string;
    avatarUrl?: string | null;
  };
}

interface Comentario {
  id: number;
  conteudo: string;
  tarefa_id: number;
  usuario_id: number;
  data_criacao: string;
  data_atualizacao: string;
  usuario: {
    id: number;
    nome: string;
    avatar?: string;
    avatarUrl?: string | null;
  };
}

interface CreateComentarioDto {
  conteudo: string;
  tarefaId: number;
}

interface UpdateComentarioDto {
  conteudo: string;
}

class KanbanService {
  // Projetos
  async getProjetos(): Promise<Projeto[]> {
    const response = await api.get('/projetos');
    return unwrapArrayData<Projeto>(response.data);
  }

  async getProjeto(id: number): Promise<Projeto> {
    const response = await api.get(`/projetos/${id}`);
    return unwrapData<Projeto>(response.data);
  }

  async createProjeto(data: CreateProjetoDto): Promise<Projeto> {
    const response = await api.post('/projetos', data);
    return unwrapData<Projeto>(response.data);
  }

  async updateProjeto(id: number, data: UpdateProjetoDto): Promise<Projeto> {
    const response = await api.patch(`/projetos/${id}`, data);
    return unwrapData<Projeto>(response.data);
  }

  async deleteProjeto(id: number): Promise<void> {
    await api.delete(`/projetos/${id}`);
  }

  async getProjetoStats(id: number): Promise<any> {
    const response = await api.get(`/projetos/${id}/stats`);
    return unwrapData<any>(response.data);
  }

  // Membros do projeto
  async getProjetoMembros(projetoId: number): Promise<ProjetoMembro[]> {
    const response = await api.get(`/projetos/${projetoId}/membros`);
    return unwrapArrayData<ProjetoMembro>(response.data);
  }

  async searchUsuariosParaProjeto(projetoId: number, search?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/projetos/${projetoId}/membros/lookup${qs}`);
    return unwrapArrayData<{ id: number; nome?: string; usuario?: string; avatarUrl?: string | null }>(
      response.data,
    );
  }

  async addProjetoMembro(projetoId: number, data: AddMembroDto): Promise<ProjetoMembro> {
    const response = await api.post(`/projetos/${projetoId}/membros`, data);
    return unwrapData<ProjetoMembro>(response.data);
  }

  async updateProjetoMembro(projetoId: number, membroId: number, data: UpdateMembroDto): Promise<ProjetoMembro> {
    const response = await api.patch(`/projetos/${projetoId}/membros/${membroId}`, data);
    return unwrapData<ProjetoMembro>(response.data);
  }

  async removeProjetoMembro(projetoId: number, membroId: number): Promise<void> {
    await api.delete(`/projetos/${projetoId}/membros/${membroId}`);
  }

  // Colunas
  async getColunas(projetoId: number): Promise<Coluna[]> {
    // Backend expõe GET /colunas?projetoId=...
    const response = await api.get(`/colunas`, {
      params: { projetoId },
    });
    return unwrapArrayData<Coluna>(response.data);
  }

  async getColuna(id: number): Promise<Coluna> {
    const response = await api.get(`/colunas/${id}`);
    return unwrapData<Coluna>(response.data);
  }

  async createColuna(data: CreateColunaDto): Promise<Coluna> {
    const response = await api.post('/colunas', data);
    return unwrapData<Coluna>(response.data);
  }

  async updateColuna(id: number, data: UpdateColunaDto): Promise<Coluna> {
    const response = await api.patch(`/colunas/${id}`, data);
    return unwrapData<Coluna>(response.data);
  }

  async deleteColuna(id: number): Promise<void> {
    await api.delete(`/colunas/${id}`);
  }

  async moveColuna(id: number, ordem: number): Promise<void> {
    await api.patch(`/colunas/${id}/move`, { newOrder: ordem });
  }

  async getColunaStats(id: number): Promise<any> {
    const response = await api.get(`/colunas/${id}/stats`);
    return unwrapData<any>(response.data);
  }

  // Tarefas
  async getTarefas(projetoId?: number, colunaId?: number): Promise<Tarefa[]> {
    let url = '/tarefas';
    const params = new URLSearchParams();
    
    if (projetoId) params.append('projeto_id', projetoId.toString());
    if (colunaId) params.append('coluna_id', colunaId.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return unwrapArrayData<Tarefa>(response.data);
  }

  async getTarefa(id: number): Promise<Tarefa> {
    const response = await api.get(`/tarefas/${id}`);
    return unwrapData<Tarefa>(response.data);
  }

  async createTarefa(data: CreateTarefaDto): Promise<Tarefa> {
    const response = await api.post('/tarefas', data);
    return unwrapData<Tarefa>(response.data);
  }

  async updateTarefa(id: number, data: UpdateTarefaDto): Promise<Tarefa> {
    const response = await api.patch(`/tarefas/${id}`, data);
    return unwrapData<Tarefa>(response.data);
  }

  async deleteTarefa(id: number): Promise<void> {
    await api.delete(`/tarefas/${id}`);
  }

  async moveTarefa(id: number, colunaId: number, ordem: number): Promise<void> {
    await api.patch(`/tarefas/${id}/mover`, { colunaId, ordem });
  }

  async reorderTarefas(colunaId: number, tarefaIds: number[]): Promise<void> {
    await api.patch(`/colunas/${colunaId}/reorder-tasks`, { tarefa_ids: tarefaIds });
  }

  async getTarefasAtrasadas(projetoId?: number): Promise<Tarefa[]> {
    let url = '/tarefas/atrasadas';
    if (projetoId) {
      url += `?projeto_id=${projetoId}`;
    }
    const response = await api.get(url);
    return unwrapArrayData<Tarefa>(response.data);
  }

  async getTarefaHistorico(id: number): Promise<any[]> {
    const response = await api.get(`/tarefas/${id}/historico`);
    return unwrapArrayData<any>(response.data);
  }

  // Checklists
  async getChecklists(tarefaId: number): Promise<Checklist[]> {
    const response = await api.get(`/tarefas/${tarefaId}/checklists`);
    return unwrapArrayData<Checklist>(response.data);
  }

  async createChecklist(tarefaId: number, titulo: string): Promise<Checklist> {
    const response = await api.post(`/tarefas/${tarefaId}/checklists`, { titulo });
    return unwrapData<Checklist>(response.data);
  }

  async deleteChecklist(id: number): Promise<void> {
    await api.delete(`/checklists/${id}`);
  }

  async addChecklistItem(checklistId: number, texto: string): Promise<ItemChecklist> {
    const response = await api.post(`/checklists/${checklistId}/itens`, { texto });
    return unwrapData<ItemChecklist>(response.data);
  }

  async updateChecklistItem(itemId: number, data: { texto?: string; concluido?: boolean }): Promise<ItemChecklist> {
    const response = await api.patch(`/checklists/itens/${itemId}`, data);
    return unwrapData<ItemChecklist>(response.data);
  }

  async deleteChecklistItem(itemId: number): Promise<void> {
    await api.delete(`/checklists/itens/${itemId}`);
  }

  // Comentários
  async getComentarios(tarefaId: number): Promise<Comentario[]> {
    const response = await api.get(`/comentarios`, { params: { tarefaId } });
    return unwrapArrayData<Comentario>(response.data);
  }

  async getComentario(id: number): Promise<Comentario> {
    const response = await api.get(`/comentarios/${id}`);
    return unwrapData<Comentario>(response.data);
  }

  async createComentario(data: CreateComentarioDto): Promise<Comentario> {
    const response = await api.post('/comentarios', data);
    return unwrapData<Comentario>(response.data);
  }

  async updateComentario(id: number, data: UpdateComentarioDto): Promise<Comentario> {
    const response = await api.patch(`/comentarios/${id}`, data);
    return unwrapData<Comentario>(response.data);
  }

  async deleteComentario(id: number): Promise<void> {
    await api.delete(`/comentarios/${id}`);
  }

  async getComentariosEstatisticas(tarefaId?: number, periodo?: string): Promise<any> {
    let url = '/comentarios/estatisticas';
    const params = new URLSearchParams();
    
    if (tarefaId) params.append('tarefa_id', tarefaId.toString());
    if (periodo) params.append('periodo', periodo);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return unwrapData<any>(response.data);
  }

  async getComentariosPorPeriodo(inicio: string, fim: string, tarefaId?: number): Promise<any> {
    let url = '/comentarios/por-periodo';
    const params = new URLSearchParams();
    
    params.append('inicio', inicio);
    params.append('fim', fim);
    if (tarefaId) params.append('tarefa_id', tarefaId.toString());
    
    url += `?${params.toString()}`;
    
    const response = await api.get(url);
    return unwrapData<any>(response.data);
  }
}

export const kanbanService = new KanbanService();
export type {
  CreateProjetoDto,
  UpdateProjetoDto,
  CreateColunaDto,
  UpdateColunaDto,
  CreateTarefaDto,
  UpdateTarefaDto,
  ProjetoMembro,
  AddMembroDto,
  UpdateMembroDto,
  Comentario,
  CreateComentarioDto,
  UpdateComentarioDto,
  MembroProjeto,
  PapelMembro,
};
