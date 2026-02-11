import React from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  Desarquivamento,
  StatusDesarquivamento,
  TipoDesarquivamento,
} from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatDate } from "@/utils/date";
import { cn } from "@/utils/cn";

interface DesarquivamentosTableProps {
  desarquivamentos: Desarquivamento[];
  isLoading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  className?: string;
}

const DesarquivamentosTable: React.FC<DesarquivamentosTableProps> = ({
  desarquivamentos,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  className,
}) => {
  const getStatusBadgeVariant = (
    status: StatusDesarquivamento,
  ): "default" | "destructive" | "outline" | "secondary" => {
    const variants = {
      [StatusDesarquivamento.FINALIZADO]: "default",
      [StatusDesarquivamento.DESARQUIVADO]: "secondary",
      [StatusDesarquivamento.NAO_COLETADO]: "destructive",
      [StatusDesarquivamento.SOLICITADO]: "outline",
      [StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO]: "secondary",
      [StatusDesarquivamento.RETIRADO_PELO_SETOR]: "default",
      [StatusDesarquivamento.NAO_LOCALIZADO]: "destructive",
    } as const;
    return variants[status] || "outline";
  };

  const getTipoDesarquivamentoBadgeVariant = (
    tipo: TipoDesarquivamento,
  ): "default" | "destructive" | "outline" | "secondary" => {
    const variants = {
      [TipoDesarquivamento.FISICO]: "default",
      [TipoDesarquivamento.DIGITAL]: "secondary",
      [TipoDesarquivamento.NAO_LOCALIZADO]: "destructive",
    } as const;
    return variants[tipo] || "outline";
  };

  const isOverdue = (
    dataSolicitacao: string,
    status: StatusDesarquivamento,
  ) => {
    if (
      status === StatusDesarquivamento.FINALIZADO ||
      status === StatusDesarquivamento.DESARQUIVADO ||
      status === StatusDesarquivamento.RETIRADO_PELO_SETOR
    ) {
      return false;
    }

    const solicitacaoDate = new Date(dataSolicitacao);
    const today = new Date();
    const diffTime = today.getTime() - solicitacaoDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 5;
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white rounded-lg shadow-sm border border-gray-200",
          className,
        )}
      >
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (desarquivamentos.length === 0) {
    return (
      <div
        className={cn(
          "bg-white rounded-lg shadow-sm border border-gray-200",
          className,
        )}
      >
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Não há desarquivamentos cadastrados no momento
          </p>
          <Button asChild>
            <Link to="/nugecid/novo">Criar Primeiro Registro</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Nº NIC/LAUDO/AUTO/IT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Solicitação</TableHead>
              <TableHead>Setor Demandante</TableHead>
              <TableHead>Prorrogação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {desarquivamentos.map((desarquivamento) => (
              <TableRow
                key={desarquivamento.id}
                className={cn(
                  "hover:bg-gray-50",
                  isOverdue(
                    desarquivamento.dataSolicitacao,
                    desarquivamento.status,
                  ) && "bg-red-50 hover:bg-red-100",
                )}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {isOverdue(
                      desarquivamento.dataSolicitacao,
                      desarquivamento.status,
                    ) && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <div>
                      <p className="font-medium text-gray-900">
                        {desarquivamento.nomeCompleto}
                      </p>
                      <p className="text-sm text-gray-500">
                        {desarquivamento.numeroProcesso}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <p className="font-mono text-sm">
                    {desarquivamento.numeroNicLaudoAuto}
                  </p>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={getTipoDesarquivamentoBadgeVariant(
                      (desarquivamento.desarquivamentoFisicoDigital as TipoDesarquivamento) ||
                        desarquivamento.tipoDesarquivamento,
                    )}
                  >
                    {desarquivamento.desarquivamentoFisicoDigital ||
                      desarquivamento.tipoDesarquivamento}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(desarquivamento.status)}
                  >
                    {desarquivamento.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {formatDate(desarquivamento.dataSolicitacao)}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-sm">{desarquivamento.setorDemandante}</p>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      desarquivamento.solicitacaoProrrogacao
                        ? "default"
                        : "secondary"
                    }
                  >
                    {desarquivamento.solicitacaoProrrogacao ? "Sim" : "Não"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView?.(desarquivamento.id)}
                      asChild
                    >
                      <Link to={`/nugecid/${desarquivamento.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(desarquivamento.id)}
                      asChild
                    >
                      <Link to={`/nugecid/${desarquivamento.id}/editar`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(desarquivamento.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legenda para itens em atraso */}
      {desarquivamentos.some((d) => isOverdue(d.dataSolicitacao, d.status)) && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span>Registros destacados estão há mais de 5 dias sem coleta</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesarquivamentosTable;
