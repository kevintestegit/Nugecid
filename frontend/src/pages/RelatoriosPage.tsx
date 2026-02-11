import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { getCardData, getRequisicoesPorMes, getStatusDistribuicao, CardData, FiltrosEstatisticas } from '@/services/estatisticasService';
import { exportRelatorioMensalPdf, exportRelatorioPdf } from '@/services/estatisticasExportService';
import { createLogger } from '@/utils/logger';
import { FileText, BarChart as BarChartIcon, PieChart as PieChartIcon, Download, Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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
  import('@/components/ui/BarChart').then(module => ({ default: module.BarChart })),
);
const LazyPieChart = lazy(() =>
  import('@/components/ui/PieChart').then(module => ({ default: module.PieChart })),
);
const LazyStatsCard = lazy(() =>
  import('@/components/ui/StatsCard').then(module => ({ default: module.StatsCard })),
);
const reportsLogger = createLogger("RelatoriosPage");

export function RelatoriosPage() {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [requisicoesPorMes, setRequisicoesPorMes] = useState<BarChartData[]>([]);
  const [statusDistribuicao, setStatusDistribuicao] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportingMensalPdf, setExportingMensalPdf] = useState(false);

  // Estados para filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
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

      setRequisicoesPorMes(reqArr.map((a: any) => ({ name: a.name, total: Number(a.total) || 0 })));
      setStatusDistribuicao(statusArr.map((s: any) => ({ name: s.name, value: Number(s.value) || 0 })));
      setError(null);
    } catch (err) {
      setError('Falha ao carregar os dados de estatísticas.');
      reportsLogger.error('Erro ao carregar dados de estatísticas', err);
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
    setDataInicio('');
    setDataFim('');
    setFiltrosAtivos({});
    setMostrarFiltros(false);
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportRelatorioPdf(filtrosAtivos);
    } catch (err) {
      reportsLogger.error('Erro ao exportar PDF', err);
      setError('Falha ao exportar relatório em PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportMensalPdf = async () => {
    try {
      setExportingMensalPdf(true);
      await exportRelatorioMensalPdf(selectedYear, selectedMonth);
    } catch (err) {
      reportsLogger.error('Erro ao exportar PDF mensal', err);
      setError('Falha ao exportar relatório mensal em PDF.');
    } finally {
      setExportingMensalPdf(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const temFiltrosAtivos = Object.keys(filtrosAtivos).length > 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              temFiltrosAtivos
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros {temFiltrosAtivos && `(${Object.keys(filtrosAtivos).length})`}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {exportingPdf ? 'Exportando...' : 'Exportar PDF Geral'}
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros de Período</h3>
            <button
              onClick={() => setMostrarFiltros(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAplicarFiltros} className="flex-1">
              Aplicar Filtros
            </Button>
            <Button
              onClick={handleLimparFiltros}
              variant="outline"
              className="flex-1"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Exibir erro se houver */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Seletor de mês/ano para relatório mensal */}
      <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Relatório Mensal:</span>
        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
          <SelectTrigger className="w-40 border-border/80 bg-background/70 text-foreground">
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
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-24 border-border/80 bg-background/70 text-foreground">
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
        <Button
          onClick={handleExportMensalPdf}
          disabled={exportingMensalPdf}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {exportingMensalPdf ? 'Exportando...' : 'Exportar PDF Mensal'}
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<div className="h-24 rounded-lg bg-muted/40" />}>
          <LazyStatsCard
            title="Total de Desarquivamentos"
            value={cardData?.totalDesarquivamentos ?? 0}
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          />
        </Suspense>
        <Suspense fallback={<div className="h-24 rounded-lg bg-muted/40" />}>
          <LazyStatsCard
            title="Requisições Pendentes"
            value={cardData?.requisicoesPendentes ?? 0}
            icon={<BarChartIcon className="h-4 w-4 text-muted-foreground" />}
          />
        </Suspense>
        <Suspense fallback={<div className="h-24 rounded-lg bg-muted/40" />}>
          <LazyStatsCard
            title="Requisições (Este Mês)"
            value={cardData?.requisicoesEsteMes ?? 0}
            icon={<PieChartIcon className="h-4 w-4 text-muted-foreground" />}
          />
        </Suspense>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Suspense fallback={<div className="h-[340px] rounded-lg bg-muted/40" />}>
            <LazyBarChart data={requisicoesPorMes} title="Requisições por Mês" />
          </Suspense>
        </div>
        <div className="col-span-3">
          <Suspense fallback={<div className="h-[340px] rounded-lg bg-muted/40" />}>
            <LazyPieChart data={statusDistribuicao} title="Distribuição por Status" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
