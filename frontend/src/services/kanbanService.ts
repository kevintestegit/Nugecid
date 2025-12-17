import { api } from './api';
import { Projeto, Coluna, Tarefa } from '../components/kanban';

// Interfaces para DTOs
interface CreateProjetoDto {
  nome: string;
  descricao?: string;
}

interface UpdateProjetoDto {
  nome?: string;
  descricao?: string;
}

interface CreateColunaDto {
  nome: string;
  cor?: string;
  limite_wip?: number;
  projeto_id: number;
  ordem: number;
}

interface UpdateColunaDto {
  nome?: string;
  cor?: string;
  limite_wip?: number;
  ordem?: number;
}

interface CreateTarefaDto {
  titulo: string;
  descricao?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  prazo?: string;
  tags?: string[];
  responsavel_id?: number;
  coluna_id: number;
  ordem: number;
}

interface UpdateTarefaDto {
  titulo?: string;
  descricao?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  prazo?: string;
  tags?: string[];
  responsavel_id?: number;
  coluna_id?: number;
  ordem?: number;
}

interface MoveTarefaDto {
  coluna_id: number;
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
    return response.data;
  }

  async getProjeto(id: number): Promise<Projeto> {
    const response = await api.get(`/projetos/${id}`);
    return response.data;
  }

  async createProjeto(data: CreateProjetoDto): Promise<Projeto> {
    const response = await api.post('/projetos', data);
    return response.data;
  }

  async updateProjeto(id: number, data: UpdateProjetoDto): Promise<Projeto> {
    const response = await api.patch(`/projetos/${id}`, data);
    return response.data;
  }

  async deleteProjeto(id: number): Promise<void> {
    await api.delete(`/projetos/${id}`);
  }

  async getProjetoStats(id: number): Promise<any> {
    const response = await api.get(`/projetos/${id}/stats`);
    return response.data;
  }

  // Membros do projeto
  async getProjetoMembros(projetoId: number): Promise<ProjetoMembro[]> {
    const response = await api.get(`/projetos/${projetoId}/membros`);
    return response.data;
  }

  async searchUsuariosParaProjeto(projetoId: number, search?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/projetos/${projetoId}/membros/lookup${qs}`);
    return response.data as { id: number; nome?: string; usuario?: string; avatarUrl?: string | null }[];
  }

  async addProjetoMembro(projetoId: number, data: AddMembroDto): Promise<ProjetoMembro> {
    const response = await api.post(`/projetos/${projetoId}/membros`, data);
    return response.data;
  }

  async updateProjetoMembro(projetoId: number, membroId: number, data: UpdateMembroDto): Promise<ProjetoMembro> {
    const response = await api.patch(`/projetos/${projetoId}/membros/${membroId}`, data);
    return response.data;
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
    return response.data;
  }

  async getColuna(id: number): Promise<Coluna> {
    const response = await api.get(`/colunas/${id}`);
    return response.data;
  }

  async createColuna(data: CreateColunaDto): Promise<Coluna> {
    const response = await api.post('/colunas', data);
    return response.data;
  }

  async updateColuna(id: number, data: UpdateColunaDto): Promise<Coluna> {
    const response = await api.patch(`/colunas/${id}`, data);
    return response.data;
  }

  async deleteColuna(id: number): Promise<void> {
    await api.delete(`/colunas/${id}`);
  }

  async moveColuna(id: number, ordem: number): Promise<void> {
    await api.patch(`/colunas/${id}/move`, { ordem });
  }

  async getColunaStats(id: number): Promise<any> {
    const response = await api.get(`/colunas/${id}/stats`);
    return response.data;
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
    const payload = response.data;
    // API pode retornar { data, meta }; normalizar para array
    if (payload && Array.isArray(payload.data)) return payload.data as Tarefa[];
    if (Array.isArray(payload)) return payload as Tarefa[];
    return [];
  }

  async getTarefa(id: number): Promise<Tarefa> {
    const response = await api.get(`/tarefas/${id}`);
    return response.data;
  }

  async createTarefa(data: CreateTarefaDto): Promise<Tarefa> {
    const response = await api.post('/tarefas', data);
    return response.data;
  }

  async updateTarefa(id: number, data: UpdateTarefaDto): Promise<Tarefa> {
    const response = await api.patch(`/tarefas/${id}`, data);
    return response.data;
  }

  async deleteTarefa(id: number): Promise<void> {
    await api.delete(`/tarefas/${id}`);
  }

  async moveTarefa(id: number, colunaId: number, ordem: number): Promise<void> {
    // API espera ordem 0-based (aceita >=0); front usa 0-based também
    await api.patch(`/tarefas/${id}/mover`, { colunaId: colunaId, ordem });
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
    return response.data;
  }

  async getTarefaHistorico(id: number): Promise<any[]> {
    const response = await api.get(`/tarefas/${id}/historico`);
    return response.data;
  }

  // Comentários
  async getComentarios(tarefaId: number): Promise<Comentario[]> {
    const response = await api.get(`/comentarios`, { params: { tarefaId } });
    return response.data;
  }

  async getComentario(id: number): Promise<Comentario> {
    const response = await api.get(`/comentarios/${id}`);
    return response.data;
  }

  async createComentario(data: CreateComentarioDto): Promise<Comentario> {
    const response = await api.post('/comentarios', data);
    return response.data;
  }

  async updateComentario(id: number, data: UpdateComentarioDto): Promise<Comentario> {
    const response = await api.patch(`/comentarios/${id}`, data);
    return response.data;
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
    return response.data;
  }

  async getComentariosPorPeriodo(inicio: string, fim: string, tarefaId?: number): Promise<any> {
    let url = '/comentarios/por-periodo';
    const params = new URLSearchParams();
    
    params.append('inicio', inicio);
    params.append('fim', fim);
    if (tarefaId) params.append('tarefa_id', tarefaId.toString());
    
    url += `?${params.toString()}`;
    
    const response = await api.get(url);
    return response.data;
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
