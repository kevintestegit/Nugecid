import React, { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/Select";
import { kanbanService } from "../../services/kanbanService";
import type { Tarefa } from "../../types/kanban.types";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Tarefa | null;
  onSuccess: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSuccess,
}) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<
    "baixa" | "media" | "alta" | "critica"
  >("media");
  const [prazo, setPrazo] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo);
      setDescricao(task.descricao ?? "");
      setPrioridade(task.prioridade);
      setPrazo(task.prazo ? task.prazo.split("T")[0] : "");
      setErrors({});
    }
  }, [task]);

  if (!task) return null;

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!titulo.trim()) {
      newErrors.titulo = "Titulo da tarefa é obrigatório";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await kanbanService.updateTarefa(task.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        prazo: prazo || undefined,
      });
      toast.success("Tarefa atualizada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Não foi possível atualizar a tarefa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Editar Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-titulo">Título *</Label>
            <Input
              id="task-titulo"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (errors.titulo)
                  setErrors((prev) => ({ ...prev, titulo: "" }));
              }}
              placeholder="Título da tarefa"
              className={errors.titulo ? "border-red-500" : ""}
              autoFocus
            />
            {errors.titulo && (
              <p className="text-sm text-red-600">{errors.titulo}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-descricao">
              Descrição{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="task-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a tarefa..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-prioridade">Prioridade</Label>
            <Select
              value={prioridade}
              onValueChange={(value: "baixa" | "media" | "alta" | "critica") =>
                setPrioridade(value)
              }
            >
              <SelectTrigger id="task-prioridade">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-prazo">
              Prazo{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="task-prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
