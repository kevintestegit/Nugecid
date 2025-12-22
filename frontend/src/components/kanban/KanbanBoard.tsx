import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn, Coluna } from './KanbanColumn';
import { KanbanCard, Tarefa } from './KanbanCard';
import { Button } from '../ui/Button';
import { Plus, Settings, Search, LayoutGrid, SlidersHorizontal, ChevronDown, Users, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AvatarGroup } from './Avatar';
import { Usuario } from '../../types/kanban.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  data_criacao: string;
  data_atualizacao: string;
  membros?: { usuario?: Usuario }[];
}

interface KanbanBoardProps {
  projeto: Projeto;
  colunas: Coluna[];
  tarefas: Tarefa[];
  onMoveTask?: (tarefaId: number, sourceColunaId: number, targetColunaId: number, newOrder: number) => void;
  onReorderTasks?: (colunaId: number, tarefaIds: number[], movedTaskId?: number) => void;
  onAddColumn?: () => void;
  onEditColumn?: (coluna: Coluna) => void;
  onDeleteColumn?: (colunaId: number) => void;
  onAddTask?: (colunaId: number) => void;
  onTaskClick?: (tarefa: Tarefa) => void;
  onTaskEdit?: (tarefa: Tarefa) => void;
  onTaskDelete?: (tarefaId: number) => void;
  onProjectSettings?: () => void;
  onProjectMembers?: () => void;
  onProjectReports?: () => void;
  loading?: boolean;
  density?: 'comfortable' | 'compact';
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projeto,
  colunas,
  tarefas,
  onMoveTask,
  onReorderTasks,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onAddTask,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onProjectSettings,
  onProjectMembers,
  onProjectReports,
  loading = false,
  density = 'comfortable',
}) => {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Segurança contra respostas fora do formato esperado
  const colunasList = Array.isArray(colunas) ? colunas : [];
  const tarefasList = Array.isArray(tarefas) ? tarefas : [];
  const sortedColunas = useMemo(
    () => colunasList.slice().sort((a, b) => a.ordem - b.ordem),
    [colunasList],
  )

  const colunasById = useMemo(() => {
    const entries = sortedColunas.map((coluna) => [coluna.id, coluna] as const)
    return Object.fromEntries(entries) as Record<number, Coluna>
  }, [sortedColunas])

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()

  const isTodoColumn = (coluna: Coluna | undefined) => {
    const name = normalizeText(coluna?.nome ?? '')
    return name === 'a fazer' || name === 'afazer' || name.startsWith('a fazer ')
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filtrar tarefas baseado na busca e filtros
  const filteredTarefas = useMemo(() => {
    return tarefasList.filter(tarefa => {
      const matchesSearch = !searchTerm || 
        tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = !selectedPriority || tarefa.prioridade === selectedPriority;
      
      return matchesSearch && matchesPriority;
    });
  }, [tarefasList, searchTerm, selectedPriority]);

  // Organizar tarefas por coluna
  const getTaskColumnId = (tarefa: Tarefa): number => {
    const legacy = tarefa as Tarefa & { coluna_id?: number }
    return legacy.coluna_id ?? tarefa.colunaId
  }

  const tarefasPorColuna = useMemo(() => {
    const grouped: Record<number, Tarefa[]> = {};
    
    colunasList.forEach(coluna => {
      grouped[coluna.id] = filteredTarefas
        .filter(tarefa => getTaskColumnId(tarefa) === coluna.id)
        .sort((a, b) => a.ordem - b.ordem);
    });
    
    return grouped;
  }, [colunasList, filteredTarefas, getTaskColumnId]);

  // Extrair usuários dos membros para o AvatarGroup
  const projectUsers = useMemo(() => {
    return projeto.membros
      ?.map(m => m.usuario)
      .filter((u): u is Usuario => !!u) || [];
  }, [projeto.membros]);

  // Helper para formatar data com segurança
  const safeDate = (date: string | Date | undefined, formatStr: string) => {
    if (!date) return 'Data indisponível';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Data inválida';
      return format(dateObj, formatStr, { locale: ptBR });
    } catch (error) {
      return 'Erro na data';
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const isActiveTask = active.data.current?.type === 'tarefa';
    const isOverColumn = over.data.current?.type === 'coluna';
    
    if (isActiveTask && isOverColumn) {
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'tarefa';
    const isOverTask = over.data.current?.type === 'tarefa';
    const isOverColumn = over.data.current?.type === 'coluna';

    // PRIORIDADE 1: Mover para coluna vazia
    if (isActiveTask && isOverColumn) {
      const activeTask = active.data.current.tarefa as Tarefa;
      const overColumn = over.data.current.coluna as Coluna;
      const sourceColunaId = getTaskColumnId(activeTask)

      const sourceColumn =
        colunasById[sourceColunaId]
      if (isTodoColumn(sourceColumn) && !isTodoColumn(overColumn)) {
        toast.message('Para iniciar uma tarefa, abra e clique em "Iniciar".')
        return
      }

      const overColumnTasks = tarefasPorColuna[overColumn.id] || [];
      onMoveTask?.(activeTask.id, sourceColunaId, overColumn.id, overColumnTasks.length);
      return;
    }

    // PRIORIDADE 2: Mover/reordenar entre tarefas
    if (isActiveTask && isOverTask) {
      const activeTask = active.data.current.tarefa as Tarefa;
      const overTask = over.data.current.tarefa as Tarefa;
      const activeColunaId = getTaskColumnId(activeTask)
      const overColunaId = getTaskColumnId(overTask)

      if (activeColunaId === overColunaId) {
        // Reordenar na mesma coluna
        const columnTasks = tarefasPorColuna[activeColunaId];
        const oldIndex = columnTasks.findIndex(t => t.id === activeTask.id);
        const newIndex = columnTasks.findIndex(t => t.id === overTask.id);
        
        const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);
        onReorderTasks?.(activeColunaId, reorderedTasks.map(t => t.id), activeTask.id);
      } else {
        // Mover para coluna diferente
        const sourceColumn =
          colunasById[activeColunaId]
        const targetColumn =
          colunasById[overColunaId]
        if (isTodoColumn(sourceColumn) && !isTodoColumn(targetColumn)) {
          toast.message('Para iniciar uma tarefa, abra e clique em "Iniciar".')
          return
        }

        const overColumnTasks = tarefasPorColuna[overColunaId];
        const overIndex = overColumnTasks.findIndex(t => t.id === overTask.id);
        onMoveTask?.(activeTask.id, activeColunaId, overColunaId, overIndex);
      }
    }
  };

  const activeTarefa = activeId ? tarefas.find(t => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* New Header Design */}
      <header className="flex-shrink-0 pt-6 px-8 pb-4 bg-white dark:bg-gray-900 z-20 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <span className="hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer">Projetos</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white font-medium">{projeto.nome}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-2">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{projeto.nome}</h1>
              {projeto.cor && (
                <div 
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: projeto.cor }}
                />
              )}
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              {projeto.descricao || "Gerencie o fluxo de trabalho e atividades deste projeto."}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2" title="Data de criação">
                <Calendar size={16} />
                <span>Criado em {safeDate(projeto.data_criacao, "d 'de' MMMM, yyyy")}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span>Membros:</span>
                <AvatarGroup usuarios={projectUsers} size="sm" max={5} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="relative w-64 hidden xl:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={18} />
              </span>
              <input 
                className="w-full py-1.5 pl-9 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-gray-300 placeholder-gray-400 transition-shadow outline-none" 
                placeholder="Buscar no quadro..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden lg:block"></div>
            
            {onProjectMembers && (
              <button 
                onClick={onProjectMembers}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all whitespace-nowrap"
              >
                <Users size={16} />
                <span className="hidden sm:inline">Gerenciar Membros</span>
              </button>
            )}

            {onProjectReports && (
              <button 
                onClick={onProjectReports}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all whitespace-nowrap"
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            {onProjectSettings && (
              <button 
                onClick={onProjectSettings}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                title="Configurações do Projeto"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-gray-50/80 dark:bg-gray-900/40">
        {sortedColunas.length === 0 ? (
          <div className="h-full rounded-2xl border border-dashed border-gray-200 bg-white/80 p-10 text-center text-gray-600 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400">
              <LayoutGrid size={22} />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-base font-semibold text-gray-900">Comece organizando o quadro</h3>
              <p className="text-sm text-gray-500">
                Crie colunas para definir o fluxo do projeto e adicione tarefas para acompanhar o trabalho.
              </p>
            </div>
            {onAddColumn && (
              <Button onClick={onAddColumn} className="gap-2">
                <Plus size={16} />
                Criar primeira coluna
              </Button>
            )}
          </div>
        ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className={cn('flex h-full', density === 'compact' ? 'space-x-4' : 'space-x-6')}>
            {sortedColunas.map((coluna) => (
                <KanbanColumn
                  key={coluna.id}
                  coluna={coluna}
                  tarefas={tarefasPorColuna[coluna.id] || []}
                  onAddTask={onAddTask}
                  onEditColumn={onEditColumn}
                  onDeleteColumn={onDeleteColumn}
                  onTaskClick={onTaskClick}
                  onTaskEdit={onTaskEdit}
                  onTaskDelete={onTaskDelete}
                  density={density}
                />
              ))}
          </div>

          <DragOverlay>
            {activeTarefa && (
              <div className="rotate-3 opacity-90 cursor-grabbing">
                <KanbanCard tarefa={activeTarefa} density={density} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
        )}
      </div>
    </div>
  );
};
