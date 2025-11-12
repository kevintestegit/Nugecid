export interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string;
  projetoId: number;
  colunaId: number;
  criadorId: number;
  responsavelId?: number;
  prazo?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  ordem: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  
  // Relações
  responsavel?: Usuario;
  coluna?: Coluna;
  projeto?: Projeto;
  comentarios?: Comentario[];
  anexos?: Anexo[];
  checklists?: Checklist[];
}

export interface Coluna {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
  ativa: boolean;
  projetoId: number;
  wipLimit?: number;
  tarefas?: Tarefa[];
}

export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
  dataInicio?: string;
  dataFim?: string;
  status: string;
  progresso: number;
}

export interface Usuario {
  id: number;
  nome: string;
  usuario: string;
  email?: string;
  avatar?: string;
}

export interface Comentario {
  id: number;
  tarefaId: number;
  usuarioId: number;
  conteudo: string;
  createdAt: string;
  updatedAt: string;
  usuario?: Usuario;
}

export interface Anexo {
  id: number;
  tarefaId: number;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number;
  tipo: string;
  createdAt: string;
}

export interface Checklist {
  id: number;
  tarefaId: number;
  titulo: string;
  itens: ItemChecklist[];
}

export interface ItemChecklist {
  id: number;
  checklistId: number;
  descricao: string;
  concluido: boolean;
  ordem: number;
}

export interface HistoricoTarefa {
  id: number;
  tarefaId: number;
  usuarioId: number;
  acao: string;
  campoAlterado?: string;
  valorAnterior?: string;
  valorNovo?: string;
  createdAt: string;
  usuario?: Usuario;
}

export interface FiltrosKanban {
  projetoId?: number;
  responsavelId?: number;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  tags?: string[];
  prazo?: 'atrasadas' | 'hoje' | 'semana' | 'mes' | 'sem_prazo';
  busca?: string;
  agruparPor?: 'responsavel' | 'prioridade' | 'prazo' | 'tags';
  comComentarios?: boolean;
  comAnexos?: boolean;
}

export interface EstatisticasKanban {
  total: number;
  porPrioridade: Record<string, number>;
  porStatus: Record<string, number>;
  atrasadas: number;
  semPrazo: number;
}

export interface WipStatus {
  count: number;
  limit: number | null;
  exceeded: boolean;
}

// Helpers para calcular status de prazo
export enum PrazoStatus {
  OK = 'ok',
  PROXIMO = 'proximo',
  ATRASADO = 'atrasado',
  SEM_PRAZO = 'sem_prazo',
}

export interface PrazoInfo {
  status: PrazoStatus;
  dias: number | null;
  cor: string;
  label: string;
}
