import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../ui/Button';
import { KanbanCard, Tarefa } from './KanbanCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Coluna {
  id: number;
  nome: string;
  cor?: string;
  limite_wip?: number;
  ordem: number;
  projeto_id: number;
}

interface KanbanColumnProps {
  coluna: Coluna;
  tarefas: Tarefa[];
  onAddTask?: (colunaId: number) => void;
  onEditColumn?: (coluna: Coluna) => void;
  onDeleteColumn?: (colunaId: number) => void;
  onTaskClick?: (tarefa: Tarefa) => void;
  onTaskEdit?: (tarefa: Tarefa) => void;
  onTaskDelete?: (tarefaId: number) => void;
  isOver?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  coluna,
  tarefas,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  isOver,
}) => {
  const { setNodeRef } = useDroppable({
    id: coluna.id,
    data: {
      type: 'coluna',
      coluna,
    },
  });

  const isWipLimitExceeded = coluna.limite_wip && tarefas.length > coluna.limite_wip;
  const taskIds = tarefas.map(tarefa => tarefa.id);

  return (
    <div className="flex flex-col h-full min-w-80 max-w-80">
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{coluna.nome}</h3>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
            {tarefas.length}
            {coluna.limite_wip ? `/${coluna.limite_wip}` : ''}
          </span>
          {isWipLimitExceeded && (
            <span className="text-[10px] text-red-500 font-bold ml-1">Limit Exceeded</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {onAddTask && (
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => onAddTask(coluna.id)}
            >
              <Plus size={18} />
            </button>
          )}
          <div className="relative group">
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {/* Dropdown Menu (Simplificado via CSS hover para este exemplo, ideal seria um componente Dropdown real) */}
             <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-50">
                <button
                  onClick={() => onEditColumn?.(coluna)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteColumn?.(coluna.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Excluir
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Big Add Button */}
      {onAddTask && (
        <button
          onClick={() => onAddTask(coluna.id)}
          className="w-full py-2 mb-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      )}

      {/* Drop zone para as tarefas */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto pr-2 space-y-3 pb-10 custom-scrollbar rounded-lg',
          isOver && 'bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-300 border-dashed',
          isWipLimitExceeded && 'bg-red-50/30'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tarefas.map((tarefa) => (
            <KanbanCard
              key={tarefa.id}
              tarefa={tarefa}
              onClick={onTaskClick}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};