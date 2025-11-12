import { useEffect, useState } from 'react';
import { BarChart } from '@/components/ui/BarChart';
import { PieChart } from '@/components/ui/PieChart';
import { StatsCard } from '@/components/ui/StatsCard';
import { getCardData, getAtendimentosPorMes, getStatusDistribuicao, CardData, exportRelatorioPdf, exportRelatorioMensalPdf } from '@/services/estatisticasService';
import { DollarSign, Users, BarChart as BarChartIcon, PieChart as PieChartIcon, Download, Calendar } from 'lucide-react';
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

export function RelatoriosPage() {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [atendimentosPorMes, setAtendimentosPorMes] = useState<BarChartData[]>([]);
  const [statusDistribuicao, setStatusDistribuicao] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportingMensalPdf, setExportingMensalPdf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cards, atendimentos, status] = await Promise.all([
          getCardData(),
          getAtendimentosPorMes(),
          getStatusDistribuicao(),
        ]);

        setCardData(cards ?? null);
        // Garantir arrays válidos antes de mapear
        const atendArr = Array.isArray(atendimentos) ? atendimentos : [];
        const statusArr = Array.isArray(status) ? status : [];

        setAtendimentosPorMes(atendArr.map((a: any) => ({ name: a.name, total: Number(a.total) || 0 })));
        setStatusDistribuicao(statusArr.map((s: any) => ({ name: s.name, value: Number(s.value) || 0 })));
      } catch (err) {
        setError('Falha ao carregar os dados de estatísticas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportRelatorioPdf();
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
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
      console.error('Erro ao exportar PDF mensal:', err);
      setError('Falha ao exportar relatório mensal em PDF.');
    } finally {
      setExportingMensalPdf(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <div className="flex items-center gap-4">
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

      {/* Seletor de mês/ano para relatório mensal */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Calendar className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Relatório Mensal:</span>
        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-24">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total de Desarquivamentos"
          value={cardData?.totalDesarquivamentos ?? 0}
          icon={<PieChartIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Atendimentos Pendentes"
          value={cardData?.atendimentosPendentes ?? 0}
          icon={<BarChartIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Atendimentos (Este Mês)"
          value={cardData?.atendimentosEsteMes ?? 0}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <BarChart data={atendimentosPorMes} title="Atendimentos por Mês (Último Ano)" />
        </div>
        <div className="col-span-3">
          <PieChart data={statusDistribuicao} title="Distribuição por Status" />
        </div>
      </div>
    </div>
  );
}
