import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import {
  auditService,
  type AuditEntry,
  type AuditQueryParams,
} from "@/services/auditService";
import { cn, formatDateTime } from "@/lib/utils";
import { UserRole } from "@/types";

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  { value: "all", label: "Todas as ações" },
  { value: "CREATE", label: "Criação" },
  { value: "UPDATE", label: "Atualização" },
  { value: "DELETE", label: "Exclusão" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "EXPORT", label: "Exportação" },
  { value: "IMPORT", label: "Importação" },
  { value: "VIEW", label: "Visualização" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "true", label: "Sucesso" },
  { value: "false", label: "Falha" },
] as const;

const ENTITY_OPTIONS = [
  { value: "all", label: "Todos os módulos" },
  { value: "auth", label: "Autenticação" },
  { value: "nugecid", label: "Desarquivamentos" },
  { value: "users", label: "Usuários" },
  { value: "dashboard", label: "Dashboard" },
  { value: "files", label: "Arquivos" },
] as const;

const summarizeDetails = (details: AuditEntry["details"]): string | null => {
  if (!details || typeof details !== "object") {
    return null;
  }

  const knownKeys = [
    "description",
    "message",
    "resource",
    "section",
    "nomeOriginal",
    "numeroProcesso",
    "numeroNicLaudoAuto",
  ] as const;

  for (const key of knownKeys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const AuditoriaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [action, setAction] =
    useState<(typeof ACTION_OPTIONS)[number]["value"]>("all");
  const [entityName, setEntityName] =
    useState<(typeof ENTITY_OPTIONS)[number]["value"]>("all");
  const [success, setSuccess] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");

  const normalizedRole = String(user?.role?.name ?? "").toLowerCase();
  const canAccessAudit =
    normalizedRole === UserRole.ADMIN ||
    normalizedRole === UserRole.COORDENADOR;

  const fetchAudits = useCallback(async () => {
    if (!canAccessAudit) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: AuditQueryParams = {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        action: action === "all" ? undefined : action,
        entityName: entityName === "all" ? undefined : entityName,
        success,
      };
      const response = await auditService.list(params);
      setItems(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (fetchError) {
      setError("Não foi possível carregar a auditoria do sistema.");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [action, canAccessAudit, entityName, page, search, success]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    void fetchAudits();
  }, [fetchAudits]);

  const stats = useMemo(() => {
    const successes = items.filter((item) => item.success).length;
    const failures = items.length - successes;
    const loginAttempts = items.filter(
      (item) => item.action === "LOGIN",
    ).length;

    return { successes, failures, loginAttempts };
  }, [items]);

  if (!canAccessAudit) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Activity className="h-4 w-4" />
              Rastreabilidade operacional
            </div>
            <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Eventos recentes de autenticação e alterações relevantes do
              sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={() => void fetchAudits()} disabled={loading}>
              <RefreshCw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eventos nesta página
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sucessos x falhas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm">
            <Badge className="bg-emerald-500/10 text-emerald-700">
              {stats.successes} sucesso
            </Badge>
            <Badge className="bg-red-500/10 text-red-700">
              {stats.failures} falha
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Logins nesta página
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.loginAttempts}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label
              htmlFor="audit-search"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="audit-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Usuário, IP ou módulo"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="audit-action"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Ação
            </label>
            <select
              id="audit-action"
              value={action}
              onChange={(event) => {
                setAction(
                  event.target
                    .value as (typeof ACTION_OPTIONS)[number]["value"],
                );
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="audit-entity"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Módulo
            </label>
            <select
              id="audit-entity"
              value={entityName}
              onChange={(event) => {
                setEntityName(
                  event.target
                    .value as (typeof ENTITY_OPTIONS)[number]["value"],
                );
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ENTITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="audit-success"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Status
            </label>
            <select
              id="audit-success"
              value={success}
              onChange={(event) => {
                setSuccess(
                  event.target
                    .value as (typeof STATUS_OPTIONS)[number]["value"],
                );
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Falha ao carregar auditoria</h3>
            <p>{error}</p>
          </div>
        </Alert>
      ) : null}

      <Card className="border-border/60 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Eventos recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Carregando eventos de auditoria...
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <p className="font-medium text-foreground">
                  Nenhum evento encontrado
                </p>
                <p>Tente ajustar os filtros para ampliar a busca.</p>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const summary = summarizeDetails(item.details);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.actionLabel}</Badge>
                        <Badge variant="secondary">{item.resourceLabel}</Badge>
                        <Badge
                          className={cn(
                            item.success
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-red-500/10 text-red-700",
                          )}
                        >
                          {item.success ? (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                          )}
                          {item.success ? "Sucesso" : "Falha"}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.user
                            ? `${item.user.nome} (${item.user.usuario})`
                            : "Usuário não identificado"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(item.timestamp)} ·{" "}
                          {formatDistanceToNow(new Date(item.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>

                      <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                        <p>
                          <span className="font-medium text-foreground">
                            Entidade:
                          </span>{" "}
                          {item.entityName}
                          {item.entityId ? ` #${item.entityId}` : ""}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            IP:
                          </span>{" "}
                          {item.ipAddress ?? "Não informado"}
                        </p>
                      </div>

                      {summary ? (
                        <p className="text-sm text-muted-foreground">
                          {summary}
                        </p>
                      ) : null}

                      {item.error ? (
                        <div className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
                          {item.error}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {!loading && total > 0 ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PAGE_SIZE}
          showItemsPerPage={false}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
};

export default AuditoriaPage;
