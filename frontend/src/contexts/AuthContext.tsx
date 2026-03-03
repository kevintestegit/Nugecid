import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { User, LoginDto, UserRole } from "@/types";
import axios from "axios";
import { apiService } from "@/services/api";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  clearAuth,
} from "@/utils/tokenStorage";

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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  const updateUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);

    if (nextUser) {
      setStoredUser(nextUser);
    } else {
      removeStoredUser();
    }
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (!refreshTimerRef.current) return;
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = null;
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.warn("Tentativa de refresh sem token disponível");
        throw new Error("No refresh token available");
      }

      const response = await apiService.refreshToken(refreshToken);
      if (response.success && response.data) {
        const { accessToken } = response.data;
        setAccessToken(accessToken);

        // Schedule next refresh
        clearRefreshTimer();
        refreshTimerRef.current = setTimeout(
          () => {
            void refreshTokens();
          },
          45 * 60 * 1000,
        );
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error: unknown) {
      // Verificar se é erro de conectividade com o backend
      const errCode = axios.isAxiosError(error) ? error.code : undefined;
      const errMessage = error instanceof Error ? error.message : undefined;
      if (errCode === "ERR_NETWORK" || errMessage?.includes("fetch")) {
        // Reagendar tentativa de refresh em 30 segundos
        setTimeout(() => {
          void refreshTokens();
        }, 30000);
        return;
      }

      // Para outros erros (token inválido, expirado, etc.), fazer logout
      clearAuth();
      updateUser(null);

      // Clear refresh timer
      clearRefreshTimer();
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
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      const localUser = getStoredUser();

      if (accessToken && refreshToken && localUser) {
        updateUser(localUser);

        // Schedule token refresh
        scheduleTokenRefresh();

        // Verificar se o token ainda é válido
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            updateUser(response.data);
          }
        } catch (error: unknown) {
          // Verificar se é erro de conectividade
          const errCode = axios.isAxiosError(error) ? error.code : undefined;
          const errMessage = error instanceof Error ? error.message : undefined;
          if (errCode === "ERR_NETWORK" || errMessage?.includes("fetch")) {
            // Manter usuário logado com dados do localStorage
            return;
          }

          // Se o token expirou, tentar renovar
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            await refreshTokens();
          } else {
            // Outro erro, limpar dados
            removeAccessToken();
            removeRefreshToken();
            updateUser(null);
          }
        }
      } else if (refreshToken && !accessToken) {
        // Tenta renovar o token se apenas o refresh token estiver presente
        await refreshTokens();
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

  const login = async (credentials: LoginDto) => {
    try {
      const response = await apiService.login(credentials);

      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data;

        setAccessToken(accessToken);
        if (refreshToken) {
          setRefreshToken(refreshToken);
        }
        updateUser(userData);

        // Schedule token refresh
        scheduleTokenRefresh();
      } else {
        throw new Error(response.message || "Erro ao fazer login");
      }
    } catch (error) {
      console.error("Erro no login", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Erro ao fazer logout", error);
    } finally {
      removeAccessToken();
      removeRefreshToken();
      updateUser(null);

      // Clear refresh timer
      clearRefreshTimer();
    }
  };

  const checkPermission = (action: string, resource?: string): boolean => {
    if (!user) {
      return false;
    }

    // Admin tem acesso total
    if (user.role?.name === "admin") {
      return true;
    }

    // Coordenador tem permissões específicas
    if (user.role?.name === "coordenador") {
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
    if (user.role?.name === "usuario") {
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
