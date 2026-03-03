import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  getCardData,
  getRequisicoesPorMes,
  getStatusDistribuicao,
  CardData,
  ChartData,
  FiltrosEstatisticas,
} from "@/services/estatisticasService";
import {
  exportRelatorioMensalPdf,
  exportRelatorioPdf,
} from "@/services/estatisticasExportService";
import { createLogger } from "@/utils/logger";
import {
  FileText,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Filter,
  X,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { SkeletonStatsCard, Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";

// Tipos específicos para os dados dos gráficos
interface BarChartData {
  name: string;
  total: number;
}

interface PieChartData {
  name: string;
  value: number;
}

const LazyBarChart = lazy(() =>
  import("@/components/ui/BarChart").then((module) => ({
    default: module.BarChart,
  })),
);
const LazyPieChart = lazy(() =>
  import("@/components/ui/PieChart").then((module) => ({
    default: module.PieChart,
  })),
);
const LazyStatsCard = lazy(() =>
  import("@/components/ui/StatsCard").then((module) => ({
    default: module.StatsCard,
  })),
);
const reportsLogger = createLogger("RelatoriosPage");

export function RelatoriosPage() {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [requisicoesPorMes, setRequisicoesPorMes] = useState<BarChartData[]>(
    [],
  );
  const [statusDistribuicao, setStatusDistribuicao] = useState<PieChartData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportingMensalPdf, setExportingMensalPdf] = useState(false);

  // Estados para filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [filtrosAtivos, setFiltrosAtivos] = useState<FiltrosEstatisticas>({});

  const fetchData = useCallback(async (filtros: FiltrosEstatisticas) => {
    try {
      setLoading(true);
      const [cards, requisicoes, status] = await Promise.all([
        getCardData(filtros),
        getRequisicoesPorMes(filtros),
        getStatusDistribuicao(filtros),
      ]);

      setCardData(cards ?? null);
      // Garantir arrays válidos antes de mapear
      const reqArr = Array.isArray(requisicoes) ? requisicoes : [];
      const statusArr = Array.isArray(status) ? status : [];

      setRequisicoesPorMes(
        reqArr.map((a: ChartData) => ({
          name: a.name,
          total: Number(a.total) || 0,
        })),
      );
      setStatusDistribuicao(
        statusArr.map((s: ChartData) => ({
          name: s.name,
          value: Number(s.value) || 0,
        })),
      );
      setError(null);
    } catch (err) {
      setError("Falha ao carregar os dados de estatísticas.");
      reportsLogger.error("Erro ao carregar dados de estatísticas", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filtrosAtivos);
  }, [fetchData, filtrosAtivos]);

  const handleAplicarFiltros = () => {
    const novosFiltros: FiltrosEstatisticas = {};
    if (dataInicio) novosFiltros.dataInicio = dataInicio;
    if (dataFim) novosFiltros.dataFim = dataFim;
    setFiltrosAtivos(novosFiltros);
    setMostrarFiltros(false);
  };

  const handleLimparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setFiltrosAtivos({});
    setMostrarFiltros(false);
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportRelatorioPdf(filtrosAtivos);
    } catch (err) {
      reportsLogger.error("Erro ao exportar PDF", err);
      setError("Falha ao exportar relatório em PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportMensalPdf = async () => {
    try {
      setExportingMensalPdf(true);
      await exportRelatorioMensalPdf(selectedYear, selectedMonth);
    } catch (err) {
      reportsLogger.error("Erro ao exportar PDF mensal", err);
      setError("Falha ao exportar relatório mensal em PDF.");
    } finally {
      setExportingMensalPdf(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const temFiltrosAtivos = Object.keys(filtrosAtivos).length > 0;

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Relatórios Gerenciais
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize métricas, exporte dados e acompanhe o desempenho do
              sistema
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              variant="outline"
              size="sm"
              className={cn(
                "border-border/60 bg-background/70 backdrop-blur transition-all",
                temFiltrosAtivos && "border-primary/50 text-primary",
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros{" "}
              {temFiltrosAtivos && `(${Object.keys(filtrosAtivos).length})`}
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={exportingPdf || loading}
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              {exportingPdf ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar PDF Geral
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros Modal / Card */}
      {mostrarFiltros && (
        <Card className="relative z-10 overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] animate-in slide-in-from-top-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/70 shadow-sm backdrop-blur">
                  <Filter className="h-4 w-4 text-primary" />
                </span>
                Filtros de Período
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMostrarFiltros(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Data Início
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Data Fim
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAplicarFiltros} size="sm">
                Aplicar Filtros
              </Button>
              <Button onClick={handleLimparFiltros} variant="outline" size="sm">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-600">
          <X className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Relatório Mensal Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card/85 p-4 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.6)] backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            Relatório Mensal
          </span>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExportMensalPdf}
          disabled={exportingMensalPdf || loading}
          variant="secondary"
          size="sm"
          className="ml-auto"
        >
          {exportingMensalPdf ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          Exportar PDF Mensal
        </Button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <Skeleton variant="text" width={140} height={20} />
                <Skeleton variant="circular" width={40} height={40} />
              </div>
              <Skeleton
                variant="text"
                width={80}
                height={32}
                className="mb-2"
              />
              <Skeleton variant="text" width={120} height={14} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<SkeletonStatsCard />}>
            <LazyStatsCard
              title="Total de Desarquivamentos"
              value={cardData?.totalDesarquivamentos ?? 0}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
          </Suspense>
          <Suspense fallback={<SkeletonStatsCard />}>
            <LazyStatsCard
              title="Requisições Pendentes"
              value={cardData?.requisicoesPendentes ?? 0}
              icon={<BarChartIcon className="h-4 w-4 text-muted-foreground" />}
            />
          </Suspense>
          <Suspense fallback={<SkeletonStatsCard />}>
            <LazyStatsCard
              title="Requisições (Este Mês)"
              value={cardData?.requisicoesEsteMes ?? 0}
              icon={<PieChartIcon className="h-4 w-4 text-muted-foreground" />}
            />
          </Suspense>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Requisições por Mês</CardTitle>
            <CardDescription>
              Volume de solicitações ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-end justify-between gap-2 px-4 pb-4">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    className="w-full rounded-t-sm"
                    height={`${h}%`}
                  />
                ))}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="h-[300px] animate-pulse rounded-lg bg-muted/40" />
                }
              >
                <LazyBarChart data={requisicoesPorMes} title="" />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
            <CardDescription>Situação atual das requisições</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton variant="circular" width={200} height={200} />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="h-[300px] animate-pulse rounded-lg bg-muted/40" />
                }
              >
                <LazyPieChart data={statusDistribuicao} title="" />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
