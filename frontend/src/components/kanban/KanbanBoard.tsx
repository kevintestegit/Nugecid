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
import { Card } from '../ui/Card';
import { Plus, Filter, Settings } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  data_criacao: string;
  data_atualizacao: string;
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
  loading?: boolean;
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
  loading = false,
}) => {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Segurança contra respostas fora do formato esperado
  const colunasList = Array.isArray(colunas) ? colunas : [];
  const tarefasList = Array.isArray(tarefas) ? tarefas : [];

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
  const tarefasPorColuna = useMemo(() => {
    const grouped: Record<number, Tarefa[]> = {};
    
    colunasList.forEach(coluna => {
      grouped[coluna.id] = filteredTarefas
        .filter(tarefa => {
          const colunaId = (tarefa as any).coluna_id ?? tarefa.colunaId;
          return colunaId === coluna.id;
        })
        .sort((a, b) => a.ordem - b.ordem);
    });
    
    return grouped;
  }, [colunasList, filteredTarefas]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    // Permitir que o @dnd-kit detecte quando estamos sobre outra coluna
    // Isso habilita a animação visual de movimento entre colunas
    const isActiveTask = active.data.current?.type === 'tarefa';
    const isOverColumn = over.data.current?.type === 'coluna';
    
    if (isActiveTask && isOverColumn) {
      // Apenas para permitir a animação, não fazemos nada aqui
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    console.log('🎯 handleDragEnd:', { 
      activeId: active.id, 
      overId: over?.id,
      activeType: active.data.current?.type,
      overType: over?.data.current?.type,
      activeData: active.data.current,
      overData: over?.data.current
    })

    if (!over) {
      console.log('❌ Sem destino (over é null)')
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      console.log('❌ Mesma origem e destino')
      return;
    }

    const isActiveTask = active.data.current?.type === 'tarefa';
    const isOverTask = over.data.current?.type === 'tarefa';
    const isOverColumn = over.data.current?.type === 'coluna';

    console.log('📋 Tipos detectados:', { isActiveTask, isOverTask, isOverColumn })

    // PRIORIDADE 1: Mover para coluna vazia (soltou diretamente na coluna)
    if (isActiveTask && isOverColumn) {
      const activeTask = active.data.current.tarefa as Tarefa;
      const overColumn = over.data.current.coluna as Coluna;
      
      console.log('🔀 Movendo para coluna:', {
        taskId: activeTask.id,
        taskTitle: activeTask.titulo,
        from: activeTask.coluna_id,
        to: overColumn.id,
        columnName: overColumn.nome
      })
      
      const overColumnTasks = tarefasPorColuna[overColumn.id] || [];
      onMoveTask?.(activeTask.id, activeTask.coluna_id, overColumn.id, overColumnTasks.length);
      return;
    }

    // PRIORIDADE 2: Mover/reordenar entre tarefas
    if (isActiveTask && isOverTask) {
      const activeTask = active.data.current.tarefa as Tarefa;
      const overTask = over.data.current.tarefa as Tarefa;

      console.log('📦 Interação entre tarefas:', {
        activeTaskId: activeTask.id,
        activeTaskTitle: activeTask.titulo,
        activeColumn: activeTask.coluna_id,
        overTaskId: overTask.id,
        overTaskTitle: overTask.titulo,
        overColumn: overTask.coluna_id
      })

      if (activeTask.coluna_id === overTask.coluna_id) {
        // Reordenar na mesma coluna
        console.log('🔃 Reordenando na mesma coluna')
        const columnTasks = tarefasPorColuna[activeTask.coluna_id];
        const oldIndex = columnTasks.findIndex(t => t.id === activeTask.id);
        const newIndex = columnTasks.findIndex(t => t.id === overTask.id);
        
        const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);
        onReorderTasks?.(activeTask.coluna_id, reorderedTasks.map(t => t.id), activeTask.id);
      } else {
        // Mover para coluna diferente
        console.log('🔄 Movendo entre colunas diferentes')
        const overColumnTasks = tarefasPorColuna[overTask.coluna_id];
        const overIndex = overColumnTasks.findIndex(t => t.id === overTask.id);
        onMoveTask?.(activeTask.id, activeTask.coluna_id, overTask.coluna_id, overIndex);
      }
    }
    
    console.log('⚠️ Nenhuma ação executada - tipos não reconhecidos')
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
    <div className="flex flex-col h-full">
      {/* Header do projeto */}
      <Card className="p-4 mb-6 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {projeto.cor && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: projeto.cor }}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{projeto.nome}</h1>
              {projeto.descricao && (
                <p className="text-gray-600 mt-1">{projeto.descricao}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {tarefas.length} tarefa(s)
            </Badge>
            <Badge variant="outline" className="text-sm">
              {colunas.length} coluna(s)
            </Badge>
            {onProjectSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onProjectSettings}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            )}
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>

          {onAddColumn && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddColumn}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Coluna
            </Button>
          )}
        </div>
      </Card>

      {/* Board com colunas */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 p-4 min-h-full">
            {colunas
              .sort((a, b) => a.ordem - b.ordem)
              .map((coluna) => (
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
                />
              ))}

            {/* Placeholder para adicionar nova coluna */}
            {onAddColumn && (
              <div className="min-w-80 max-w-80">
                <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 transition-colors">
                  <Button
                    variant="ghost"
                    className="w-full h-32 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
                    onClick={onAddColumn}
                  >
                    <Plus className="w-8 h-8" />
                    <span>Adicionar Coluna</span>
                  </Button>
                </Card>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTarefa && (
              <div className="rotate-3 opacity-90">
                <KanbanCard tarefa={activeTarefa} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
