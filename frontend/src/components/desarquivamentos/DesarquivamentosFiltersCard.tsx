import React from "react";
import { AlertCircle, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { SearchInput } from "@/components/ui/SearchInput";
import { DateRange, DateRangeInput } from "@/components/ui/DateRangeInput";
import { StatusDesarquivamento, TipoDesarquivamento } from "@/types";
import { getStatusLabel, getTipoDesarquivamentoLabel } from "@/utils/format";
import { INSTITUTOS } from "@/constants/institutos";
import { REQUERENTES } from "@/constants/requerentes";

interface DesarquivamentosFiltersCardProps {
  atencaoNecessariaFilter: boolean;
  searchTerm: string;
  statusFilter: string;
  dateRange: DateRange;
  tipoDesarquivamentoFilter: string;
  institutoFilter: string;
  requerenteFilter: string;
  onClearAtencaoNecessariaFilter: () => void;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onDateRangeChange: (value: DateRange) => void;
  onTipoDesarquivamentoFilter: (value: string) => void;
  onInstitutoFilter: (value: string) => void;
  onRequerenteFilter: (value: string) => void;
}

const DesarquivamentosFiltersCardComponent: React.FC<
  DesarquivamentosFiltersCardProps
> = ({
  atencaoNecessariaFilter,
  searchTerm,
  statusFilter,
  dateRange,
  tipoDesarquivamentoFilter,
  institutoFilter,
  requerenteFilter,
  onClearAtencaoNecessariaFilter,
  onSearch,
  onStatusFilter,
  onDateRangeChange,
  onTipoDesarquivamentoFilter,
  onInstitutoFilter,
  onRequerenteFilter,
}) => {
  return (
    <Card className="relative z-10 overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/70 shadow-sm backdrop-blur">
            <Filter className="h-4 w-4 text-primary" />
          </span>
          Filtros
        </CardTitle>
        <CardDescription>
          Use os filtros abaixo para encontrar solicitações específicas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {atencaoNecessariaFilter ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-red-200/70 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Filtro ativo: atenção necessária. Exibindo solicitações com status{" "}
              <strong>Solicitado</strong> há mais de 5 dias.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-8 px-2 text-red-700 hover:bg-red-100 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-900/30 dark:hover:text-red-200"
              onClick={onClearAtencaoNecessariaFilter}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Limpar
            </Button>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label
              htmlFor="search"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Buscar
            </label>
            <SearchInput
              id="search"
              name="search"
              placeholder="Buscar por código, requerente..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="status"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Status
            </label>
            <Select value={statusFilter} onValueChange={onStatusFilter}>
              <SelectTrigger id="status" name="status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value={StatusDesarquivamento.FINALIZADO}>
                  {getStatusLabel(StatusDesarquivamento.FINALIZADO)}
                </SelectItem>
                <SelectItem value={StatusDesarquivamento.DESARQUIVADO}>
                  {getStatusLabel(StatusDesarquivamento.DESARQUIVADO)}
                </SelectItem>
                <SelectItem value={StatusDesarquivamento.NAO_COLETADO}>
                  {getStatusLabel(StatusDesarquivamento.NAO_COLETADO)}
                </SelectItem>
                <SelectItem value={StatusDesarquivamento.SOLICITADO}>
                  {getStatusLabel(StatusDesarquivamento.SOLICITADO)}
                </SelectItem>
                <SelectItem
                  value={StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO}
                >
                  {getStatusLabel(
                    StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO,
                  )}
                </SelectItem>
                <SelectItem value={StatusDesarquivamento.RETIRADO_PELO_SETOR}>
                  {getStatusLabel(StatusDesarquivamento.RETIRADO_PELO_SETOR)}
                </SelectItem>
                <SelectItem value={StatusDesarquivamento.NAO_LOCALIZADO}>
                  {getStatusLabel(StatusDesarquivamento.NAO_LOCALIZADO)}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="dateRange"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Período
            </label>
            <DateRangeInput value={dateRange} onChange={onDateRangeChange} />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="tipoDesarquivamento"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Desarquivamento
            </label>
            <Select
              value={tipoDesarquivamentoFilter}
              onValueChange={onTipoDesarquivamentoFilter}
            >
              <SelectTrigger
                id="tipoDesarquivamento"
                name="tipoDesarquivamento"
              >
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value={TipoDesarquivamento.FISICO}>
                  {getTipoDesarquivamentoLabel(TipoDesarquivamento.FISICO)}
                </SelectItem>
                <SelectItem value={TipoDesarquivamento.DIGITAL}>
                  {getTipoDesarquivamentoLabel(TipoDesarquivamento.DIGITAL)}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="instituto"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Instituto
            </label>
            <Select value={institutoFilter} onValueChange={onInstitutoFilter}>
              <SelectTrigger id="instituto" name="instituto">
                <SelectValue placeholder="Todos os institutos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os institutos</SelectItem>
                {INSTITUTOS.map((instituto) => (
                  <SelectItem key={instituto.value} value={instituto.value}>
                    {instituto.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="requerente"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Requerente
            </label>
            <Select value={requerenteFilter} onValueChange={onRequerenteFilter}>
              <SelectTrigger id="requerente" name="requerente">
                <SelectValue placeholder="Todos os requerentes" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Todos os requerentes</SelectItem>
                {REQUERENTES.map((requerente) => (
                  <SelectItem key={requerente.value} value={requerente.value}>
                    {requerente.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DesarquivamentosFiltersCard = React.memo(
  DesarquivamentosFiltersCardComponent,
);
