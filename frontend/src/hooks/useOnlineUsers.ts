import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface OnlineUser {
  id: number;
  nome: string;
  usuario: string;
  role: string;
  lastActivity: string;
  avatarUrl?: string | null;
  avatar?: string | null;
}

export const QUERY_KEYS = {
  onlineUsers: ['onlineUsers'] as const,
};

export function useOnlineUsers() {
  return useQuery<OnlineUser[], Error>({
    queryKey: QUERY_KEYS.onlineUsers,
    queryFn: async (): Promise<OnlineUser[]> => {
      try {
        const response = await api.get('/auth/online-users');
        // A API usa TransformInterceptor e envolve as respostas em { success, data, ... }
        const envelope = response?.data;
        const payload = envelope?.data ?? envelope; // fallback caso interceptor esteja desativado
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        return list;
      } catch (error: any) {
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
    retry: 2,
  });
}
