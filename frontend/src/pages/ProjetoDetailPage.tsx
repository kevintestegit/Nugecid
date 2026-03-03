import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Avatar, AvatarGroup } from "@/components/kanban/Avatar";
import { ProjectMembersModal } from "@/components/kanban/ProjectMembersModal";
import { kanbanService } from "@/services/kanbanService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Users,
  Columns,
  ListChecks,
  ArrowLeft,
  LayoutGrid,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ApiUser = {
  id: number;
  nome?: string;
  usuario?: string;
  avatarUrl?: string | null;
  avatar?: string | null;
};

type ApiMembroProjeto = {
  id: number;
  usuarioId: number;
  papel: "admin" | "editor" | "viewer";
  usuario?: ApiUser;
};

type ApiColuna = {
  id: number;
  nome: string;
  ordem?: number;
  cor?: string;
  limite_wip?: number;
  wipLimit?: number;
};

type ApiTarefa = {
  id: number;
  prioridade?: "baixa" | "media" | "alta" | "critica";
  prazo?: string;
};

type ProjetoDetalhado = {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  ativo?: boolean;
  membros?: ApiMembroProjeto[];
  colunas?: ApiColuna[];
  tarefas?: ApiTarefa[];
};

const safeDate = (date?: string, fallback = "Data indisponivel") => {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, "d 'de' MMMM, yyyy", { locale: ptBR });
};

const ProjetoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, checkPermission } = useAuth();

  const [projeto, setProjeto] = useState<ProjetoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const projetoId = useMemo(() => {
    const parsed = id ? Number(id) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [id]);

  const loadProjeto = useCallback(async () => {
    if (!projetoId) {
      setError("ID do projeto inválido.");
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setError("Você precisa estar autenticado para acessar projetos.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await kanbanService.getProjeto(projetoId);
      setProjeto(data as ProjetoDetalhado);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar projeto.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, projetoId]);

  useEffect(() => {
    loadProjeto();
  }, [loadProjeto]);

  const members = useMemo(() => {
    const list = projeto?.membros ?? [];
    return list
      .map((membro) => membro.usuario)
      .filter((usuario): usuario is ApiUser => !!usuario)
      .map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome ?? usuario.usuario ?? `#${usuario.id}`,
        usuario: usuario.usuario ?? "",
        avatar: usuario.avatar ?? usuario.avatarUrl ?? undefined,
      }));
  }, [projeto?.membros]);

  const stats = useMemo(() => {
    const tarefas = projeto?.tarefas ?? [];
    const colunas = projeto?.colunas ?? [];
    const now = new Date();

    const overdue = tarefas.filter((tarefa) => {
      if (!tarefa.prazo) return false;
      const date = new Date(tarefa.prazo);
      return !Number.isNaN(date.getTime()) && date < now;
    }).length;

    const prioridades = tarefas.reduce(
      (acc, tarefa) => {
        const priority = tarefa.prioridade ?? "media";
        acc[priority] += 1;
        return acc;
      },
      { baixa: 0, media: 0, alta: 0, critica: 0 },
    );

    return {
      totalTarefas: tarefas.length,
      totalColunas: colunas.length,
      totalMembros: members.length,
      overdue,
      prioridades,
    };
  }, [members.length, projeto?.colunas, projeto?.tarefas]);

  if (loading) {
    return (
      <div className="relative space-y-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
        </div>
        <Card className="border-border/60 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Carregando projeto...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-6 w-48 rounded bg-muted animate-pulse mb-2" />
            <div className="h-4 w-64 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative space-y-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
        </div>
        <Alert variant="destructive">
          <h3 className="font-semibold">Erro ao carregar projeto</h3>
          <p>{error}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => navigate("/projetos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
            <Button onClick={loadProjeto}>Tentar novamente</Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="relative space-y-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
        </div>
        <Alert>
          <h3 className="font-semibold">Projeto não encontrado</h3>
          <p>Não foi possível localizar o projeto solicitado.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/projetos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const createdAt =
    projeto.createdAt || projeto.created_at || projeto.data_criacao;
  const updatedAt =
    projeto.updatedAt || projeto.updated_at || projeto.data_atualizacao;

  return (
    <div className="relative space-y-6">
      {/* Radial gradient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative">
          <div className="text-sm text-muted-foreground mb-4">
            <button
              onClick={() => navigate("/projetos")}
              className="hover:text-foreground transition-colors"
            >
              Projetos
            </button>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{projeto.nome}</span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {projeto.nome}
              </h1>
              <p className="text-muted-foreground mt-1">
                {projeto.descricao ||
                  "Sem descrição adicionada para este projeto."}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Criado em {safeDate(createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Atualizado em {safeDate(updatedAt)}
                </div>
                {projeto.ativo === false && (
                  <Badge variant="secondary">Arquivado</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/projetos")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/kanban/${projeto.id}`)}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Abrir quadro
              </Button>
              {checkPermission("update", "projetos") && (
                <Button onClick={() => setShowMembers(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Membros
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Tarefas"
          value={stats.totalTarefas}
          icon={<ListChecks className="w-4 h-4" />}
        />
        <StatsCard
          title="Colunas"
          value={stats.totalColunas}
          icon={<Columns className="w-4 h-4" />}
        />
        <StatsCard
          title="Membros"
          value={stats.totalMembros}
          icon={<Users className="w-4 h-4" />}
        />
        <StatsCard
          title="Atrasadas"
          value={stats.overdue}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <CardHeader>
            <CardTitle>Prioridades</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span>Critica</span>
              <span className="font-semibold text-red-600">
                {stats.prioridades.critica}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span>Alta</span>
              <span className="font-semibold text-orange-600">
                {stats.prioridades.alta}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span>Media</span>
              <span className="font-semibold text-yellow-600">
                {stats.prioridades.media}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span>Baixa</span>
              <span className="font-semibold text-green-600">
                {stats.prioridades.baixa}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length > 0 ? (
              <>
                <AvatarGroup usuarios={members} max={6} size="sm" />
                <div className="space-y-2">
                  {members.slice(0, 4).map((membro) => (
                    <div key={membro.id} className="flex items-center gap-3">
                      <Avatar usuario={membro} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {membro.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{membro.usuario}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum membro cadastrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <CardHeader>
          <CardTitle>Colunas do projeto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {(projeto.colunas ?? []).length > 0 ? (
            (projeto.colunas ?? []).map((coluna) => (
              <div
                key={coluna.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="text-sm font-medium">{coluna.nome}</span>
                {coluna.limite_wip || coluna.wipLimit ? (
                  <Badge variant="secondary">
                    WIP {coluna.limite_wip ?? coluna.wipLimit}
                  </Badge>
                ) : (
                  <Badge variant="outline">Sem WIP</Badge>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma coluna configurada.
            </p>
          )}
        </CardContent>
      </Card>

      <ProjectMembersModal
        open={showMembers}
        projetoId={projeto.id}
        initialMembers={projeto.membros}
        onClose={() => setShowMembers(false)}
        onChanged={loadProjeto}
      />
    </div>
  );
};

export default ProjetoDetailPage;
