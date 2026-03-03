import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  Clock,
  Filter,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/utils/cn";
import { useNotificacoesStore } from "@/store/notificacoesStore";
import {
  notificacoesService,
  Notificacao,
  NotificacoesResponse,
} from "@/services/notificacoesService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "@/components/ui";
import Pagination from "@/components/ui/Pagination";

// --- Constants ---

const TIPOS_NOTIFICACAO: Record<string, string> = {
  solicitacao_pendente: "Solicitação Pendente",
  novo_processo: "Novo Processo",
  novo_desarquivamento: "Novo Desarquivamento",
  mencao: "Menção",
  tarefa_atribuida: "Tarefa Atribuída",
  tarefa_alterada: "Tarefa Alterada",
  tarefa_comentada: "Comentário",
  prazo_proximo: "Prazo Próximo",
  tarefa_atrasada: "Tarefa Atrasada",
  projeto_atualizado: "Projeto Atualizado",
  novo_registro: "Novo Registro",
  pasta_criada: "Pasta Criada",
  evento_auditoria: "Auditoria",
};

const PRIORIDADES: Record<string, { label: string; color: string }> = {
  critica: {
    label: "Crítica",
    color: "bg-red-500/10 text-red-700 border-red-200",
  },
  alta: {
    label: "Alta",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
  media: {
    label: "Média",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  },
  baixa: {
    label: "Baixa",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
};

const PAGE_SIZE = 20;

// --- Component ---

const NotificacoesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useNotificacoesStore();

  // Local state for the paginated history view
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filtroLida, setFiltroLida] = useState<string>("todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("todas");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingNotificationId, setPendingNotificationId] = useState<
    number | null
  >(null);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const value = searchParams.get("notificacaoId");
    const parsed = value ? Number(value) : NaN;

    if (Number.isFinite(parsed) && parsed > 0) {
      setPendingNotificationId(parsed);
    }
  }, [searchParams]);

  // --- Data fetching ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: PAGE_SIZE,
      };
      if (filtroLida === "lidas") params.lida = true;
      if (filtroLida === "nao_lidas") params.lida = false;
      if (filtroTipo !== "todos") params.tipo = filtroTipo;
      if (filtroPrioridade !== "todas") params.prioridade = filtroPrioridade;

      const response: NotificacoesResponse = await store.fetchNotificacoes(
        params as Parameters<typeof store.fetchNotificacoes>[0],
      );
      setNotificacoes(Array.isArray(response.data) ? response.data : []);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch {
      setError("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }, [page, filtroLida, filtroTipo, filtroPrioridade, store]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pendingNotificationId) {
      return;
    }

    let cancelled = false;
    let clearHighlightTimeout: number | undefined;

    const focusNotification = async () => {
      const targetId = pendingNotificationId;
      let found = notificacoes.some((item) => item.id === targetId);

      if (!found) {
        try {
          const fetched = await notificacoesService.buscarPorId(targetId);
          if (cancelled) {
            return;
          }
          setNotificacoes((prev) => {
            if (prev.some((item) => item.id === fetched.id)) {
              return prev;
            }
            return [fetched, ...prev];
          });
          found = true;
        } catch {
          // Se não for possível buscar por ID, seguimos sem destaque.
        }
      }

      if (!cancelled && found) {
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          setHighlightedNotificationId(targetId);
          const targetElement = document.getElementById(
            `notificacao-item-${targetId}`,
          );
          targetElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);

        clearHighlightTimeout = window.setTimeout(() => {
          if (!cancelled) {
            setHighlightedNotificationId(null);
          }
        }, 3200);
      }

      if (!cancelled) {
        const params = new URLSearchParams(searchParams);
        params.delete("notificacaoId");
        setSearchParams(params, { replace: true });
        setPendingNotificationId(null);
      }
    };

    void focusNotification();

    return () => {
      cancelled = true;
      if (clearHighlightTimeout) {
        window.clearTimeout(clearHighlightTimeout);
      }
    };
  }, [
    notificacoes,
    pendingNotificationId,
    searchParams,
    setSearchParams,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filtroLida, filtroTipo, filtroPrioridade]);

  // --- Handlers ---

  const handleMarcarComoLida = async (id: number) => {
    await store.marcarComoLida(id);
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
    );
  };

  const handleMarcarTodasComoLidas = async () => {
    await store.marcarTodasComoLidas();
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    setSelectedIds(new Set());
  };

  const handleExcluir = async (id: number) => {
    await store.excluirNotificacao(id);
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkMarkRead = async () => {
    for (const id of selectedIds) {
      await store.marcarComoLida(id);
    }
    setNotificacoes((prev) =>
      prev.map((n) => (selectedIds.has(n.id) ? { ...n, lida: true } : n)),
    );
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await store.excluirNotificacao(id);
    }
    setNotificacoes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setTotal((prev) => Math.max(0, prev - selectedIds.size));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notificacoes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notificacoes.map((n) => n.id)));
    }
  };

  const handleNotificationClick = (notificacao: Notificacao) => {
    const destination = getDestination(notificacao);
    if (!destination) return;
    if (!notificacao.lida) {
      handleMarcarComoLida(notificacao.id);
    }
    navigate(destination);
  };

  // --- Helpers ---

  const getDestination = (n: Notificacao): string | null => {
    if (n.link) return n.link;
    if (n.processoId) return `/desarquivamentos/${n.processoId}`;
    if (n.solicitacaoId) return `/desarquivamentos/${n.solicitacaoId}`;
    if (n.tarefaId) return `/tarefas/${n.tarefaId}`;
    return null;
  };

  const getIcon = (tipo: string, prioridade: string) => {
    const t = tipo?.toLowerCase();
    const p = prioridade?.toLowerCase();
    const iconClass = cn(
      "h-5 w-5 flex-shrink-0",
      p === "critica" && "text-red-500",
      p === "alta" && "text-orange-500",
      p === "media" && "text-yellow-500",
      p === "baixa" && "text-blue-500",
    );
    switch (t) {
      case "solicitacao_pendente":
      case "prazo_proximo":
      case "tarefa_atrasada":
        return <Clock className={iconClass} />;
      case "novo_processo":
      case "novo_registro":
      case "novo_desarquivamento":
        return <Info className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  const getPriorityBorder = (prioridade: string) => {
    switch (prioridade?.toLowerCase()) {
      case "critica":
        return "border-l-red-500";
      case "alta":
        return "border-l-orange-500";
      case "media":
        return "border-l-yellow-500";
      case "baixa":
        return "border-l-blue-500";
      default:
        return "border-l-border";
    }
  };

  // --- Render ---

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de notificações com filtros e ações em lote
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {store.sseConnected && (
              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                Tempo real
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData()}
              disabled={loading}
              className="border-border/60 bg-background/70 backdrop-blur"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Atualizar
            </Button>
            {store.totalNaoLidas > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarcarTodasComoLidas}
                className="border-border/60 bg-background/70 backdrop-blur"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="relative z-10 overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        <CardContent className="py-4 relative">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Filtros:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Select value={filtroLida} onValueChange={setFiltroLida}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="nao_lidas">Não lidas</SelectItem>
                  <SelectItem value="lidas">Lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tipo:</span>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(TIPOS_NOTIFICACAO).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Prioridade:</span>
              <Select
                value={filtroPrioridade}
                onValueChange={setFiltroPrioridade}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {Object.entries(PRIORIDADES).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto text-xs text-muted-foreground">
              {total} notificação{total !== 1 ? "ões" : ""} encontrada
              {total !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 backdrop-blur shadow-sm">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selecionada{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkMarkRead}
            className="border-primary/20 bg-background/60 hover:bg-primary/10 hover:text-primary"
          >
            <Check className="mr-1 h-3 w-3" />
            Marcar como lidas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="text-red-600 hover:text-red-700 border-red-200 bg-background/60 hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Excluir selecionadas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Notification list */}
      <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        <CardContent className="p-0 relative">
          {loading && notificacoes.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Carregando notificações...
              </span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => fetchData()}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && notificacoes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma notificação encontrada
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                Tente ajustar os filtros ou volte mais tarde.
              </p>
            </div>
          )}

          {notificacoes.length > 0 && (
            <>
              {/* Select all header */}
              <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2">
                <Checkbox
                  checked={
                    selectedIds.size === notificacoes.length &&
                    notificacoes.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas"
                />
                <span className="text-xs text-muted-foreground">
                  Selecionar todas nesta página
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-border/60">
                {notificacoes.map((notificacao) => {
                  const destination = getDestination(notificacao);
                  const isClickable = Boolean(destination);
                  const timeAgo = formatDistanceToNow(
                    new Date(notificacao.createdAt),
                    { addSuffix: true, locale: ptBR },
                  );
                  const dateStr = format(
                    new Date(notificacao.createdAt),
                    "dd/MM/yyyy HH:mm",
                    { locale: ptBR },
                  );

                  return (
                    <div
                      key={notificacao.id}
                      id={`notificacao-item-${notificacao.id}`}
                      className={cn(
                        "flex items-start gap-3 border-l-4 px-4 py-3 transition-colors",
                        getPriorityBorder(notificacao.prioridade),
                        !notificacao.lida && "bg-blue-500/5",
                        isClickable && "cursor-pointer hover:bg-muted/40",
                        highlightedNotificationId === notificacao.id &&
                          "bg-primary/10 ring-1 ring-primary/30",
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.has(notificacao.id)}
                        onCheckedChange={() => toggleSelect(notificacao.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        aria-label={`Selecionar notificação ${notificacao.titulo}`}
                      />

                      <div
                        className="flex flex-1 items-start gap-3 min-w-0"
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onClick={() =>
                          isClickable && handleNotificationClick(notificacao)
                        }
                        onKeyDown={(e) => {
                          if (!isClickable) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNotificationClick(notificacao);
                          }
                        }}
                      >
                        {getIcon(notificacao.tipo, notificacao.prioridade)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                "truncate text-sm text-foreground",
                                !notificacao.lida
                                  ? "font-semibold"
                                  : "font-medium",
                              )}
                            >
                              {notificacao.titulo}
                            </h4>
                            {!notificacao.lida && (
                              <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                                Nova
                              </Badge>
                            )}
                          </div>

                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {notificacao.descricao}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                PRIORIDADES[
                                  notificacao.prioridade?.toLowerCase()
                                ]?.color,
                              )}
                            >
                              {PRIORIDADES[
                                notificacao.prioridade?.toLowerCase()
                              ]?.label || notificacao.prioridade}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {TIPOS_NOTIFICACAO[
                                notificacao.tipo?.toLowerCase()
                              ] || notificacao.tipo}
                            </Badge>

                            <span
                              className="text-[11px] text-muted-foreground"
                              title={dateStr}
                            >
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notificacao.lida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarcarComoLida(notificacao.id);
                            }}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                            title="Marcar como lida"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluir(notificacao.id);
                          }}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Excluir notificação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default NotificacoesPage;
