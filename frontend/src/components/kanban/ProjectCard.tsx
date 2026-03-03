import React from "react";
import {
  MoreHorizontal,
  Users,
  Star,
  Archive,
  Trash2,
  Edit,
  Info,
  Clock,
  CheckCircle2,
  Columns,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProjectCardProps {
  projeto: {
    id: number;
    nome: string;
    descricao?: string;
    cor?: string;
    data_criacao?: string;
    data_atualizacao?: string;
    ativo: boolean;
    favorito?: boolean;
    total_tarefas?: number;
    total_membros?: number;
    progresso?: number;
  };
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onToggleFavorite?: () => void;
  onMembers?: () => void;
  onOpenBoard?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  projeto,
  onClick,
  onEdit,
  onDelete,
  onArchive,
  onToggleFavorite,
  onMembers,
  onOpenBoard,
}) => {
  const getProgressColor = (progresso: number) => {
    if (progresso === 100) return "bg-green-600";
    if (progresso >= 80) return "bg-green-500";
    if (progresso >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "Recentemente";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data inválida";
      return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    } catch (e) {
      return "Data inválida";
    }
  };

  const completedTasks = Math.round(
    (projeto.total_tarefas || 0) * ((projeto.progresso || 0) / 100),
  );

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-900/80 transition-colors cursor-pointer flex flex-col h-full"
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center flex-1">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0"
              style={{ backgroundColor: projeto.cor || "#3b82f6" }}
            >
              {projeto.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight group-hover:text-gray-950 dark:group-hover:text-white transition-colors truncate pr-2">
                {projeto.nome}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {projeto.progresso === 100 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Concluído
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider",
                      projeto.ativo
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        : "bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400",
                    )}
                  >
                    {projeto.ativo ? "Em Andamento" : "Arquivado"}
                  </span>
                )}
                {projeto.favorito && (
                  <Star
                    size={12}
                    className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label={`Ações do projeto ${projeto.nome}`}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(event) => event.stopPropagation()}
                className="w-44"
              >
                <DropdownMenuItem onClick={() => onClick?.()}>
                  <Info size={14} /> <span>Detalhes</span>
                </DropdownMenuItem>
                {onOpenBoard ? (
                  <DropdownMenuItem onClick={() => onOpenBoard()}>
                    <Columns size={14} /> <span>Quadro</span>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => onEdit?.()}>
                  <Edit size={14} /> <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMembers?.()}>
                  <Users size={14} /> <span>Membros</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite?.()}>
                  <Star size={14} />{" "}
                  <span>
                    {projeto.favorito ? "Remover Favorito" : "Favoritar"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive?.()}>
                  <Archive size={14} />{" "}
                  <span>{projeto.ativo ? "Arquivar" : "Desarquivar"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.()}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 size={14} /> <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-5 flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 min-h-[3.6rem]">
            {projeto.descricao || "Sem descrição definida para este projeto."}
          </p>
        </div>

        {/* Progresso Detalhado */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {completedTasks}/{projeto.total_tarefas || 0} tarefas (
              {projeto.progresso || 0}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                getProgressColor(projeto.progresso || 0),
              )}
              style={{ width: `${projeto.progresso || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40 rounded-b-2xl flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" title="Membros da equipe">
            <Users size={14} />
            <span>{projeto.total_membros || 0} membros</span>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5"
          title={`Atualizado ${getRelativeTime(projeto.data_atualizacao)}`}
        >
          <Clock size={14} />
          <span>
            {getRelativeTime(projeto.data_atualizacao || projeto.data_criacao)}
          </span>
        </div>
      </div>
    </div>
  );
};
