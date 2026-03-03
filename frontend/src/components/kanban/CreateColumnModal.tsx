import React, { useState } from "react";
import { Loader2, Columns } from "lucide-react";
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

interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
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

export const CreateColumnModal: React.FC<CreateColumnModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(COLOR_PRESETS[0]);
  const [wipLimit, setWipLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setNome("");
    setCor(COLOR_PRESETS[0]);
    setWipLimit("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
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
    if (!validate()) return;

    setSaving(true);
    try {
      await kanbanService.createColuna({
        projetoId: projectId,
        nome: nome.trim(),
        cor,
        wipLimit: wipLimit ? Number(wipLimit) : undefined,
        ordem: 999, // Backend should handle proper ordering
      });
      toast.success("Coluna criada com sucesso!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar coluna:", error);
      toast.error("Não foi possível criar a coluna.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            Nova Coluna
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Nome *</Label>
            <Input
              id="column-name"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (errors.nome) setErrors((prev) => ({ ...prev, nome: "" }));
              }}
              placeholder="Ex: A Fazer, Em Progresso, Concluído"
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
            <Label htmlFor="wip-limit">
              Limite WIP{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="wip-limit"
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
              Criar Coluna
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
