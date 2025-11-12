import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { KanbanCard, Tarefa } from './KanbanCard';
import { Plus, MoreHorizontal, Settings } from 'lucide-react';
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
      <Card className="p-4 mb-4 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {coluna.cor && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: coluna.cor }}
              />
            )}
            <h2 className="font-semibold text-gray-900">{coluna.nome}</h2>
            <Badge variant="secondary" className="text-xs">
              {tarefas.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onAddTask(coluna.id)}
                title="Adicionar tarefa"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEditColumn?.(coluna)}
              title="Configurar coluna"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Fechar outros menus abertos
                  document.querySelectorAll('.kanban-menu').forEach(menu => {
                    if (menu !== e.currentTarget.nextElementSibling) {
                      menu.classList.add('hidden');
                    }
                  });
                  const menu = e.currentTarget.nextElementSibling as HTMLElement;
                  menu?.classList.toggle('hidden');
                }}
                title="Mais opções"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {/* Menu dropdown */}
              <div className="kanban-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 hidden min-w-32">
                <button
                  onClick={(e) => {
                    onEditColumn?.(coluna);
                    const menu = (e.currentTarget as HTMLElement)?.parentElement?.querySelector('.kanban-menu') as HTMLElement;
                    menu?.classList.add('hidden');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Settings className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    onDeleteColumn?.(coluna.id);
                    const menu = (e.currentTarget as HTMLElement)?.parentElement?.querySelector('.kanban-menu') as HTMLElement;
                    menu?.classList.add('hidden');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WIP Limit Warning */}
        {coluna.limite_wip && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Limite WIP: {coluna.limite_wip}
            </span>
            {isWipLimitExceeded && (
              <Badge variant="destructive" className="text-xs">
                Limite excedido!
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Drop zone para as tarefas */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-32 p-2 rounded-lg transition-colors duration-200',
          isOver && 'bg-blue-50 border-2 border-blue-300 border-dashed',
          isWipLimitExceeded && 'bg-red-50'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tarefas.map((tarefa) => (
              <div key={tarefa.id} className="group">
                <KanbanCard
                  tarefa={tarefa}
                  onClick={onTaskClick}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Placeholder quando não há tarefas */}
        {tarefas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <Plus className="w-8 h-8 mb-2" />
            <p className="text-sm">Nenhuma tarefa</p>
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => onAddTask(coluna.id)}
              >
                Adicionar primeira tarefa
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer com estatísticas */}
      <div className="mt-4 p-2 text-xs text-gray-500 border-t">
        <div className="flex justify-between items-center">
          <span>{tarefas.length} tarefa(s)</span>
          {coluna.limite_wip && (
            <span className={cn(
              isWipLimitExceeded ? 'text-red-600 font-medium' : 'text-gray-500'
            )}>
              {tarefas.length}/{coluna.limite_wip}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};