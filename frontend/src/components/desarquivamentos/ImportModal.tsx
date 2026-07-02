import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useDesarquivamentosImport } from "@/hooks/useDesarquivamentosImport";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileWarning,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal = ({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { handleFileImport, isLoading, importResult, error } =
    useDesarquivamentosImport(onImportSuccess);
  const importErrors = importResult?.errors ?? [];

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

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
          <AlertDialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Planilha de Desarquivamentos
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="planilha">Planilha (.xlsx ou .csv)</Label>
            <Input
              id="planilha"
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um arquivo Excel (.xlsx) ou CSV (.csv) com os dados dos
              desarquivamentos.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4 bg-blue-500/10 rounded-lg">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-blue-800 dark:text-blue-200">
                Processando planilha, por favor aguarde...
              </p>
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
            <Alert
              variant={importResult.errorCount > 0 ? "default" : "default"}
            >
              {importResult.errorCount === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <FileWarning className="h-4 w-4 text-yellow-500" />
              )}
              <AlertTitle>Relatório de Importação</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Arquivo:</strong>{" "}
                    {importResult.fileName || selectedFile?.name}
                  </p>
                  <p>
                    <strong>Total de Registros:</strong>{" "}
                    {importResult.totalRecords}
                  </p>
                  <p className="text-green-600">
                    <strong>Sucessos:</strong> {importResult.successCount}
                  </p>
                  {importResult.errorCount > 0 && (
                    <p className="text-red-600 dark:text-red-400">
                      <strong>Falhas:</strong> {importResult.errorCount}
                    </p>
                  )}
                  {importResult.processingTime && (
                    <p>
                      <strong>Tempo de Processamento:</strong>{" "}
                      {importResult.processingTime}
                    </p>
                  )}

                  {importErrors.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm">
                          Detalhes dos Erros ({importErrors.length}):
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const errosTexto = importErrors
                                .map(
                                  (err) =>
                                    `Linha ${err.line || err.row}: ${err.error || (err.details && typeof err.details === "object" && "message" in err.details ? String((err.details as Record<string, unknown>).message) : JSON.stringify(err.details))}`,
                                )
                                .join("\n");
                              navigator.clipboard.writeText(errosTexto);
                              toast.success(
                                "Erros copiados para área de transferência!",
                              );
                            }}
                          >
                            📋 Copiar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const errosTexto = importErrors
                                .map(
                                  (err) =>
                                    `Linha ${err.line || err.row}: ${err.error || (err.details && typeof err.details === "object" && "message" in err.details ? String((err.details as Record<string, unknown>).message) : JSON.stringify(err.details))}`,
                                )
                                .join("\n");
                              const blob = new Blob([errosTexto], {
                                type: "text/plain",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `erros_importacao_${new Date().toISOString().slice(0, 10)}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            📥 Baixar
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <ul className="space-y-2">
                          {importErrors.map((err, index) => (
                            <li
                              key={index}
                              className="text-sm border-b border-red-500/10 pb-2 last:border-0"
                            >
                              <div className="font-semibold text-red-700 dark:text-red-300">
                                📍 Linha {err.line || err.row}:
                              </div>
                              <div className="text-red-600 dark:text-red-400 mt-1">
                                {err.error ||
                                  (err.details &&
                                  typeof err.details === "object" &&
                                  "message" in err.details
                                    ? String(
                                        (err.details as Record<string, unknown>)
                                          .message,
                                      )
                                    : JSON.stringify(err.details))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-semibold">
                        ⚠️ Nenhum registro foi importado. Corrija os erros na
                        planilha e tente novamente.
                      </p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {importResult ? "Fechar" : "Cancelar"}
          </Button>

          {!importResult && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
