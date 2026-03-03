import React, { useEffect, useState } from "react";
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
import { kanbanService } from "../../services/kanbanService";
import { Coluna } from "./KanbanColumn";

interface EditColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: Coluna | null;
  onSuccess: () => void;
}

const COLOR_PRESETS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#6B7280",
];

export const EditColumnModal: React.FC<EditColumnModalProps> = ({
  isOpen,
  onClose,
  column,
  onSuccess,
}) => {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(COLOR_PRESETS[0]);
  const [wipLimit, setWipLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (column) {
      setNome(column.nome);
      setCor(column.cor ?? COLOR_PRESETS[0]);
      setWipLimit(column.limite_wip ? String(column.limite_wip) : "");
      setErrors({});
    }
  }, [column]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) {
      newErrors.nome = "Nome da coluna é obrigatório";
    }
    if (wipLimit && (Number.isNaN(Number(wipLimit)) || Number(wipLimit) < 1)) {
      newErrors.wipLimit = "Limite WIP deve ser um número positivo";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!column || !validate()) return;

    setSaving(true);
    try {
      await kanbanService.updateColuna(column.id, {
        nome: nome.trim(),
        cor,
        wipLimit: wipLimit ? Number(wipLimit) : undefined,
      });
      toast.success("Coluna atualizada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast.error("Não foi possível atualizar a coluna.");
    } finally {
      setSaving(false);
    }
  };

  if (!column) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Editar Coluna
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-column-name">Nome *</Label>
            <Input
              id="edit-column-name"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (errors.nome) setErrors((prev) => ({ ...prev, nome: "" }));
              }}
              placeholder="Nome da coluna"
              className={errors.nome ? "border-red-500" : ""}
              autoFocus
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    cor === color
                      ? "border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-400"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-wip-limit">
              Limite WIP{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="edit-wip-limit"
              type="number"
              min="1"
              value={wipLimit}
              onChange={(e) => {
                setWipLimit(e.target.value);
                if (errors.wipLimit)
                  setErrors((prev) => ({ ...prev, wipLimit: "" }));
              }}
              placeholder="Máximo de tarefas na coluna"
              className={errors.wipLimit ? "border-red-500" : ""}
            />
            {errors.wipLimit && (
              <p className="text-sm text-red-600">{errors.wipLimit}</p>
            )}
            <p className="text-xs text-gray-500">
              Limita quantas tarefas podem estar nesta coluna simultaneamente.
            </p>
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
