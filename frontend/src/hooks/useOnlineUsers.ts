import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";

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
  onlineUsers: ["onlineUsers"] as const,
};

export function useOnlineUsers() {
  return useQuery<OnlineUser[], Error>({
    queryKey: QUERY_KEYS.onlineUsers,
    queryFn: async (): Promise<OnlineUser[]> => {
      const response = await apiService.getOnlineUsers();
      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((user) => ({
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        role: user.role?.name ?? "",
        lastActivity: user.updatedAt,
        avatarUrl: user.avatarUrl ?? null,
        avatar: user.avatar ?? null,
      }));
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
    retry: 2,
  });
}
