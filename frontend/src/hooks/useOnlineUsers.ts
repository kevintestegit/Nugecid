import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface OnlineUser {
  id: number;
  nome: string;
  usuario: string;
  role: string;
  lastActivity: string;
}

export const QUERY_KEYS = {
  onlineUsers: ['onlineUsers'] as const,
};

export function useOnlineUsers() {
  return useQuery<OnlineUser[], Error>({
    queryKey: QUERY_KEYS.onlineUsers,
    queryFn: async (): Promise<OnlineUser[]> => {
      console.log('🔍 [FRONTEND] Fazendo requisição para /auth/online-users');
      try {
        const response = await api.get('/auth/online-users');
        // A API usa TransformInterceptor e envolve as respostas em { success, data, ... }
        const envelope = response?.data;
        const payload = envelope?.data ?? envelope; // fallback caso interceptor esteja desativado
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        console.log('✅ [FRONTEND] Resposta recebida:', {
          status: response.status,
          count: list.length,
          rawDataType: typeof envelope,
        });
        return list;
      } catch (error: any) {
        console.error('❌ [FRONTEND] Erro na requisição online-users:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
    retry: 2,
  });
}
