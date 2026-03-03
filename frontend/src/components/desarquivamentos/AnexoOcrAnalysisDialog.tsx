import React from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { AnexoOcrAnalysis } from "@/types";

interface AnexoOcrAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: AnexoOcrAnalysis | null;
  isLoading: boolean;
}

const confidenceLabel: Record<"high" | "medium" | "low", string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const AnexoOcrAnalysisDialog: React.FC<AnexoOcrAnalysisDialogProps> = ({
  open,
  onOpenChange,
  analysis,
  isLoading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden border-border/60 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Leitura OCR do protocolo</DialogTitle>
          <DialogDescription>
            O sistema localiza nomes e blocos de assinatura a partir do texto
            OCR. Sempre confirme no documento original.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
            Processando análise OCR...
          </div>
        ) : !analysis ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma análise OCR disponível.
          </div>
        ) : (
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <section className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {analysis.nomeOriginal}
                  </h3>
                  <Badge variant="outline">
                    {analysis.ocrStatus || "sem status"}
                  </Badge>
                  {analysis.textAvailable && (
                    <Badge variant="outline">Texto OCR disponível</Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {analysis.processedAt
                    ? `Processado em ${new Date(
                        analysis.processedAt,
                      ).toLocaleString("pt-BR")}`
                    : "OCR ainda não processado."}
                </p>
                {analysis.error && (
                  <p className="mt-2 text-xs text-amber-700">
                    {analysis.error}
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-border/60 bg-background/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Assinaturas detectadas
                </h3>
                {analysis.signatures.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum bloco de assinatura foi identificado com confiança
                    útil.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {analysis.signatures.map((signature, index) => (
                      <div
                        key={`${signature.label}-${signature.signerName || "sem-nome"}-${index}`}
                        className="rounded-lg border border-border/60 bg-card/80 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{signature.label}</Badge>
                          <Badge variant="outline">
                            Confiança {confidenceLabel[signature.confidence]}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {signature.signerName || "Nome não identificado"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Linha OCR: {signature.matchedLine}
                        </p>
                        <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-foreground/85">
                          {signature.context.map((line, lineIndex) => (
                            <p key={`${lineIndex}-${line}`}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-border/60 bg-background/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Nomes prováveis encontrados
                </h3>
                {analysis.possibleNames.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    O OCR não retornou nomes fortes o suficiente para sugerir.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.possibleNames.map((name) => (
                      <Badge key={name} variant="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Texto OCR
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigator.clipboard.writeText(analysis.rawText || "")
                  }
                  disabled={!analysis.rawText}
                >
                  Copiar texto
                </Button>
              </div>
              <div className="max-h-[58vh] overflow-y-auto rounded-lg border border-border/50 bg-card p-3">
                <pre className="whitespace-pre-wrap break-words text-xs text-foreground/85">
                  {analysis.rawText ||
                    "Nenhum texto OCR disponível para este anexo."}
                </pre>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnexoOcrAnalysisDialog;
