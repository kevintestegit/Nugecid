import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useUserTasks } from "@/hooks/useUserTasks";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { PageLoading } from "@/components/ui/Loading";
import { SkeletonStatsCard, Skeleton } from "@/components/ui/Skeleton";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import SystemInfo from "@/components/dashboard/SystemInfo";
import UserTasks from "@/components/dashboard/UserTasks";
import PrazosCalendar from "@/components/dashboard/PrazosCalendar";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { AnnouncementModal } from "@/components/announcements/AnnouncementModal";
import { Sun, Moon, AlertTriangle, Users, User, Settings2 } from "lucide-react";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats();
  const {
    data: onlineUsers,
    isLoading: loadingOnline,
    error: errorOnline,
  } = useOnlineUsers();
  const { data: userTasks, isLoading: loadingTasks } = useUserTasks();
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  const {
    visibleCards,
    cards,
    isCustomizing,
    setIsCustomizing,
    toggleCardVisibility,
    moveCardUp,
    moveCardDown,
    resetLayout,
  } = useDashboardLayout();

  // Preparar dados de prazos para o calendário (ANTES dos returns condicionais)
  const prazosData = React.useMemo(() => {
    if (!stats?.data?.recentes) return [];

    return stats.data.recentes
      .filter((item) => item.dataDevolucaoSetor || item.createdAt)
      .map((item) => ({
        id: item.id,
        titulo: `#${item.id} - ${item.nomeCompleto?.substring(0, 30)}...`,
        data: item.dataDevolucaoSetor || item.createdAt,
        tipo: item.dataDevolucaoSetor
          ? ("devolucao" as const)
          : ("solicitacao" as const),
        urgente: item.urgente || false,
      }));
  }, [stats?.data?.recentes]);

  const getTimeAgo = (lastActivity: string) => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "agora mesmo";
    if (diffMins === 1) return "há 1 minuto";
    if (diffMins < 60) return `há ${diffMins} minutos`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "há 1 hora";
    if (diffHours < 24) return `há ${diffHours} horas`;

    return "há mais de 1 dia";
  };

  // Returns condicionais DEPOIS de todos os hooks
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" width={48} height={48} />
              <div className="space-y-2">
                <Skeleton variant="text" width={200} height={28} />
                <Skeleton variant="text" width={350} height={18} />
              </div>
            </div>
            <Skeleton variant="rounded" width={140} height={40} />
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStatsCard key={i} />
          ))}
        </div>
      </div>
    );
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
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Bom dia", icon: Sun };
    if (hour < 18) return { text: "Boa tarde", icon: Sun };
    return { text: "Boa noite", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const renderCard = (cardType: string) => {
    switch (cardType) {
      case "stats":
        return (
          <DashboardStats
            key="stats"
            data={{
              total: stats?.data?.totalDesarquivamentos || 0,
              pendentes:
                stats?.data.pendentesAtrasados ??
                stats?.data.requisicoesPendentes ??
                stats?.data.atendimentosPendentes ??
                0,
              urgentes: stats?.data?.urgentes || 0,
              porTipo: stats?.data?.porTipo || {},
              porStatus: stats?.data?.porStatus || {},
              porInstituto: stats?.data?.porInstituto || {},
              recentes: stats?.data.recentes || [],
              totalMesAnterior: stats?.data?.totalMesAnterior,
              totalEsteMes: stats?.data?.requisicoesEsteMes,
              pendentesMesAnterior: stats?.data?.pendentesMesAnterior,
            }}
            isLoading={isLoading}
          />
        );

      case "quick-actions":
        return <QuickActions key="quick-actions" />;

      case "tasks":
        return (
          <UserTasks
            key="tasks"
            tasks={userTasks || []}
            isLoading={loadingTasks}
          />
        );

      case "activity":
        return (
          <RecentActivity
            key="activity"
            activities={stats?.data.recentes || []}
            isLoading={isLoading}
          />
        );

      case "calendar":
        return (
          <PrazosCalendar
            key="calendar"
            prazos={prazosData}
            isLoading={isLoading}
          />
        );

      case "online-users":
        return (
          <div
            key="online-users"
            className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.8)] backdrop-blur"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-500/10 to-transparent" />
            <div className="relative mb-6 flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/25">
                <Users className="h-5 w-5 text-green-600" />
                {onlineUsers && onlineUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {onlineUsers.length}
                      </span>
                    </span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Usuários Online
                </h3>
                <p className="text-xs text-foreground/60">
                  Presença da equipe em tempo real
                </p>
              </div>
            </div>

            {loadingOnline ? (
              <div className="flex items-center gap-3 text-foreground/70">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm font-medium">Carregando...</span>
              </div>
            ) : errorOnline ? (
              <p className="text-sm text-destructive font-medium">
                Erro ao carregar usuários online
              </p>
            ) : onlineUsers && onlineUsers.length > 0 ? (
              <div className="space-y-3">
                {onlineUsers.slice(0, 5).map((onlineUser) => (
                  <div
                    key={onlineUser.id}
                    className="flex items-start gap-3 rounded-xl border border-border/35 bg-background/65 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/45"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden">
                        {onlineUser.avatarUrl || onlineUser.avatar ? (
                          <img
                            src={
                              onlineUser.avatarUrl ??
                              onlineUser.avatar ??
                              undefined
                            }
                            alt={onlineUser.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary capitalize shrink-0 ring-1 ring-primary/20">
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
              <p className="text-sm text-foreground/70 font-medium text-center py-4">
                Nenhum usuário online
              </p>
            )}
          </div>
        );

      case "system-info":
        return <SystemInfo key="system-info" isLoading={isLoading} />;

      default:
        return null;
    }
  };

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(140%_95%_at_10%_8%,rgba(56,189,248,0.24),transparent_55%),radial-gradient(120%_85%_at_90%_12%,rgba(249,115,22,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0))] dark:bg-[radial-gradient(140%_95%_at_10%_8%,rgba(14,116,144,0.28),transparent_55%),radial-gradient(120%_85%_at_90%_12%,rgba(194,65,12,0.2),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.8)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5">
            <span className="inline-flex items-center px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
              painel operacional
            </span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <GreetingIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight md:text-3xl">
                  {greeting.text}, {user?.nome}!
                </h1>
                <p className="text-foreground/70 text-sm md:text-base">
                  Bem-vindo ao Sistema de Gerenciamento Eletrônico de Documentos
                  - GED
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCustomizing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Settings2 className="h-4 w-4" />
            Personalizar painel
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

      {/* Dynamic Dashboard Cards Grid - 60/40 split on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="space-y-6 md:col-span-3">
          {visibleCards
            .filter(
              (card) =>
                !["quick-actions", "calendar", "online-users"].includes(
                  card.type,
                ),
            )
            .map((card) => (
              <div
                key={card.id}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
              >
                {renderCard(card.type)}
              </div>
            ))}
        </div>
        <div className="space-y-6 md:col-span-2">
          {visibleCards
            .filter((card) =>
              ["quick-actions", "calendar", "online-users"].includes(card.type),
            )
            .map((card) => (
              <div
                key={card.id}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
              >
                {renderCard(card.type)}
              </div>
            ))}
        </div>
      </div>

      {/* System Announcements Modal */}
      {showAnnouncements && (
        <AnnouncementModal onClose={() => setShowAnnouncements(false)} />
      )}
    </div>
  );
};

export default DashboardPage;
