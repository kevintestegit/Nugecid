import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, User, CheckCircle, XCircle } from "lucide-react";
import { useDesarquivamentoHistorico } from "@/hooks/useDesarquivamentoHistorico";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  buildHistoricoMessage,
  isActionHistoricoEntry,
  type HistoricoMessageTone,
} from "@/utils/desarquivamentoHistoricoMessages";

interface HistoricoTimelineProps {
  desarquivamentoId: number;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "CREATE":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "UPDATE":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "DELETE":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActionColor = (tone: HistoricoMessageTone) => {
  switch (tone) {
    case "create":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "status":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300";
    case "update":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "delete":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "comment":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export const HistoricoTimeline: React.FC<HistoricoTimelineProps> = ({
  desarquivamentoId,
}) => {
  const {
    data: historico,
    isLoading,
    error,
  } = useDesarquivamentoHistorico(desarquivamentoId);

  const historicoAcoes = useMemo(
    () => (historico ?? []).filter(isActionHistoricoEntry),
    [historico],
  );

  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
          <CardDescription className="text-red-500">
            Erro ao carregar histórico
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!historicoAcoes.length) return null;

  return (
    <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Ações
        </CardTitle>
        <CardDescription>
          {historicoAcoes.length}{" "}
          {historicoAcoes.length === 1 ? "ação registrada" : "ações registradas"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {historicoAcoes.map((item) => {
              const message = buildHistoricoMessage(item);
              return (
                <div key={item.id} className="relative pl-10">
                  <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background">
                    {getActionIcon(item.action)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-xs", getActionColor(message.tone))}>
                        {message.categoryLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>

                    {item.user && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{item.user.nome}</span>
                      </div>
                    )}

                    <p className="text-sm font-medium text-foreground">
                      {message.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {message.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
