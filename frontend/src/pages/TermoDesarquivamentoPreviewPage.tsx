import React, { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  useDownloadTermoDocx,
  useDownloadTermoPdf,
  useTermoPreviewHtml,
} from "@/hooks/useDesarquivamentos";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoading } from "@/components/ui/Loading";

const TermoDesarquivamentoPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  const numericId = useMemo(() => Number(id), [id]);
  const isIdValid = Number.isFinite(numericId) && numericId > 0;

  const {
    data: previewHtml,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTermoPreviewHtml(isIdValid ? numericId : undefined);
  const downloadPdfMutation = useDownloadTermoPdf();
  const downloadDocxMutation = useDownloadTermoDocx();

  if (!isIdValid) {
    return <Navigate to="/404" replace />;
  }

  const handlePrint = () => {
    const targetWindow = iframeRef.current?.contentWindow;

    if (!targetWindow) {
      toast.error("A pré-visualização ainda não está pronta para impressão.");
      return;
    }

    targetWindow.focus();
    targetWindow.print();
  };

  const handleDownloadTermo = (format: "pdf" | "docx") => {
    const mutation =
      format === "pdf" ? downloadPdfMutation : downloadDocxMutation;

    mutation.mutate(numericId, {
      onSuccess: () => {
        toast.success(
          format === "pdf"
            ? "Termo em PDF gerado com sucesso."
            : "Termo em Word gerado com sucesso.",
        );
      },
      onError: (downloadError: unknown) => {
        toast.error(
          downloadError instanceof Error
            ? downloadError.message
            : "Não foi possível gerar o termo.",
        );
      },
    });
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !previewHtml) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.75)] backdrop-blur">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Pré-visualização do termo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Solicitação #{numericId}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Card className="border-border/60 bg-card/90 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)]">
          <CardHeader>
            <CardTitle>Não foi possível carregar o termo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "O termo não pôde ser carregado para pré-visualização."}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.75)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Pré-visualização do termo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revise o layout antes de imprimir ou baixar o documento final.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
              disabled={!isIframeReady}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadTermo("pdf")}
              disabled={downloadPdfMutation.isPending}
            >
              <FileText className="h-4 w-4" />
              {downloadPdfMutation.isPending ? "Gerando PDF..." : "Baixar PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadTermo("docx")}
              disabled={downloadDocxMutation.isPending}
            >
              <Download className="h-4 w-4" />
              {downloadDocxMutation.isPending
                ? "Gerando Word..."
                : "Baixar Word"}
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 bg-card/90 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)]">
        <CardContent className="p-0">
          <div className="border-b border-border/60 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
            {isFetching
              ? "Atualizando pré-visualização..."
              : "A impressão usa o layout exibido abaixo."}
          </div>
          <iframe
            ref={iframeRef}
            title="Pré-visualização do termo de desarquivamento"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="h-[calc(100vh-18rem)] min-h-[720px] w-full bg-white"
            onLoad={() => setIsIframeReady(true)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TermoDesarquivamentoPreviewPage;
