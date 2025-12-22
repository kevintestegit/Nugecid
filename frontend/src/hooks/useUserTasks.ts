import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UserTask {
  id: number;
  titulo: string;
  descricao: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  prazo: string;
  createdAt: string;
  responsavel?: {
    id: number;
    nome: string;
    avatar?: string;
    avatarUrl?: string | null;
  };
  responsaveis?: {
    id: number;
    nome: string;
    avatar?: string;
    avatarUrl?: string | null;
  }[];
  projeto?: {
    id: number;
    nome: string;
  };
}

export const QUERY_KEYS = {
  userTasks: ['userTasks'] as const,
};

export function useUserTasks() {
  return useQuery<UserTask[], Error>({
    queryKey: QUERY_KEYS.userTasks,
    queryFn: async (): Promise<UserTask[]> => {
      try {
        const response = await api.get('/tarefas/usuario');
        const envelope = response?.data;
        const payload = envelope?.data ?? envelope;
        const list = Array.isArray(payload) ? payload : [];
        return list;
      } catch (error: any) {
        console.error('❌ [FRONTEND] Erro ao buscar tarefas do usuário:', error);
        throw error;
      }
    },
    staleTime: 60000, // 1 minuto
    retry: 2,
  });
}
