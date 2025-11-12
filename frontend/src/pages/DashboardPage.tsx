import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useOnlineUsers } from '@/hooks/useOnlineUsers'
import { useUserTasks } from '@/hooks/useUserTasks'
import { useDashboardLayout } from '@/hooks/useDashboardLayout'
import { PageLoading } from '@/components/ui/Loading'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentActivity from '@/components/dashboard/RecentActivity'
import QuickActions from '@/components/dashboard/QuickActions'
import SystemInfo from '@/components/dashboard/SystemInfo'
import UserTasks from '@/components/dashboard/UserTasks'
import PrazosCalendar from '@/components/dashboard/PrazosCalendar'
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer'
import { Sun, Moon, AlertTriangle, Users, User, Settings2 } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { data: stats, isLoading, error } = useDashboardStats()
  const { data: onlineUsers, isLoading: loadingOnline, error: errorOnline } = useOnlineUsers()
  const { data: userTasks, isLoading: loadingTasks } = useUserTasks()
  
  const {
    visibleCards,
    cards,
    isCustomizing,
    setIsCustomizing,
    toggleCardVisibility,
    moveCardUp,
    moveCardDown,
    resetLayout
  } = useDashboardLayout()

  // Preparar dados de prazos para o calendário (ANTES dos returns condicionais)
  const prazosData = React.useMemo(() => {
    if (!stats?.data?.recentes) return []
    
    return stats.data.recentes
      .filter(item => item.dataDevolucaoSetor || item.dataSolicitacao)
      .map(item => ({
        id: item.id,
        titulo: `#${item.id} - ${item.nomeCompleto?.substring(0, 30)}...`,
        data: item.dataDevolucaoSetor || item.dataSolicitacao,
        tipo: item.dataDevolucaoSetor ? 'devolucao' as const : 'solicitacao' as const,
        urgente: item.urgente || false
      }))
  }, [stats?.data?.recentes])

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

  const getTimeAgo = (lastActivity: string) => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins === 1) return 'há 1 minuto';
    if (diffMins < 60) return `há ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'há 1 hora';
    if (diffHours < 24) return `há ${diffHours} horas`;
    
    return 'há mais de 1 dia';
  }

  // Returns condicionais DEPOIS de todos os hooks
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

  const renderCard = (cardType: string) => {
    switch (cardType) {
      case 'stats':
        return (
          <DashboardStats
            key="stats"
            data={{
              total: stats?.data?.totalDesarquivamentos || 0,
              pendentes: stats?.data.atendimentosPendentes || 0,
              urgentes: stats?.data?.urgentes || 0,
              porTipo: stats?.data?.porTipo || {},
              porStatus: stats?.data?.porStatus || {},
              recentes: stats?.data.recentes || [],
              totalMesAnterior: stats?.data?.totalMesAnterior,
              pendentesMesAnterior: stats?.data?.pendentesMesAnterior,
            }}
            isLoading={isLoading}
          />
        )
      
      case 'quick-actions':
        return <QuickActions key="quick-actions" />
      
      case 'tasks':
        return (
          <UserTasks
            key="tasks"
            tasks={userTasks || []}
            isLoading={loadingTasks}
          />
        )
      
      case 'activity':
        return (
          <RecentActivity
            key="activity"
            activities={stats?.data.recentes || []}
            isLoading={isLoading}
          />
        )
      
      case 'calendar':
        return (
          <PrazosCalendar 
            key="calendar"
            prazos={prazosData}
            isLoading={isLoading}
          />
        )
      
      case 'online-users':
        return (
          <div key="online-users" className="glass rounded-2xl p-6 shadow-modern-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center relative">
                <Users className="h-5 w-5 text-green-600" />
                {onlineUsers && onlineUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{onlineUsers.length}</span>
                    </span>
                  </span>
                )}
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
              <div className="space-y-3">
                {onlineUsers.slice(0, 5).map((onlineUser) => (
                  <div key={onlineUser.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors duration-200">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-card"></span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {onlineUser.nome}
                      </p>
                      <p className="text-xs text-foreground/60 truncate">
                        {onlineUser.usuario}
                      </p>
                      <p className="text-[11px] text-foreground/50 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-green-500"></span>
                        {getTimeAgo(onlineUser.lastActivity)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary capitalize shrink-0">
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
        )
      
      case 'system-info':
        return (
          <SystemInfo key="system-info" isLoading={isLoading} />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
          
          <button
            onClick={() => setIsCustomizing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors font-medium text-sm"
          >
            <Settings2 className="h-4 w-4" />
            Personalizar
          </button>
        </div>
      </div>

      {/* Customizer Modal */}
      {isCustomizing && (
        <DashboardCustomizer
          cards={cards}
          onToggleVisibility={toggleCardVisibility}
          onMoveUp={moveCardUp}
          onMoveDown={moveCardDown}
          onReset={resetLayout}
          onClose={() => setIsCustomizing(false)}
        />
      )}

      {/* Dynamic Dashboard Cards Grid - Uniform 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleCards.map((card) => renderCard(card.type))}
      </div>
    </div>
  )
}

export default DashboardPage
