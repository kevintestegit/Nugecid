import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { CreatePastaInput } from '@/hooks/usePastas';

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
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tags, setTags] = useState('');
  const [imagens, setImagens] = useState<File[]>([]);
  const [planilhas, setPlanilhas] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      await onAddPasta({
        nome,
        descricao,
        tags: tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        imagens,
        planilhas,
      });
      setNome('');
      setDescricao('');
      setTags('');
      setImagens([]);
      setPlanilhas([]);
      onClose();
    } catch (error) {
      console.error('Erro ao criar pasta', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Nova Pasta/Prateleira</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Nome
              </label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Prateleira 1 - Itep 3"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Descrição
              </label>
              <Input
                id="descricao"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Documentos de 2024"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Tags (separadas por vírgulas)
              </label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Ex: 2025, documentos adm, papiloscopia"
                disabled={isSubmitting}
              />
            </div>

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
                      {imagens.map(file => (
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
                      accept=".xls,.xlsx,.csv,.ods,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      className="hidden"
                      onChange={handlePlanilhaChange}
                      disabled={isSubmitting}
                    />
                  </label>
                  {planilhas.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {planilhas.map(file => (
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
                {isSubmitting ? 'Salvando...' : 'Criar Pasta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
