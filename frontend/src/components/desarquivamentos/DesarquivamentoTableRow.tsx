import React from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from "@/components/ui";
import {
  StatusDesarquivamento,
  TipoDesarquivamento,
  Desarquivamento,
} from "@/types";
import {
  formatDate,
  getStatusLabel,
  getTipoDesarquivamentoLabel,
} from "@/utils/format";

interface DesarquivamentoTableRowProps {
  item: Desarquivamento;
  canEdit: boolean;
  canDelete: boolean;
  editingStatusId: number | null;
  onStartEditStatus: (id: number) => void;
  onUpdateStatus: (id: number, status: StatusDesarquivamento) => void;
  onOpenDetails: (id: number) => void;
  onDelete: (item: Desarquivamento) => void;
}

const stopPropagation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const STATUS_OPTIONS = [
  StatusDesarquivamento.SOLICITADO,
  StatusDesarquivamento.DESARQUIVADO,
  StatusDesarquivamento.RETIRADO_PELO_SETOR,
  StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO,
  StatusDesarquivamento.NAO_COLETADO,
  StatusDesarquivamento.NAO_LOCALIZADO,
  StatusDesarquivamento.FINALIZADO,
] as const;

const DesarquivamentoTableRowComponent: React.FC<
  DesarquivamentoTableRowProps
> = ({
  item,
  canEdit,
  canDelete,
  editingStatusId,
  onStartEditStatus,
  onUpdateStatus,
  onOpenDetails,
  onDelete,
}) => {
  const rowId = item.id;
  const isEditingStatus = editingStatusId === rowId;

  return (
    <TableRow
      className="hover:bg-muted cursor-pointer"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target && target.closest('[data-actions="true"]')) return;
        if (rowId) onOpenDetails(rowId);
      }}
    >
      <TableCell>
        <Badge variant="outline">
          {item.tipoDesarquivamento
            ? getTipoDesarquivamentoLabel(
                item.tipoDesarquivamento as TipoDesarquivamento,
              )
            : "-"}
        </Badge>
      </TableCell>
      <TableCell
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
      >
        {isEditingStatus && rowId ? (
          <Select
            value={item.status}
            onValueChange={(value) =>
              onUpdateStatus(rowId, value as StatusDesarquivamento)
            }
          >
            <SelectTrigger className="w-[130px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            onClick={() => rowId && onStartEditStatus(rowId)}
            variant={
              item.status === StatusDesarquivamento.FINALIZADO
                ? "default"
                : item.status === StatusDesarquivamento.NAO_LOCALIZADO
                  ? "destructive"
                  : item.status === StatusDesarquivamento.DESARQUIVADO
                    ? "secondary"
                    : "outline"
            }
            className="text-xs px-2 py-0.5 whitespace-nowrap leading-tight cursor-pointer"
          >
            {getStatusLabel(item.status)}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <span
          className="block max-w-[200px] truncate"
          title={item.nomeCompleto || ""}
        >
          {item.nomeCompleto || "-"}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="block max-w-[160px] truncate font-mono"
          title={item.numeroNicLaudoAuto || ""}
        >
          {item.numeroNicLaudoAuto || "-"}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="block max-w-[140px] truncate font-mono"
          title={item.numeroProcesso || ""}
        >
          {item.numeroProcesso || "-"}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="block max-w-[160px] truncate"
          title={item.tipoDocumento || ""}
        >
          {item.tipoDocumento || "-"}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(item.createdAt || item.dataSolicitacao)}
      </TableCell>
      <TableCell>
        {item.dataDesarquivamentoSAG
          ? formatDate(item.dataDesarquivamentoSAG)
          : "-"}
      </TableCell>
      <TableCell>
        {item.dataDevolucaoSetor ? formatDate(item.dataDevolucaoSetor) : "-"}
      </TableCell>
      <TableCell>{item.setorDemandante || "-"}</TableCell>
      <TableCell>{item.servidorResponsavel || "-"}</TableCell>
      <TableCell>{item.finalidadeDesarquivamento || "-"}</TableCell>
      <TableCell>{item.solicitacaoProrrogacao ? "Sim" : "Não"}</TableCell>
      <TableCell
        className="text-right"
        data-actions="true"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={stopPropagation}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {rowId ? (
              <DropdownMenuItem onSelect={() => onOpenDetails(rowId)}>
                Ver detalhes
              </DropdownMenuItem>
            ) : null}
            {canEdit && rowId ? (
              <DropdownMenuItem asChild>
                <Link to={`/desarquivamentos/${rowId}/editar`}>Editar</Link>
              </DropdownMenuItem>
            ) : null}
            {canDelete && rowId ? (
              <DropdownMenuItem onSelect={() => onDelete(item)}>
                Excluir
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export const DesarquivamentoTableRow = React.memo(
  DesarquivamentoTableRowComponent,
);
