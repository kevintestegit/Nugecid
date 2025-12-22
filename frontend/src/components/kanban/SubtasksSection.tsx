import React, { useState } from 'react';
import { GitMerge, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Avatar } from './Avatar';
import { kanbanService } from '../../services/kanbanService';
import { Tarefa } from '../../types/kanban.types';
import { toast } from 'sonner';

interface SubtasksSectionProps {
  parentTask: Tarefa;
  onRefresh: () => void;
  onOpenTask: (id: number) => void;
}

export const SubtasksSection: React.FC<SubtasksSectionProps> = ({ parentTask, onRefresh, onOpenTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSubtask = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await kanbanService.createTarefa({
        titulo: newTitle.trim(),
        projetoId: parentTask.projetoId,
        colunaId: parentTask.colunaId, // Subtarefas vão para a mesma coluna da tarefa pai
        prioridade: 'media',
        ordem: 1,
        parentId: parentTask.id // Link as subtask
      });
      setNewTitle('');
      setIsAdding(false);
      onRefresh();
      toast.success('Subtarefa criada!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar subtarefa');
    } finally {
      setLoading(false);
    }
  };

  const subtasks = parentTask.subtarefas || [];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
           <GitMerge className="w-4 h-4 text-gray-400" /> Subtarefas
        </h4>
      </div>

      <div className="space-y-2">
        {subtasks.map(task => (
           <div 
             key={task.id} 
             onClick={() => onOpenTask(task.id)}
             className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
           >
              <div className={`w-2 h-2 rounded-full bg-${task.prioridade === 'alta' ? 'orange' : task.prioridade === 'critica' ? 'red' : 'green'}-500 shrink-0`} />
              
              <span className="text-sm text-gray-700 font-medium flex-1 truncate">{task.titulo}</span>
              
              {task.responsavel && (
                 <Avatar usuario={task.responsavel} size="xs" />
              )}
              
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-gray-50 border-gray-200 text-gray-600">
                 {task.coluna?.nome || 'Sem status'}
              </Badge>
           </div>
        ))}

        {isAdding ? (
           <div className="flex gap-2 items-center mt-2">
              <Input 
                 autoFocus
                 placeholder="O que precisa ser feito?"
                 value={newTitle}
                 onChange={(e) => setNewTitle(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubtask();
                    if (e.key === 'Escape') setIsAdding(false);
                 }}
                 className="h-9 text-sm"
              />
              <Button size="sm" onClick={handleAddSubtask} disabled={loading || !newTitle.trim()}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
           </div>
        ) : (
           <Button 
              variant="ghost" 
              size="sm" 
              className="pl-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
              onClick={() => setIsAdding(true)}
           >
              <Plus className="w-4 h-4 mr-2" /> Adicionar subtarefa
           </Button>
        )}
      </div>
    </div>
  );
};
