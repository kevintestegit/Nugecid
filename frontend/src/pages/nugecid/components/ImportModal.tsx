import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useNugecidImport } from '@/hooks/useNugecidImport';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Loader2, CheckCircle, XCircle, FileWarning } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal = ({ isOpen, onClose, onImportSuccess }: ImportModalProps) => {
  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  }
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { handleFileImport, isLoading, importResult, error } = useNugecidImport(onImportSuccess);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      handleFileImport(selectedFile);
    }
  };



  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[625px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Importar Planilha de Registros</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="planilha">Planilha (.xlsx ou .csv)</Label>
            <Input id="planilha" type="file" accept=".xlsx,.csv" onChange={handleFileChange} />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-8 w-8 animate-spin" />
              <p>Processando, por favor aguarde...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro na Importação</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importResult && (
            (() => {
              const importErrors = importResult.errors ?? []
              return (
            <Alert variant={importErrors.length > 0 ? 'default' : 'default'}>
              {importErrors.length === 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <FileWarning className="h-4 w-4 text-yellow-500" />}
              <AlertTitle>Relatório de Importação</AlertTitle>
              <AlertDescription>
                <p><strong>Arquivo:</strong> {importResult.fileName}</p>
                <p><strong>Total de Registros na Planilha:</strong> {importResult.totalRecords}</p>
                <p className='text-green-600'><strong>Sucessos:</strong> {importResult.successCount}</p>
                <p className='text-red-600'><strong>Falhas:</strong> {importResult.errorCount}</p>
                <p><strong>Tempo de Processamento:</strong> {importResult.processingTime}</p>
                {importErrors.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-bold">Detalhes dos Erros:</h4>
                    <ul className="list-disc pl-5 mt-1 max-h-40 overflow-y-auto">
                      {importErrors.map((err, index) => (
                        <li key={index}><strong>Linha {err.line}:</strong> {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
              )
            })()
          )}

        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose}>Fechar</Button>
            
          
          <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
