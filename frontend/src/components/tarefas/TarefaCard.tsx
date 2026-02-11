import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import {
  Clock,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { Tarefa, StatusTarefa, PrioridadeTarefa } from "@/types";
import { Avatar, AvatarGroup } from "@/components/kanban/Avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TarefaCardProps {
  tarefa: Tarefa;
  onEdit?: (tarefa: Tarefa) => void;
  onDelete?: (id: number) => void;
  onStatusChange?: (id: number, status: StatusTarefa) => void;
  showActions?: boolean;
  compact?: boolean;
}

const TarefaCard: React.FC<TarefaCardProps> = ({
  tarefa,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = true,
  compact = false,
}) => {
  const statusAtual =
    tarefa.status ?? tarefa.statusTarefa ?? StatusTarefa.PENDENTE;
  const responsaveis = tarefa.responsaveis?.length
    ? tarefa.responsaveis
    : tarefa.responsavel
      ? [tarefa.responsavel]
      : [];
  const getStatusIcon = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return <Circle className="h-4 w-4" />;
      case StatusTarefa.EM_ANDAMENTO:
        return <PlayCircle className="h-4 w-4" />;
      case StatusTarefa.CONCLUIDA:
        return <CheckCircle className="h-4 w-4" />;
      case StatusTarefa.CANCELADA:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case StatusTarefa.EM_ANDAMENTO:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case StatusTarefa.CONCLUIDA:
        return "bg-green-100 text-green-800 border-green-200";
      case StatusTarefa.CANCELADA:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPrioridadeColor = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case PrioridadeTarefa.BAIXA:
        return "text-green-600";
      case PrioridadeTarefa.MEDIA:
        return "text-yellow-600";
      case PrioridadeTarefa.ALTA:
        return "text-orange-600";
      case PrioridadeTarefa.CRITICA:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getPrioridadeLabel = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case PrioridadeTarefa.BAIXA:
        return "Baixa";
      case PrioridadeTarefa.MEDIA:
        return "Média";
      case PrioridadeTarefa.ALTA:
        return "Alta";
      case PrioridadeTarefa.CRITICA:
        return "Crítica";
      default:
        return "Não definida";
    }
  };

  const getStatusLabel = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return "Pendente";
      case StatusTarefa.EM_ANDAMENTO:
        return "Em Andamento";
      case StatusTarefa.CONCLUIDA:
        return "Concluída";
      case StatusTarefa.CANCELADA:
        return "Cancelada";
      default:
        return "Não definido";
    }
  };

  const isAtrasada =
    tarefa.prazo &&
    new Date(tarefa.prazo) < new Date() &&
    tarefa.statusTarefa !== StatusTarefa.CONCLUIDA;

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        isAtrasada ? "border-red-200 bg-red-50" : ""
      } ${compact ? "p-2" : ""}`}
    >
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle
              className={`${compact ? "text-sm" : "text-base"} font-medium`}
            >
              {tarefa.titulo}
              {isAtrasada && (
                <AlertTriangle className="inline-block ml-2 h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            {tarefa.descricao && !compact && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {tarefa.descricao}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge className={`${getStatusColor(statusAtual)} text-xs`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(statusAtual)}
                {getStatusLabel(statusAtual)}
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? "pt-0" : "pt-0"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {/* Prioridade */}
            <div className="flex items-center gap-1">
              <Flag
                className={`h-4 w-4 ${getPrioridadeColor(tarefa.prioridade)}`}
              />
              <span className={getPrioridadeColor(tarefa.prioridade)}>
                {getPrioridadeLabel(tarefa.prioridade)}
              </span>
            </div>

            {/* Responsáveis */}
            {responsaveis.length > 0 && (
              <div className="flex items-center gap-2">
                {responsaveis.length > 1 ? (
                  <AvatarGroup usuarios={responsaveis} size="xs" max={3} />
                ) : (
                  <Avatar usuario={responsaveis[0]} size="xs" />
                )}
                <span>
                  {responsaveis.length === 1
                    ? responsaveis[0].nome
                    : `${responsaveis.length} pessoas`}
                </span>
              </div>
            )}

            {/* Prazo */}
            {tarefa.prazo && (
              <div
                className={`flex items-center gap-1 ${
                  isAtrasada ? "text-red-600 font-medium" : ""
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(tarefa.prazo), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Ações */}
          {showActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(tarefa)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(tarefa.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Informações adicionais em modo compacto */}
        {compact && tarefa.descricao && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-1">
            {tarefa.descricao}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TarefaCard;
