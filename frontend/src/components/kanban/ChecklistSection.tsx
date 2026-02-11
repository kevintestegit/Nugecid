import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { kanbanService } from '../../services/kanbanService';
import { Checklist, ItemChecklist } from '../../types/kanban.types';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface ChecklistItemProps {
  item: ItemChecklist;
  onToggle: (id: number, concluido: boolean) => void;
  onDelete: (id: number) => void;
}

const ChecklistItemView: React.FC<ChecklistItemProps> = ({ item, onToggle, onDelete }) => {
  return (
    <div className="flex items-start gap-3 py-1.5 group">
      <div className="pt-0.5">
        <button
          onClick={() => onToggle(item.id, !item.concluido)}
          className={cn(
            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
            item.concluido
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-300 hover:border-blue-500"
          )}
        >
          {item.concluido && <Check className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-gray-700 break-words",
          item.concluido && "line-through text-gray-400"
        )}>
          {item.texto}
        </p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface ChecklistViewProps {
  checklist: Checklist;
  onDelete: (id: number) => void;
  onUpdate: () => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ checklist, onDelete, onUpdate }) => {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = checklist.itens?.length || 0;
  const completed = checklist.itens?.filter(i => i.concluido).length || 0;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    setLoading(true);
    try {
      await kanbanService.addChecklistItem(checklist.id, newItemText.trim());
      setNewItemText('');
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId: number, concluido: boolean) => {
    try {
      // Optimistic update logic could be here, but for simplicity triggering refresh
      await kanbanService.updateChecklistItem(itemId, { concluido });
      onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await kanbanService.deleteChecklistItem(itemId);
      onUpdate();
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">{checklist.titulo}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 h-8 px-2"
          onClick={() => onDelete(checklist.id)}
        >
          Excluir
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="text-xs font-medium text-gray-500 w-8">{progress}%</div>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1 pl-0">
        {checklist.itens?.map(item => (
          <ChecklistItemView
            key={item.id}
            item={item}
            onToggle={handleToggleItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      {/* Add Item Input */}
      {isAdding ? (
        <div className="pl-0 mt-2">
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder="Descreva a tarefa..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={handleAddItem} disabled={loading || !newItemText.trim()}>
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="pl-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar um item
        </Button>
      )}
    </div>
  );
};

interface ChecklistSectionProps {
  taskId: number;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({ taskId }) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('Checklist');

  const fetchChecklists = useCallback(async () => {
    try {
      const data = await kanbanService.getChecklists(taskId);
      setChecklists(data);
    } catch (error) {
      console.error('Erro ao carregar checklists:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const handleCreateChecklist = async () => {
    if (!newTitle.trim()) return;
    try {
      await kanbanService.createChecklist(taskId, newTitle);
      setIsCreating(false);
      setNewTitle('Checklist');
      fetchChecklists();
    } catch (error) {
      toast.error('Erro ao criar checklist');
    }
  };

  const handleDeleteChecklist = async (id: number) => {
    if (!confirm('Excluir este checklist e todos os seus itens?')) return;
    try {
      await kanbanService.deleteChecklist(id);
      fetchChecklists();
    } catch (error) {
      toast.error('Erro ao excluir checklist');
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      {checklists.map(checklist => (
        <ChecklistView
          key={checklist.id}
          checklist={checklist}
          onDelete={handleDeleteChecklist}
          onUpdate={fetchChecklists}
        />
      ))}

      {isCreating ? (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">Título do Checklist</label>
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Critérios de Aceite"
              className="h-9"
              onKeyDown={(e) => {
                 if (e.key === 'Enter') handleCreateChecklist();
                 if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button size="sm" onClick={handleCreateChecklist}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 text-gray-600 border-gray-200 hover:bg-gray-50"
          onClick={() => setIsCreating(true)}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Adicionar Checklist
        </Button>
      )}
    </div>
  );
};
