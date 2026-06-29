import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { useDailySummary } from "@/hooks/useDailySummary";
import { FileText, X, Clock, PackageCheck } from "lucide-react";

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === today) return "Hoje";
  if (dateStr === yesterdayStr) return "Ontem";

  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "SOLICITADO":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "RETIRADO_PELO_SETOR":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "SOLICITADO":
      return "Solicitado";
    case "RETIRADO_PELO_SETOR":
      return "Retirado pelo Setor";
    default:
      return status;
  }
}

export function DailySummaryModal() {
  const navigate = useNavigate();
  const { isOpen, isLoading, grupos, totalGeral, dismiss, close } =
    useDailySummary();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleItemClick = (id: number) => {
    close();
    navigate(`/desarquivamentos/${id}`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setDontShowAgain(checked);
    if (checked) {
      dismiss();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-5xl w-[90vw] p-0">
        <div className="flex flex-col h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-500" />
              Resumo Diário de Desarquivamentos
            </DialogTitle>
            <DialogDescription>
              {totalGeral}{" "}
              {totalGeral === 1
                ? "desarquivamento pendente"
                : "desarquivamentos pendentes"}{" "}
              de acompanhamento
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Carregando...
              </div>
            )}

            {!isLoading && grupos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <PackageCheck className="h-10 w-10 mb-2 opacity-50" />
                <p>Nenhum desarquivamento pendente</p>
              </div>
            )}

            <div className="space-y-6">
              {grupos.map((grupo) => (
                <div key={grupo.data}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {formatDateLabel(grupo.data)}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {grupo.total}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {grupo.itens.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="w-full flex items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {item.nomeCompleto}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.numeroProcesso || "Sem processo"} &middot;{" "}
                            {item.setorDemandante}
                          </p>
                        </div>
                        <Badge
                          className={`shrink-0 text-xs ${getStatusColor(item.status)}`}
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={dontShowAgain}
                onCheckedChange={handleCheckboxChange}
              />
              <span className="text-sm text-muted-foreground">
                Não visualizar mais essa notificação
              </span>
            </label>
            <Button variant="outline" size="sm" onClick={close}>
              <X className="h-4 w-4 mr-1.5" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
