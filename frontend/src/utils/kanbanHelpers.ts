import { Tarefa } from '../types/kanban.types';
import { PrazoStatus, PrazoInfo } from '../types/kanban.types';

/**
 * Calcula o status do prazo de uma tarefa
 */
export const calcularPrazoStatus = (prazo?: string): PrazoInfo => {
  if (!prazo) {
    return {
      status: PrazoStatus.SEM_PRAZO,
      dias: null,
      cor: '#6B7280',
      label: 'Sem prazo',
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataPrazo = new Date(prazo);
  dataPrazo.setHours(0, 0, 0, 0);

  const diffTime = dataPrazo.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: PrazoStatus.ATRASADO,
      dias: Math.abs(diffDays),
      cor: '#DC2626',
      label: `${Math.abs(diffDays)} dia(s) atrasado`,
    };
  }

  if (diffDays === 0) {
    return {
      status: PrazoStatus.ATRASADO,
      dias: 0,
      cor: '#DC2626',
      label: 'Vence hoje!',
    };
  }

  if (diffDays <= 3) {
    return {
      status: PrazoStatus.PROXIMO,
      dias: diffDays,
      cor: '#F59E0B',
      label: `${diffDays} dia(s)`,
    };
  }

  return {
    status: PrazoStatus.OK,
    dias: diffDays,
    cor: '#16A34A',
    label: `${diffDays} dia(s)`,
  };
};

/**
 * Retorna cor baseada na prioridade
 */
export const getPrioridadeCor = (prioridade: string): string => {
  const cores: Record<string, string> = {
    critica: '#DC2626',
    alta: '#EA580C',
    media: '#CA8A04',
    baixa: '#16A34A',
  };
  return cores[prioridade] || '#6B7280';
};

/**
 * Retorna label traduzido da prioridade
 */
export const getPrioridadeLabel = (prioridade: string): string => {
  const labels: Record<string, string> = {
    critica: 'Crítica',
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
  };
  return labels[prioridade] || prioridade;
};

/**
 * Gera cor aleatória para tags
 */
export const getTagColor = (tag: string): string => {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // green
    '#06B6D4', // cyan
    '#EF4444', // red
    '#6366F1', // indigo
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Formata data para exibição
 */
export const formatarData = (data: string): string => {
  const date = new Date(data);
  const hoje = new Date();
  
  // Se for hoje
  if (date.toDateString() === hoje.toDateString()) {
    return 'Hoje';
  }
  
  // Se foi ontem
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (date.toDateString() === ontem.toDateString()) {
    return 'Ontem';
  }
  
  // Se for amanhã
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  if (date.toDateString() === amanha.toDateString()) {
    return 'Amanhã';
  }
  
  // Formato padrão
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formata data e hora relativa (ex: "2 horas atrás")
 */
export const formatarDataRelativa = (data: string): string => {
  const agora = new Date();
  const dataObj = new Date(data);
  const diffMs = agora.getTime() - dataObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHoras = Math.floor(diffMins / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffSecs < 60) return 'Agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHoras < 24) return `${diffHoras}h atrás`;
  if (diffDias < 7) return `${diffDias}d atrás`;
  
  return formatarData(data);
};

/**
 * Gera avatar com iniciais
 */
export const getInitials = (nome: string): string => {
  const parts = nome.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
};

/**
 * Gera cor de avatar baseada no nome
 */
export const getAvatarColor = (nome: string): string => {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  ];
  
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Formata tamanho de arquivo
 */
export const formatarTamanhoArquivo = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Verifica se tarefa está atrasada
 */
export const isAtrasada = (tarefa: Tarefa): boolean => {
  if (!tarefa.prazo) return false;
  const prazoInfo = calcularPrazoStatus(tarefa.prazo);
  return prazoInfo.status === PrazoStatus.ATRASADO;
};

/**
 * Filtra tarefas por busca
 */
export const filtrarTarefasPorBusca = (tarefas: Tarefa[], busca: string): Tarefa[] => {
  if (!busca.trim()) return tarefas;
  
  const buscaLower = busca.toLowerCase();
  return tarefas.filter(tarefa => 
    tarefa.titulo.toLowerCase().includes(buscaLower) ||
    tarefa.descricao?.toLowerCase().includes(buscaLower) ||
    tarefa.tags?.some(tag => tag.toLowerCase().includes(buscaLower))
  );
};

/**
 * Ordena tarefas
 */
export const ordenarTarefas = (
  tarefas: Tarefa[],
  criterio: 'ordem' | 'prazo' | 'prioridade' | 'titulo'
): Tarefa[] => {
  const tarefasCopy = [...tarefas];
  
  switch (criterio) {
    case 'ordem':
      return tarefasCopy.sort((a, b) => a.ordem - b.ordem);
    
    case 'prazo':
      return tarefasCopy.sort((a, b) => {
        if (!a.prazo && !b.prazo) return 0;
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
      });
    
    case 'prioridade': {
      const prioridadeOrdem: Record<string, number> = {
        critica: 0,
        alta: 1,
        media: 2,
        baixa: 3,
      };
      return tarefasCopy.sort((a, b) => 
        prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade]
      );
    }
    
    case 'titulo':
      return tarefasCopy.sort((a, b) => 
        a.titulo.localeCompare(b.titulo)
      );
    
    default:
      return tarefasCopy;
  }
};
