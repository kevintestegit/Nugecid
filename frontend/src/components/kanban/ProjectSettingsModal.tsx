import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Settings, Trash2, AlertTriangle } from "lucide-react";
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
import { kanbanService } from "../../services/kanbanService";
import type { Projeto } from "./KanbanBoard";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Projeto | null;
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

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState(COLOR_PRESETS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    if (project) {
      setNome(project.nome);
      setDescricao(project.descricao ?? "");
      setCor(project.cor ?? COLOR_PRESETS[0]);
      setErrors({});
      setConfirmDelete("");
    }
  }, [project]);

  if (!project) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) {
      newErrors.nome = "Nome do projeto é obrigatório";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await kanbanService.updateProjeto(project.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        cor,
      });
      toast.success("Projeto atualizado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      toast.error("Não foi possível atualizar o projeto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await kanbanService.deleteProjeto(project.id);
      toast.success("Projeto excluído com sucesso!");
      onClose();
      navigate("/projetos");
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast.error("Não foi possível excluir o projeto.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações do Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-project-name">Nome *</Label>
            <Input
              id="settings-project-name"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (errors.nome) setErrors((prev) => ({ ...prev, nome: "" }));
              }}
              placeholder="Nome do projeto"
              className={errors.nome ? "border-red-500" : ""}
            />
            {errors.nome && (
              <p className="text-sm text-red-600">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-project-description">
              Descrição{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="settings-project-description"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo do projeto"
              rows={3}
            />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>

        <hr className="my-6 border-gray-200 dark:border-gray-700" />

        <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <h3 className="text-red-700 dark:text-red-400 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de Perigo
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400/80 mt-2">
            Ao excluir o projeto, todas as colunas, tarefas e dados associados
            serão permanentemente removidos.
          </p>

          <div className="mt-4 space-y-3">
            <Label htmlFor="settings-confirm-delete">
              Digite &quot;{project.nome}&quot; para confirmar
            </Label>
            <Input
              id="settings-confirm-delete"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder={`Digite "${project.nome}" para confirmar`}
            />
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={confirmDelete !== project.nome || deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Excluir Projeto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
