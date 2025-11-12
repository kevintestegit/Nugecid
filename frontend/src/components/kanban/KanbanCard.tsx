import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageCircle, Paperclip } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tarefa } from '../../types/kanban.types';
import { Avatar } from './Avatar';
import { PrazoBadge } from './PrazoBadge';
import { TagList } from './TagBadge';
import { PrioridadeBadge } from './PrioridadeBadge';
import { getPrioridadeCor } from '../../utils/kanbanHelpers';

interface KanbanCardProps {
  tarefa: Tarefa;
  onClick?: (tarefa: Tarefa) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ tarefa, onClick }) => {
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
  const borderColor = getPrioridadeCor(tarefa.prioridade);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50 scale-105'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200',
          'border border-gray-200 border-l-4 p-3 cursor-pointer',
          'group relative'
        )}
        style={{ borderLeftColor: borderColor }}
        onClick={() => onClick?.(tarefa)}
      >
        {/* Header - Título e Prioridade */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
            {tarefa.titulo}
          </h4>
          <PrioridadeBadge 
            prioridade={tarefa.prioridade} 
            size="sm"
            showLabel={false}
          />
        </div>

        {/* Descrição */}
        {tarefa.descricao && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {tarefa.descricao}
          </p>
        )}

        {/* Tags */}
        {tarefa.tags && tarefa.tags.length > 0 && (
          <div className="mb-2">
            <TagList tags={tarefa.tags} max={2} size="sm" />
          </div>
        )}

        {/* Footer - Informações e Indicadores */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          {/* Avatar do Responsável */}
          <div className="flex-shrink-0">
            <Avatar usuario={tarefa.responsavel} size="xs" />
          </div>

          {/* Indicadores */}
          <div className="flex items-center gap-2">
            {/* Comentários */}
            {comentariosCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <MessageCircle size={14} />
                <span className="text-xs font-medium">{comentariosCount}</span>
              </div>
            )}

            {/* Anexos */}
            {anexosCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <Paperclip size={14} />
                <span className="text-xs font-medium">{anexosCount}</span>
              </div>
            )}

            {/* Badge de Prazo */}
            <PrazoBadge prazo={tarefa.prazo} size="sm" showIcon={false} />
          </div>
        </div>
      </div>
    </div>
  );
};
