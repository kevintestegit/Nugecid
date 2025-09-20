import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useOnlineUsers } from '@/hooks/useOnlineUsers'
import { PageLoading } from '@/components/ui/Loading'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentActivity from '@/components/dashboard/RecentActivity'
import QuickActions from '@/components/dashboard/QuickActions'
import SystemInfo from '@/components/dashboard/SystemInfo'
import { Sun, Moon, AlertTriangle, Users, User } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { data: stats, isLoading, error } = useDashboardStats()
  const { data: onlineUsers, isLoading: loadingOnline, error: errorOnline } = useOnlineUsers()

  // Debug logs para usuários online
  React.useEffect(() => {
    console.log('🔄 [DASHBOARD] Estado do hook useOnlineUsers atualizado:', {
      onlineUsers: onlineUsers?.length || 0,
      loading: loadingOnline,
      error: errorOnline?.message,
      hasData: !!onlineUsers,
      dataType: typeof onlineUsers
    });

    if (onlineUsers) {
      console.log('👥 [DASHBOARD] Usuários online recebidos:', onlineUsers.map(u => `${u.nome} (${u.role})`));
    }
  }, [onlineUsers, loadingOnline, errorOnline]);

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              Erro ao carregar dados
            </h3>
            <p className="text-foreground/70 text-sm">
              Não foi possível carregar as estatísticas do dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Bom dia', icon: Sun }
    if (hour < 18) return { text: 'Boa tarde', icon: Sun }
    return { text: 'Boa noite', icon: Moon }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <GreetingIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {greeting.text}, {user?.nome}!
            </h1>
            <p className="text-foreground/70 text-sm">
              Bem-vindo ao Sistema de Gerenciamento de Desarquivamentos
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats
        data={{
          total: stats?.data?.totalDesarquivamentos || 0,
          pendentes: stats?.data.atendimentosPendentes || 0,
          urgentes: 0, // Will be implemented later if needed
          porTipo: {}, // Will be implemented later if needed
          porStatus: {}, // Will be implemented later if needed
          recentes: stats?.data.recentes || []
        }}
        isLoading={isLoading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - Takes full width on top */}
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
        
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentActivity
            activities={stats?.data.recentes || []}
            isLoading={isLoading}
          />
        </div>
        
        {/* Right Sidebar - Takes 1 column */}
        <div className="space-y-8">
          {/* Online Users */}
          <div className="glass rounded-2xl p-6 shadow-modern-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Usuários Online</h3>
            </div>

            {loadingOnline ? (
              <div className="flex items-center gap-3 text-foreground/70">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm font-medium">Carregando...</span>
              </div>
            ) : errorOnline ? (
              <p className="text-sm text-destructive font-medium">Erro ao carregar usuários online</p>
            ) : onlineUsers && onlineUsers.length > 0 ? (
              <div className="space-y-4">
                {onlineUsers.slice(0, 5).map((onlineUser) => (
                  <div key={onlineUser.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {onlineUser.nome}
                      </p>
                      <p className="text-xs text-foreground/60 truncate">
                        {onlineUser.usuario}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
                      {onlineUser.role}
                    </span>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <p className="text-sm text-foreground/70 font-medium text-center pt-2 border-t border-border/30">
                    +{onlineUsers.length - 5} outros usuários
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground/70 font-medium text-center py-4">Nenhum usuário online</p>
            )}
          </div>
        </div>
      </div>

      {/* System Info - Full width, only for admins */}
      <SystemInfo isLoading={isLoading} />
    </div>
  )
}

export default DashboardPage
