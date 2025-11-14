import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { User, LoginDto, UserRole } from '@/types'
import { apiService } from '@/services/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginDto) => Promise<void>
  logout: () => Promise<void>
  checkPermission: (action: string, resource?: any) => boolean
  updateUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null)

  const isAuthenticated = !!user

  const updateUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser)

    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser))
    } else {
      localStorage.removeItem('user')
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
    
    // Cleanup timer on unmount
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
    }
  }, [])

  const scheduleTokenRefresh = () => {
    // Clear existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    // Schedule refresh 5 minutes before token expires (45 minutes)
    const timer = setTimeout(() => {
      refreshTokens()
    }, 45 * 60 * 1000) // 45 minutes

    setRefreshTimer(timer)
  }

  const refreshTokens = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        console.warn('🔄 Tentativa de refresh sem token disponível')
        throw new Error('No refresh token available')
      }

      console.log('🔄 Tentando renovar token de acesso...')
      const response = await apiService.refreshToken(refreshToken)
      if (response.success && response.data) {
        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)

        // Schedule next refresh
        scheduleTokenRefresh()

        console.log('✅ Token renovado com sucesso')
      } else {
        throw new Error('Failed to refresh token')
      }
    } catch (error: any) {
      console.error('❌ Falha na renovação do token:', error)

      // Verificar se é erro de conectividade com o backend
      if (error.code === 'ERR_NETWORK' || error.message?.includes('fetch')) {
        console.warn('🔌 Backend indisponível - mantendo sessão temporariamente')
        // Reagendar tentativa de refresh em 30 segundos
        setTimeout(() => {
          console.log('🔄 Tentando reconectar com o backend...')
          refreshTokens()
        }, 30000)
        return
      }

      // Para outros erros (token inválido, expirado, etc.), fazer logout
      console.log('🚪 Fazendo logout devido a erro de autenticação')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      updateUser(null)

      // Clear refresh timer
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        setRefreshTimer(null)
      }
    }
  }

  const checkAuthStatus = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const savedUser = localStorage.getItem('user')

      if (accessToken && refreshToken && savedUser) {
        const localUser = JSON.parse(savedUser)
        console.log('📦 Usuário do localStorage:', { id: localUser.id, nome: localUser.nome, avatarUrl: localUser.avatarUrl })
        updateUser(localUser)

        // Schedule token refresh
        scheduleTokenRefresh()

        // Verificar se o token ainda é válido
        try {
          console.log('🌐 Buscando dados atualizados do backend...')
          const response = await apiService.getCurrentUser()
          if (response.success && response.data) {
            console.log('✅ Dados recebidos do backend:', { id: response.data.id, nome: response.data.nome, avatarUrl: response.data.avatarUrl })
            updateUser(response.data)
          } else {
            console.warn('⚠️ Backend não retornou dados válidos')
          }
        } catch (error: any) {
          console.log('🔍 Erro ao verificar usuário atual:', error)

          // Verificar se é erro de conectividade
          if (error.code === 'ERR_NETWORK' || error.message?.includes('fetch')) {
            console.warn('🔌 Backend indisponível durante verificação - mantendo dados locais')
            // Manter usuário logado com dados do localStorage
            return
          }

          // Se o token expirou, tentar renovar
          if (error.response?.status === 401) {
            console.log('🔄 Token expirado, tentando renovar...')
            await refreshTokens()
          } else {
            // Outro erro, limpar dados
            console.log('🚪 Erro não recuperável, limpando sessão')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            updateUser(null)
          }
        }
      } else if (refreshToken && !accessToken) {
        // Tenta renovar o token se apenas o refresh token estiver presente
        await refreshTokens()
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginDto) => {
    try {
      const response = await apiService.login(credentials)

      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data

        localStorage.setItem('accessToken', accessToken)
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken)
        }
        updateUser(userData)

        // Schedule token refresh
        scheduleTokenRefresh()
      } else {
        throw new Error(response.message || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      updateUser(null)

      // Clear refresh timer
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        setRefreshTimer(null)
      }
    }
  }

  const checkPermission = (action: string, resource: string): boolean => {
    console.log('🔍 Verificando permissão:', { user: user?.nome, role: user?.role?.name, action, resource })
    
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return false
    }

    // Admin tem acesso total
    if (user.role?.name === 'admin') {
      console.log('✅ Admin - acesso total concedido')
      return true
    }

    // Coordenador tem permissões específicas
    if (user.role?.name === 'coordenador') {
      console.log('🔧 Verificando permissões de coordenador')
      // Pode gerenciar desarquivamentos
      if (resource === 'desarquivamentos') {
        const hasPermission = ['create', 'read', 'update', 'delete'].includes(action)
        console.log(`${hasPermission ? '✅' : '❌'} Coordenador - desarquivamentos:${action}`)
        return hasPermission
      }
      // Pode visualizar usuários mas não gerenciar
      if (resource === 'users') {
        const hasPermission = action === 'read'
        console.log(`${hasPermission ? '✅' : '❌'} Coordenador - users:${action}`)
        return hasPermission
      }
      // Pode acessar relatórios
      if (resource === 'reports') {
        const hasPermission = action === 'read'
        console.log(`${hasPermission ? '✅' : '❌'} Coordenador - reports:${action}`)
        return hasPermission
      }
      // Pode gerenciar projetos e tarefas
      if (resource === 'projetos' || resource === 'tarefas') {
        const hasPermission = ['create', 'read', 'update', 'delete'].includes(action)
        console.log(`${hasPermission ? '✅' : '❌'} Coordenador - ${resource}:${action}`)
        return hasPermission
      }
    }

    // Usuário comum tem permissões limitadas
    if (user.role?.name === 'usuario') {
      console.log('👤 Verificando permissões de usuário comum')
      // Pode apenas visualizar desarquivamentos
      if (resource === 'desarquivamentos') {
        const hasPermission = action === 'read'
        console.log(`${hasPermission ? '✅' : '❌'} Usuario - desarquivamentos:${action}`)
        return hasPermission
      }
      // Pode visualizar projetos e tarefas, criar/editar suas próprias tarefas
      if (resource === 'projetos') {
        const hasPermission = action === 'read'
        console.log(`${hasPermission ? '✅' : '❌'} Usuario - projetos:${action}`)
        return hasPermission
      }
      if (resource === 'tarefas') {
        const hasPermission = ['create', 'read', 'update'].includes(action)
        console.log(`${hasPermission ? '✅' : '❌'} Usuario - tarefas:${action}`)
        return hasPermission
      }
    }

    console.log('❌ Permissão negada - nenhuma regra aplicável')
    return false
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkPermission,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useOptionalAuth(): AuthContextType | null {
  return useContext(AuthContext) ?? null
}

export function useAuth(): AuthContextType {
  const context = useOptionalAuth()
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
