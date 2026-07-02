import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { X } from "lucide-react";
import type { Pasta } from "@/hooks/usePastas";

interface EditarPastaModalProps {
  isOpen: boolean;
  pasta: Pasta | null;
  onClose: () => void;
  onSubmit: (data: {
    nome: string;
    descricao: string;
    tags: string[];
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const EditarPastaModal: React.FC<EditarPastaModalProps> = ({
  isOpen,
  pasta,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    if (pasta) {
      setNome(pasta.nome ?? "");
      setDescricao(pasta.descricao ?? "");
      setTagsInput(pasta.tags?.join(", ") ?? "");
    }
  }, [pasta]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !pasta) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      nome: nome.trim(),
      descricao: descricao.trim(),
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <Card className="relative w-full max-w-lg mx-4 pointer-events-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Editar Pasta</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="editar-nome"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Nome
                </label>
                <Input
                  id="editar-nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="editar-descricao"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Descrição
                </label>
                <Textarea
                  id="editar-descricao"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="editar-tags"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Tags (separadas por vírgula)
                </label>
                <Input
                  id="editar-tags"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ex: 2025, documentos adm, papiloscopia"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return createPortal(
    <div className={theme === "dark" ? "dark" : ""}>{modalContent}</div>,
    document.body,
  );
};
