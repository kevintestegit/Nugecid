import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Clock,
  User as UserIcon,
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Paperclip,
  SendHorizontal,
  AlignLeft,
  Activity,
  History,
  Loader2,
  X,
  AtSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { PrioridadeBadge } from "./PrioridadeBadge";
import { Avatar, AvatarGroup } from "./Avatar";
import { ChecklistSection } from "./ChecklistSection";
import { SubtasksSection } from "./SubtasksSection";
import {
  kanbanService,
  Comentario as ComentarioApi,
} from "../../services/kanbanService";
import { Tarefa, Usuario } from "../../types/kanban.types";

type NormalizedComment = {
  id: number;
  conteudo: string;
  createdAt: string;
  usuario?: {
    id: number;
    nome?: string;
    usuario?: string;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
};

type NormalizedHistorico = {
  id: number;
  acao: string;
  campo?: string;
  de?: string | null;
  para?: string | null;
  createdAt?: string;
  usuarioId?: number;
};

interface TaskDetailModalProps {
  open: boolean;
  task: Tarefa | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
  onOpenTask?: (taskId: number) => void;
  openTaskLabel?: string;
  canStartTask?: boolean;
  onStartTask?: (task: Tarefa) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  task,
  onClose,
  onRefresh,
  onOpenTask,
  canStartTask = false,
  onStartTask,
}) => {
  const [comments, setComments] = useState<NormalizedComment[]>([]);
  const [history, setHistory] = useState<NormalizedHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Mentions state
  const [members, setMembers] = useState<Usuario[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colunaNome = task?.coluna?.nome;

  const responsaveis = task?.responsaveis?.length
    ? task.responsaveis
    : task?.responsavel
      ? [task.responsavel]
      : [];
  const criadorId = (() => {
    type LegacyCreator = { criador_id?: number };
    return (
      task?.criadorId ?? (task as unknown as LegacyCreator | null)?.criador_id
    );
  })();

  type CommentApi = ComentarioApi & {
    data_criacao?: string;
    created_at?: string;
    createdAt?: string;
    usuario?: ComentarioApi["usuario"];
    autor?: ComentarioApi["usuario"];
    user?: ComentarioApi["usuario"];
  };

  type HistoricoApi = {
    id: number;
    acao: string;
    campo_alterado?: string;
    campoAlterado?: string;
    valor_anterior?: string | null;
    valorAnterior?: string | null;
    valor_novo?: string | null;
    valorNovo?: string | null;
    data_acao?: string;
    createdAt?: string;
    usuarioId?: number;
    usuario_id?: number;
  };

  const getCommentAuthor = useCallback(
    (comment: CommentApi): NormalizedComment["usuario"] => {
      return comment.usuario ?? comment.autor ?? comment.user;
    },
    [],
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !task) return;
      setLoading(true);
      try {
        const [comentariosApi, historicoApi] = await Promise.all([
          kanbanService.getComentarios(task.id),
          kanbanService.getTarefaHistorico(task.id),
        ]);

        const normalizedComments: NormalizedComment[] = (
          comentariosApi || []
        ).map((comment: CommentApi) => ({
          id: comment.id,
          conteudo: comment.conteudo,
          createdAt:
            comment.data_criacao ||
            comment.created_at ||
            comment.createdAt ||
            new Date().toISOString(),
          usuario: getCommentAuthor(comment),
        }));
        setComments(normalizedComments);

        const normalizedHistorico: NormalizedHistorico[] = (
          historicoApi || []
        ).map((historyItem: HistoricoApi) => ({
          id: historyItem.id,
          acao: historyItem.acao,
          campo: historyItem.campo_alterado || historyItem.campoAlterado,
          de: historyItem.valor_anterior || historyItem.valorAnterior,
          para: historyItem.valor_novo || historyItem.valorNovo,
          createdAt: historyItem.data_acao || historyItem.createdAt,
          usuarioId: historyItem.usuarioId || historyItem.usuario_id,
        }));
        setHistory(normalizedHistorico);

        // Fetch members for mentions if project ID is available
        if (task.projetoId) {
          try {
            const projectMembers = await kanbanService.getProjetoMembros(
              task.projetoId,
            );
            const validUsers = projectMembers
              .map((m) => m.usuario)
              .filter((u): u is Usuario => !!u);
            setMembers(validUsers);
          } catch (error) {
            console.error("Erro ao carregar membros do projeto:", error);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes da tarefa", error);
        toast.error("Erro ao carregar detalhes da tarefa");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getCommentAuthor, open, task]);

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return;
    setSending(true);
    try {
      const novo = await kanbanService.createComentario({
        conteudo: commentText.trim(),
        tarefaId: task.id,
      });

      const autor = (novo as CommentApi).usuario ?? (novo as CommentApi).autor;

      const normalized: NormalizedComment = {
        id: novo.id,
        conteudo: novo.conteudo,
        createdAt:
          (novo as CommentApi).data_criacao ||
          (novo as CommentApi).createdAt ||
          new Date().toISOString(),
        usuario: autor,
      };
      setComments((prev) => [normalized, ...prev]);
      setCommentText("");
      await onRefresh?.();
    } catch (error) {
      console.error("Erro ao adicionar comentário", error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    // Simple mention detection: Check if cursor is after an '@'
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1) {
      const query = textBeforeCursor.slice(lastAt + 1);
      // Only show mentions if query doesn't contain spaces (simple assumption)
      if (!query.includes(" ") && query.length < 20) {
        setMentionQuery(query);
        return;
      }
    }
    setMentionQuery(null);
  };

  const insertMention = (user: Usuario) => {
    if (mentionQuery === null) return;

    // Find position of the @ being replaced
    const selectionStart =
      textareaRef.current?.selectionStart || commentText.length;
    const textBeforeCursor = commentText.slice(0, selectionStart);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1) {
      const prefix = commentText.slice(0, lastAt);
      const suffix = commentText.slice(selectionStart);
      const newText = `${prefix}@{${user.nome}} ${suffix}`;

      setCommentText(newText);
      setMentionQuery(null);

      // Attempt to focus back and set cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Optional: set cursor position
        }
      }, 0);
    }
  };

  const filteredMembers =
    mentionQuery !== null
      ? members.filter(
          (m) =>
            (m.nome ?? "").toLowerCase().includes(mentionQuery.toLowerCase()) ||
            (m.usuario ?? "")
              .toLowerCase()
              .includes(mentionQuery.toLowerCase()),
        )
      : [];

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] h-[90vh] !flex !flex-col !gap-0 !p-0 !overflow-visible bg-background sm:rounded-xl shadow-2xl border-0">
        {/* Header - Minimalist */}
        <div className="flex items-start justify-between p-6 pb-4 shrink-0 bg-background border-b border-border">
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 text-xs font-medium border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {colunaNome || "Sem status"}
              </div>
              <span className="text-gray-300">/</span>
              <span className="text-muted-foreground/70 font-mono text-xs">
                ID-{task.id}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground leading-tight">
              {task.titulo}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            {task && canStartTask && onStartTask && (
              <Button
                size="sm"
                onClick={() => onStartTask(task)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Iniciar
              </Button>
            )}
            {onOpenTask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenTask(task.id)}
                title="Abrir página da tarefa"
              >
                <MoreHorizontal className="w-5 h-5 text-muted-foreground/70" />
              </Button>
            )}
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        {/* Main Body - Two Columns */}
        <div className="flex-1 flex overflow-y-auto">
          {/* Left: Content & Activity (Scrollable) */}
          <div className="flex-1 custom-scrollbar p-8 pt-6 bg-background">
            <div className="max-w-3xl space-y-10">
              {/* Description */}
              <div className="group">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-muted-foreground/70" /> Descrição
                </h3>
                <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-line pl-0 min-h-[60px]">
                  {task.descricao || (
                    <span className="text-muted-foreground/70 italic">
                      Nenhuma descrição fornecida.
                    </span>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <ChecklistSection taskId={task.id} />

              {/* Subtasks */}
              <SubtasksSection
                parentTask={task}
                onRefresh={onRefresh || (() => {})}
                onOpenTask={(id) => onOpenTask?.(id)}
              />

              <hr className="border-border" />

              {/* Activity & Comments Stream */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground/70" /> Atividade
                  </h3>
                </div>

                {/* Comment Input */}
                <div className="relative flex gap-4 mb-10">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 font-semibold">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <div className="bg-background rounded-xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all overflow-hidden relative">
                      <Textarea
                        ref={textareaRef}
                        className="min-h-[100px] w-full border-0 focus:ring-0 focus-visible:ring-0 resize-y bg-transparent p-4 text-sm"
                        placeholder="Escreva um comentário... Use @ para mencionar"
                        value={commentText}
                        onChange={handleTextChange}
                      />
                      <div className="flex items-center justify-between px-3 pb-3 pt-2 bg-gray-50/30">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/70 hover:text-muted-foreground rounded-lg"
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/70 hover:text-muted-foreground rounded-lg"
                            onClick={() => setCommentText((prev) => prev + "@")}
                          >
                            <AtSign className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          disabled={sending || !commentText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 px-4"
                        >
                          {sending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          ) : (
                            <SendHorizontal className="w-3.5 h-3.5 mr-2" />
                          )}
                          Comentar
                        </Button>
                      </div>
                    </div>

                    {/* Mentions Dropdown */}
                    {mentionQuery !== null && filteredMembers.length > 0 && (
                      <div className="absolute left-0 bottom-full mb-2 w-64 bg-background rounded-lg shadow-xl border border-border overflow-hidden z-50">
                        <div className="p-2 border-b border-border bg-gray-50/50">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Membros
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                              onClick={() => insertMention(member)}
                            >
                              <Avatar usuario={member} size="xs" />
                              <span className="text-sm text-foreground/90">
                                {member.nome}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-px before:bg-gray-100">
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-12">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                    </div>
                  )}

                  {!loading &&
                    comments.map((c) => (
                      <div key={c.id} className="relative flex gap-4 group">
                        <div className="relative z-10 shrink-0">
                          <Avatar
                            usuario={c.usuario}
                            size="sm"
                            className="border-2 border-white shadow-sm w-10 h-10"
                          />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                              {c.usuario?.nome || "Usuário"}
                            </span>
                            <span className="text-xs text-muted-foreground/70">
                              {new Date(c.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/90 whitespace-pre-wrap bg-gray-50/50 p-3 rounded-lg rounded-tl-none border border-border/50">
                            {c.conteudo}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sidebar (Properties) */}
          <div className="w-[300px] bg-gray-50/30 border-l border-border">
            <div className="p-6 space-y-8">
              {/* Properties List */}
              <div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Status
                    </label>
                    <div className="">
                      <Badge
                        variant="secondary"
                        className="bg-background border border-border text-foreground/90 hover:bg-muted transition-colors font-normal py-1"
                      >
                        {colunaNome}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Prioridade
                    </label>
                    <div>
                      <PrioridadeBadge prioridade={task.prioridade} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5" /> Responsáveis
                    </label>
                    {responsaveis.length > 1 ? (
                      <div className="flex items-center gap-2">
                        <AvatarGroup
                          usuarios={responsaveis}
                          size="xs"
                          max={4}
                        />
                        <span className="text-sm text-foreground/90 truncate">
                          {responsaveis
                            .map((usuario) => usuario.nome)
                            .join(", ")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group cursor-pointer">
                        <Avatar usuario={responsaveis[0]} size="xs" />
                        <span className="text-sm text-foreground/90 truncate group-hover:text-blue-600 transition-colors">
                          {responsaveis[0]?.nome || "Não atribuído"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Prazo
                    </label>
                    <div className="">
                      {task.prazo ? (
                        <div className="flex items-center gap-1.5 text-sm text-foreground/90">
                          <span>
                            {new Date(task.prazo).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/70 italic">
                          Sem prazo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="pt-6 border-t border-border/50">
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="px-2 py-0.5 text-xs bg-background text-muted-foreground border-border"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact History */}
              <div className="pt-6 border-t border-border/50">
                <h4 className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" /> Histórico
                </h4>
                <div className="space-y-4">
                  {history.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex gap-3 relative">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          <span className="font-medium text-gray-800">
                            {h.acao}
                          </span>
                          {h.campo && (
                            <span className="text-muted-foreground"> {h.campo}</span>
                          )}
                        </p>
                        <span className="text-[10px] text-muted-foreground/70">
                          {new Date(h.createdAt || Date.now()).toLocaleString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      Sem histórico recente.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <div className="text-[10px] text-muted-foreground/70 flex flex-col gap-1">
                  <span>Criado por #{criadorId}</span>
                  <span>
                    Em{" "}
                    {new Date(
                      task.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
