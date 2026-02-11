import React, { useState } from "react";
import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { Desarquivamento, StatusDesarquivamento } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { formatDate } from "@/utils/date";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface ProrrogacaoNotificationProps {
  desarquivamentos: Desarquivamento[];
  onUpdateProrrogacao?: (
    id: number,
    aprovada: boolean,
    observacoes?: string,
  ) => Promise<void>;
  className?: string;
}

interface ProrrogacaoItem {
  desarquivamento: Desarquivamento;
  diasSolicitacao: number;
  prioridade: "alta" | "media" | "baixa";
}

const ProrrogacaoNotification: React.FC<ProrrogacaoNotificationProps> = ({
  desarquivamentos,
  onUpdateProrrogacao,
  className,
}) => {
  const [selectedItem, setSelectedItem] = useState<ProrrogacaoItem | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrar desarquivamentos com solicitação de prorrogação pendente
  const prorrogacoesPendentes = desarquivamentos
    .filter(
      (d) =>
        d.solicitacaoProrrogacao &&
        d.status !== StatusDesarquivamento.FINALIZADO &&
        d.status !== StatusDesarquivamento.NAO_LOCALIZADO,
    )
    .map((d) => {
      const solicitacaoDate = new Date(d.dataSolicitacao);
      const today = new Date();
      const diffTime = today.getTime() - solicitacaoDate.getTime();
      const diasSolicitacao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let prioridade: "alta" | "media" | "baixa" = "baixa";
      if (diasSolicitacao > 10) prioridade = "alta";
      else if (diasSolicitacao > 7) prioridade = "media";

      return {
        desarquivamento: d,
        diasSolicitacao,
        prioridade,
      };
    })
    .sort((a, b) => {
      // Ordenar por prioridade e depois por dias de solicitação
      const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
      if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
        return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
      }
      return b.diasSolicitacao - a.diasSolicitacao;
    });

  const handleOpenDialog = (item: ProrrogacaoItem) => {
    setSelectedItem(item);
    setObservacoes("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setObservacoes("");
    setIsDialogOpen(false);
  };

  const handleProcessProrrogacao = async (aprovada: boolean) => {
    if (!selectedItem || !onUpdateProrrogacao) return;

    setIsProcessing(true);
    try {
      await onUpdateProrrogacao(
        selectedItem.desarquivamento.id,
        aprovada,
        observacoes.trim() || undefined,
      );

      toast.success(
        aprovada
          ? "Prorrogação aprovada com sucesso!"
          : "Prorrogação negada com sucesso!",
      );

      handleCloseDialog();
    } catch (error) {
      toast.error("Erro ao processar prorrogação");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrioridadeBadge = (prioridade: "alta" | "media" | "baixa") => {
    const variants = {
      alta: { variant: "destructive" as const, label: "Alta Prioridade" },
      media: { variant: "default" as const, label: "Média Prioridade" },
      baixa: { variant: "secondary" as const, label: "Baixa Prioridade" },
    };
    return variants[prioridade];
  };

  const getPrioridadeIcon = (prioridade: "alta" | "media" | "baixa") => {
    const icons = {
      alta: <AlertTriangle className="w-4 h-4 text-red-500" />,
      media: <Clock className="w-4 h-4 text-yellow-500" />,
      baixa: <Bell className="w-4 h-4 text-blue-500" />,
    };
    return icons[prioridade];
  };

  if (prorrogacoesPendentes.length === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Nenhuma prorrogação pendente</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header com contador */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-orange-600" />
              <div>
                <CardTitle className="text-lg text-orange-900">
                  Solicitações de Prorrogação
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {prorrogacoesPendentes.length}{" "}
                  {prorrogacoesPendentes.length === 1
                    ? "solicitação pendente"
                    : "solicitações pendentes"}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-orange-300 text-orange-800"
            >
              {
                prorrogacoesPendentes.filter((p) => p.prioridade === "alta")
                  .length
              }{" "}
              Alta Prioridade
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de prorrogações */}
      <div className="space-y-3">
        {prorrogacoesPendentes.map((item) => {
          const { desarquivamento, diasSolicitacao, prioridade } = item;
          const prioridadeBadge = getPrioridadeBadge(prioridade);

          return (
            <Card
              key={desarquivamento.id}
              className={cn(
                "transition-all duration-200 hover:shadow-md cursor-pointer",
                prioridade === "alta" && "border-red-200 bg-red-50",
                prioridade === "media" && "border-yellow-200 bg-yellow-50",
                prioridade === "baixa" && "border-blue-200 bg-blue-50",
              )}
              onClick={() => handleOpenDialog(item)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      {getPrioridadeIcon(prioridade)}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {desarquivamento.nomeCompleto}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {desarquivamento.numeroNicLaudoAuto} •{" "}
                          {desarquivamento.setorDemandante}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Solicitado há {diasSolicitacao} dias</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{desarquivamento.status.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{desarquivamento.servidorResponsavel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={prioridadeBadge.variant}>
                      {prioridadeBadge.label}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {formatDate(desarquivamento.dataSolicitacao)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog para processar prorrogação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Processar Solicitação de Prorrogação</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <div className="space-y-2 mt-3">
                  <p>
                    <strong>Solicitante:</strong>{" "}
                    {selectedItem.desarquivamento.nomeCompleto}
                  </p>
                  <p>
                    <strong>Documento:</strong>{" "}
                    {selectedItem.desarquivamento.numeroNicLaudoAuto}
                  </p>
                  <p>
                    <strong>Setor:</strong>{" "}
                    {selectedItem.desarquivamento.setorDemandante}
                  </p>
                  <p>
                    <strong>Solicitado há:</strong>{" "}
                    {selectedItem.diasSolicitacao} dias
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações sobre a decisão..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleProcessProrrogacao(false)}
              disabled={isProcessing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Negar
            </Button>
            <Button
              onClick={() => handleProcessProrrogacao(true)}
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProrrogacaoNotification;
