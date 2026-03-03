import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageCircle,
  Paperclip,
  MoreHorizontal,
  Flag,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Tarefa } from "../../types/kanban.types";
import { Avatar, AvatarGroup } from "./Avatar";
import { PrazoBadge } from "./PrazoBadge";
import { TagList } from "./TagBadge";
import { getPrioridadeCor } from "../../utils/kanbanHelpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KanbanCardProps {
  tarefa: Tarefa;
  onClick?: (tarefa: Tarefa) => void;
  onEdit?: (tarefa: Tarefa) => void;
  onDelete?: (tarefaId: number) => void;
  density?: "comfortable" | "compact";
}

export type { Tarefa } from "../../types/kanban.types";

export const KanbanCard: React.FC<KanbanCardProps> = ({
  tarefa,
  onClick,
  onEdit,
  onDelete,
  density = "comfortable",
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tarefa.id,
    data: {
      type: "tarefa",
      tarefa,
      colunaId: tarefa.colunaId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const comentariosCount = tarefa.comentarios?.length || 0;
  const anexosCount = tarefa.anexos?.length || 0;
  const responsaveis = tarefa.responsaveis?.length
    ? tarefa.responsaveis
    : tarefa.responsavel
      ? [tarefa.responsavel]
      : [];

  const getPriorityStyles = (prioridade: string) => {
    switch (prioridade.toLowerCase()) {
      case "alta":
      case "critica":
        return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 dark:bg-red-950/30 dark:text-red-300 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50";
      case "media":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50";
      case "baixa":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none group",
        isDragging && "opacity-50 scale-105 z-50",
      )}
    >
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/70 dark:hover:bg-gray-900/80 transition-colors cursor-pointer relative",
          density === "compact" ? "p-3" : "p-4",
          isDragging ? "rotate-2" : "",
        )}
        onClick={() => onClick?.(tarefa)}
      >
        {/* Header: Priority & More Options */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2">
            <span
              className={cn(
                "rounded text-[10px] font-semibold uppercase border",
                density === "compact" ? "px-1.5 py-0.5" : "px-2 py-0.5",
                getPriorityStyles(tarefa.prioridade),
              )}
            >
              {tarefa.prioridade}
            </span>
          </div>
          <button
            className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(tarefa);
            }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Tags */}
        {tarefa.tags && tarefa.tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            <TagList tags={tarefa.tags} max={3} size="xs" variant="modern" />
          </div>
        )}

        {/* Title */}
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 leading-snug">
          {tarefa.titulo}
        </h4>

        {/* Description */}
        {tarefa.descricao && (
          <p
            className={cn(
              "text-xs text-gray-600 dark:text-gray-400 line-clamp-2",
              density === "compact" ? "mb-3" : "mb-4",
            )}
          >
            {tarefa.descricao}
          </p>
        )}

        {/* Footer: Users & Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Users/Avatar */}
          <div className="flex -space-x-2">
            {responsaveis.length > 1 ? (
              <AvatarGroup usuarios={responsaveis} size="xs" max={3} />
            ) : (
              responsaveis[0] && (
                <div className="border-2 border-white dark:border-gray-900 rounded-full">
                  <Avatar usuario={responsaveis[0]} size="xs" />
                </div>
              )
            )}
          </div>

          {/* Stats/Icons */}
          <div className="flex items-center gap-3 text-gray-400 text-xs">
            {tarefa.prazo && (
              <div
                className={cn(
                  "flex items-center gap-1 hover:text-muted-foreground",
                  new Date(tarefa.prazo) < new Date() ? "text-red-500" : "",
                )}
              >
                <Flag size={14} />
                <span>
                  {format(new Date(tarefa.prazo), "dd MMM", { locale: ptBR })}
                </span>
              </div>
            )}

            {comentariosCount > 0 && (
              <div className="flex items-center gap-1 hover:text-muted-foreground">
                <MessageCircle size={14} />
                <span>{comentariosCount}</span>
              </div>
            )}

            {anexosCount > 0 && (
              <div className="flex items-center gap-1 hover:text-muted-foreground">
                <Paperclip size={14} />
                <span>{anexosCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
