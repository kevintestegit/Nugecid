import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageCircle, Paperclip, MoreHorizontal, Flag, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tarefa } from '../../types/kanban.types';
import { Avatar } from './Avatar';
import { PrazoBadge } from './PrazoBadge';
import { TagList } from './TagBadge';
import { getPrioridadeCor } from '../../utils/kanbanHelpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  tarefa: Tarefa;
  onClick?: (tarefa: Tarefa) => void;
  onEdit?: (tarefa: Tarefa) => void;
  onDelete?: (tarefaId: number) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ tarefa, onClick, onEdit, onDelete }) => {
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
      type: 'tarefa',
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
  
  // Mapear prioridade para cores estilo mockup
  const getPriorityStyles = (prioridade: string) => {
    switch (prioridade.toLowerCase()) {
      case 'alta':
      case 'critica':
        return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50';
      case 'media':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50';
      case 'baixa':
        return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-900/50';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none group',
        isDragging && 'opacity-50 scale-105 z-50'
      )}
    >
      <div
        className={cn(
          'bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer relative',
          isDragging ? 'rotate-2' : ''
        )}
        onClick={() => onClick?.(tarefa)}
      >
        {/* Header: Priority & More Options */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
              getPriorityStyles(tarefa.prioridade)
            )}>
              {tarefa.prioridade}
            </span>
          </div>
          <button 
            className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {tarefa.descricao}
          </p>
        )}

        {/* Footer: Users & Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
          {/* Users/Avatar */}
          <div className="flex -space-x-2">
            {tarefa.responsavel && (
              <div className="border-2 border-white dark:border-gray-800 rounded-full">
                <Avatar usuario={tarefa.responsavel} size="xs" />
              </div>
            )}
            {/* Placeholder for other members if we had them */}
            {/* <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 flex items-center justify-center text-[10px] text-gray-600">+2</div> */}
          </div>

          {/* Stats/Icons */}
          <div className="flex items-center gap-3 text-gray-400 text-xs">
            {tarefa.prazo && (
              <div className={cn(
                "flex items-center gap-1 hover:text-gray-600",
                new Date(tarefa.prazo) < new Date() ? "text-red-500" : ""
              )}>
                <Flag size={14} />
                <span>{format(new Date(tarefa.prazo), 'dd MMM', { locale: ptBR })}</span>
              </div>
            )}
            
            {comentariosCount > 0 && (
              <div className="flex items-center gap-1 hover:text-gray-600">
                <MessageCircle size={14} />
                <span>{comentariosCount}</span>
              </div>
            )}

            {anexosCount > 0 && (
              <div className="flex items-center gap-1 hover:text-gray-600">
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
