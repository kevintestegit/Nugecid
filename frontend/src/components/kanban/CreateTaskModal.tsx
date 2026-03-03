import React, { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: number | null;
  onSuccess: () => void;
}

type Prioridade = "baixa" | "media" | "alta" | "critica";

const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  columnId,
  onSuccess,
}) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [prazo, setPrazo] = useState("");
  const [projetoId, setProjetoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingColumn, setLoadingColumn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (columnId === null) {
      setProjetoId(null);
      return;
    }

    let cancelled = false;
    setLoadingColumn(true);

    kanbanService
      .getColuna(columnId)
      .then((coluna) => {
        if (!cancelled) {
          setProjetoId(coluna.projetoId);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Erro ao buscar coluna:", error);
          toast.error("Não foi possível carregar informações da coluna.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingColumn(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [columnId]);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setPrioridade("media");
    setPrazo("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!titulo.trim()) {
      newErrors.titulo = "Título da tarefa é obrigatório";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || columnId === null) return;

    setSaving(true);
    try {
      await kanbanService.createTarefa({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        prioridade,
        prazo: prazo || undefined,
        projetoId: projetoId ?? 0,
        colunaId: columnId,
        ordem: 999,
      });
      toast.success("Tarefa criada com sucesso!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Não foi possível criar a tarefa.");
    } finally {
      setSaving(false);
    }
  };

  if (columnId === null) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Tarefa
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
              onValueChange={(value) => setPrioridade(value as Prioridade)}
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
            <Button type="submit" disabled={saving || loadingColumn}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
