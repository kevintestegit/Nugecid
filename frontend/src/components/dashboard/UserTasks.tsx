import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckSquare, AlertCircle, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { UserTask } from "@/hooks/useUserTasks";
import { Avatar, AvatarGroup } from "@/components/kanban/Avatar";
import { useAuth } from "@/contexts/AuthContext";

interface UserTasksProps {
  tasks: UserTask[];
  isLoading?: boolean;
}

const UserTasks: React.FC<UserTasksProps> = ({ tasks, isLoading = false }) => {
  const [activeTab, setActiveTab] = useState<
    "all" | "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
  >("all");
  const { user } = useAuth();
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDENTE: "Pendente",
      EM_ANDAMENTO: "Em andamento",
      CONCLUIDA: "Concluída",
      CANCELADA: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60";
      case "EM_ANDAMENTO":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/60";
      case "CONCLUIDA":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/60 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/60";
      case "CANCELADA":
        return "bg-gray-100 text-gray-800 border-border";
      default:
        return "bg-gray-100 text-gray-800 border-border";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "URGENTE":
        return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 dark:bg-red-950/30 dark:text-red-300";
      case "ALTA":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300 dark:bg-orange-950/30 dark:text-orange-300";
      case "MEDIA":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-300";
      case "BAIXA":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      URGENTE: "Urgente",
      ALTA: "Alta",
      MEDIA: "Média",
      BAIXA: "Baixa",
    };
    return labels[prioridade] || prioridade;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isPastDue = (prazo: string) => {
    return new Date(prazo) < new Date();
  };

  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.status !== "CANCELADA"),
    [tasks],
  );
  const activeTasks = useMemo(
    () => visibleTasks.filter((t) => t.status !== "CONCLUIDA"),
    [visibleTasks],
  );
  const filteredTasks = useMemo(() => {
    if (activeTab === "all") {
      return activeTasks;
    }
    return visibleTasks.filter((task) => task.status === activeTab);
  }, [activeTab, activeTasks, visibleTasks]);

  const hasAnyTasks = visibleTasks.length > 0;

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/10 dark:ring-white/5 shadow-sm backdrop-blur">
              <CheckSquare className="h-4 w-4 text-primary" />
            </span>
            Minhas Tarefas
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/80">
            Tarefas atribuídas a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 p-4 border rounded-xl animate-pulse bg-background"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/40 rounded w-2/3"></div>
                  <div className="h-3 bg-muted/40 rounded w-1/2"></div>
                  <div className="h-3 bg-muted/40 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-8 bg-muted/40 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/10 dark:ring-white/5 shadow-sm backdrop-blur">
                <CheckSquare className="h-4 w-4 text-primary" />
              </span>
              Minhas Tarefas
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80">
              {activeTasks.length}{" "}
              {activeTasks.length === 1 ? "tarefa ativa" : "tarefas ativas"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/tarefas"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex gap-4 border-b border-border/50 pt-3 text-xs font-medium text-muted-foreground">
          {[
            { key: "all", label: "Todas" },
            { key: "PENDENTE", label: "A Fazer" },
            { key: "EM_ANDAMENTO", label: "Em Progresso" },
            { key: "CONCLUIDA", label: "Concluídas" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "pb-3 transition-colors",
                activeTab === tab.key
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnyTasks ? (
          <div className="py-10 text-center text-muted-foreground">
            <CheckSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm">Você não tem tarefas pendentes.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma tarefa encontrada para este filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/45 bg-background/70 p-4 transition-colors hover:border-border/70 hover:bg-muted/35"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] uppercase",
                        getPrioridadeColor(task.prioridade),
                      )}
                    >
                      {getPrioridadeLabel(task.prioridade)}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(task.prazo)}
                    </span>
                    {isPastDue(task.prazo) && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Atrasada
                      </span>
                    )}
                  </div>
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {task.titulo}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {task.projeto && (
                      <span className="flex items-center rounded-full border border-border/70 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        {task.projeto.nome}
                      </span>
                    )}
                    {(() => {
                      const responsaveis = task.responsaveis?.length
                        ? task.responsaveis
                        : task.responsavel
                          ? [task.responsavel]
                          : user
                            ? [
                                {
                                  id: user.id,
                                  nome: user.nome,
                                  avatar: user.avatar ?? undefined,
                                  avatarUrl: user.avatarUrl,
                                },
                              ]
                            : [];
                      if (!responsaveis.length) return null;
                      const normalized = responsaveis.map((responsavel) => ({
                        ...responsavel,
                        usuario: responsavel.nome,
                      }));
                      return responsaveis.length > 1 ? (
                        <AvatarGroup usuarios={normalized} size="xs" max={3} />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-border/70">
                          <Avatar
                            usuario={normalized[0]}
                            size="xs"
                            showTooltip={false}
                          />
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      to={`/tarefas/${task.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 transition-colors hover:border-border"
                    >
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTasks.length > 5 && (
          <div className="mt-4 border-t border-border/60 pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link
                to="/tarefas"
                className="flex items-center justify-center gap-2"
              >
                Ver todas as tarefas ({filteredTasks.length})
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserTasks;
