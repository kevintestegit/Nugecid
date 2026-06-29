import React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { CreatePastaInput } from "@/hooks/usePastas";

interface NovaPastaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPasta: (novaPasta: CreatePastaInput) => Promise<void> | void;
}

export const NovaPastaModal: React.FC<NovaPastaModalProps> = ({
  isOpen,
  onClose,
  onAddPasta,
}) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tags, setTags] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);
  const [planilhas, setPlanilhas] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    descricao?: string;
  }>({});

  const handleImagemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImagens(files);
  };

  const handlePlanilhaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setPlanilhas(files.slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof fieldErrors = {};
    if (!nome.trim()) nextErrors.nome = "Informe o nome da pasta.";
    if (!descricao.trim())
      nextErrors.descricao = "Informe uma descrição para a pasta.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onAddPasta({
        nome,
        descricao,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        imagens,
        planilhas,
      });
      setNome("");
      setDescricao("");
      setTags("");
      setImagens([]);
      setPlanilhas([]);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar a pasta. Tente novamente.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Pasta/Prateleira</DialogTitle>
          <DialogDescription>
            Crie uma nova pasta ou prateleira para organizar documentos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField
            id="nome"
            label="Nome"
            required
            error={fieldErrors.nome}
          >
            <Input
              id="nome"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (fieldErrors.nome) {
                  setFieldErrors((prev) => ({ ...prev, nome: undefined }));
                }
              }}
              placeholder="Ex: Prateleira 1 - Itep 3"
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            id="descricao"
            label="Descrição"
            required
            error={fieldErrors.descricao}
          >
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (fieldErrors.descricao) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    descricao: undefined,
                  }));
                }
              }}
              placeholder="Ex: Documentos de 2024"
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            id="tags"
            label="Tags (separadas por vírgulas)"
            helperText="Opcional. Separe múltiplas tags com vírgula."
          >
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: 2025, documentos adm, papiloscopia"
              disabled={isSubmitting}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Fotos da Prateleira
              </label>
              <div className="border border-dashed border-border rounded-lg p-4">
                <label className="flex flex-col items-center justify-center cursor-pointer text-sm text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span>Selecione as imagens</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImagemChange}
                    disabled={isSubmitting}
                  />
                </label>
                {imagens.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {imagens.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Planilha da Prateleira
              </label>
              <div className="border border-dashed border-border rounded-lg p-4">
                <label className="flex flex-col items-center justify-center cursor-pointer text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-8 w-8 mb-2" />
                  <span>Selecionar planilha</span>
                  <input
                    type="file"
                    accept=".xlsx,.csv,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    className="hidden"
                    onChange={handlePlanilhaChange}
                    disabled={isSubmitting}
                  />
                </label>
                {planilhas.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {planilhas.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Criar Pasta"}
            </Button>
          </div>
          {submitError && (
            <div
              role="alert"
              className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
