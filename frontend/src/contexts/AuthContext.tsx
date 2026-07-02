import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, LoginDto, UserRole } from "@/types";
import axios from "axios";
import { apiService } from "@/services/api";
import { pushSubscriptionService } from "@/services/pushSubscriptionService";
import { setMonitoringUser } from "@/lib/monitoring";
import {
  setStoredUser,
  removeStoredUser,
  clearAuth,
} from "@/utils/tokenStorage";
import { normalizeUserRoleName } from "@/lib/auth/roles";
import { AUTH_REQUIRED_EVENT } from "@/lib/navigation/navigationEvents";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (action: string, resource?: string) => boolean;
  updateUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSafeLoginErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status) {
      return `Falha no login (status ${status})`;
    }

    return error.code ? `Falha no login (${error.code})` : "Falha no login";
  }

  return error instanceof Error ? error.message : "Falha no login";
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<number | null>(null);

  const isAuthenticated = !!user;

  const updateUser = useCallback(
    (nextUser: User | null) => {
      const previousUserId = currentUserIdRef.current;
      const nextUserId = nextUser?.id ?? null;

      if (previousUserId !== null && previousUserId !== nextUserId) {
        queryClient.clear();
      }

      currentUserIdRef.current = nextUserId;
      setUserState(nextUser);

      if (nextUser) {
        setStoredUser(nextUser);
      } else {
        removeStoredUser();
      }

      setMonitoringUser(nextUser);
    },
    [queryClient],
  );

  const clearRefreshTimer = useCallback(() => {
    if (!refreshTimerRef.current) return;
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = null;
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const response = await apiService.refreshToken();
      if (response.success && response.data) {
        clearRefreshTimer();
        refreshTimerRef.current = setTimeout(
          () => {
            void refreshTokens();
          },
          45 * 60 * 1000,
        );
        return true;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error: unknown) {
      const errCode = axios.isAxiosError(error) ? error.code : undefined;
      const errMessage = error instanceof Error ? error.message : undefined;
      if (errCode === "ERR_NETWORK" || errMessage?.includes("fetch")) {
        setTimeout(() => {
          void refreshTokens();
        }, 30000);
        return false;
      }

      clearAuth();
      updateUser(null);
      clearRefreshTimer();
      return false;
    }
  }, [clearRefreshTimer, updateUser]);

  const scheduleTokenRefresh = useCallback(() => {
    clearRefreshTimer();
    refreshTimerRef.current = setTimeout(
      () => {
        void refreshTokens();
      },
      45 * 60 * 1000,
    ); // 45 minutes
  }, [clearRefreshTimer, refreshTokens]);

  const checkAuthStatus = useCallback(async () => {
    try {
      // Verify auth by calling the API — the httpOnly cookie is sent
      // automatically. If the cookie is valid we get the user back.
      try {
        const response = await apiService.getCurrentUser({
          skipAuthRedirect: true,
        });
        if (response.success && response.data) {
          updateUser(response.data);
          scheduleTokenRefresh();
        } else {
          clearAuth();
          updateUser(null);
        }
      } catch (error: unknown) {
        // Verificar se é erro de conectividade
        const errCode = axios.isAxiosError(error) ? error.code : undefined;
        const errMessage = error instanceof Error ? error.message : undefined;
        if (errCode === "ERR_NETWORK" || errMessage?.includes("fetch")) {
          clearAuth();
          updateUser(null);
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const refreshed = await refreshTokens();
          if (!refreshed) {
            clearAuth();
            updateUser(null);
            return;
          }

          const refreshedResponse = await apiService.getCurrentUser({
            skipAuthRedirect: true,
          });
          if (refreshedResponse.success && refreshedResponse.data) {
            updateUser(refreshedResponse.data);
            scheduleTokenRefresh();
          } else {
            clearAuth();
            updateUser(null);
          }
        } else {
          clearAuth();
          updateUser(null);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação", error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTokens, scheduleTokenRefresh, updateUser]);

  useEffect(() => {
    void checkAuthStatus();

    // Cleanup timer on unmount
    return () => {
      clearRefreshTimer();
    };
  }, [checkAuthStatus, clearRefreshTimer]);

  useEffect(() => {
    const handleAuthRequired = () => {
      clearAuth();
      updateUser(null);
      clearRefreshTimer();
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    return () => {
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [clearRefreshTimer, updateUser]);

  const login = async (credentials: LoginDto) => {
    try {
      const response = await apiService.login(credentials);

      if (response.success && response.data) {
        const { user: userData } = response.data;
        updateUser(userData);
        scheduleTokenRefresh();
      } else {
        throw new Error(response.message || "Erro ao fazer login");
      }
    } catch (error) {
      console.error("Erro no login:", getSafeLoginErrorMessage(error));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await pushSubscriptionService.detachCurrentSubscription();
      await apiService.logout();
    } catch (error) {
      console.error("Erro ao fazer logout", error);
    } finally {
      clearAuth();
      updateUser(null);
      clearRefreshTimer();
    }
  };

  const checkPermission = (action: string, resource?: string): boolean => {
    if (!user) {
      return false;
    }

    const normalizedRole = normalizeUserRoleName(user.role);
    if (!normalizedRole) {
      return false;
    }

    // Admin tem acesso total
    if (normalizedRole === UserRole.ADMIN) {
      return true;
    }

    // Coordenador tem permissões específicas
    if (normalizedRole === UserRole.COORDENADOR) {
      // Pode gerenciar desarquivamentos
      if (resource === "desarquivamentos") {
        return ["create", "read", "update", "delete"].includes(action);
      }
      // Pode visualizar usuários mas não gerenciar
      if (resource === "users") {
        return action === "read";
      }
      // Pode acessar relatórios
      if (resource === "reports") {
        return action === "read";
      }
      // Pode gerenciar projetos e tarefas
      if (resource === "projetos" || resource === "tarefas") {
        return ["create", "read", "update", "delete"].includes(action);
      }
      if (resource === "arquivos") {
        return ["create", "read", "update", "delete"].includes(action);
      }
    }

    // Usuário comum tem permissões limitadas
    if (normalizedRole === UserRole.USUARIO) {
      // Pode apenas visualizar desarquivamentos
      if (resource === "desarquivamentos") {
        return action === "read";
      }
      if (resource === "arquivos") {
        return action === "read";
      }
      // Pode visualizar projetos e tarefas, criar/editar suas próprias tarefas
      if (resource === "projetos") {
        return action === "read";
      }
      if (resource === "tarefas") {
        return ["create", "read", "update"].includes(action);
      }
    }

    return false;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkPermission,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useOptionalAuth(): AuthContextType | null {
  return useContext(AuthContext) ?? null;
}

export function useAuth(): AuthContextType {
  const context = useOptionalAuth();
  if (context === null) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
