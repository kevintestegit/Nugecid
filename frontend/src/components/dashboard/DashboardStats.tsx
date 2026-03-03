import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Link } from "react-router-dom";
import { Desarquivamento, StatusDesarquivamento } from "@/types";

interface DashboardStatsData {
  total: number;
  pendentes: number;
  urgentes: number;
  porTipo: Record<string, number>;
  porStatus: Record<string, number>;
  porInstituto?: Record<string, number>;
  recentes: Desarquivamento[];
  // Dados do mês anterior para comparação
  totalMesAnterior?: number;
  pendentesMesAnterior?: number;
  totalEsteMes?: number; // Adicionado para calcular tendência de fluxo
}

interface StatsCard {
  title: string;
  value: number;
  icon: typeof FileText;
  color: string;
  titleColor: string;
  bgColor: string;
  tendencia: { porcentagem: number; tipo: "alta" | "baixa" | "neutro" };
  link: string;
  destaque?: boolean;
}

interface DashboardStatsProps {
  data: DashboardStatsData;
  isLoading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  data,
  isLoading = false,
}) => {
  const calcularTendencia = (atual: number, anterior?: number) => {
    // Se não tem anterior (undefined/null), trata como neutro
    if (anterior === undefined || anterior === null)
      return { porcentagem: 0, tipo: "neutro" as const };

    // Caso especial: Anterior era 0
    if (anterior === 0) {
      if (atual > 0) return { porcentagem: 100, tipo: "alta" as const }; // De 0 para algo é infinito, usamos 100% simbólico
      return { porcentagem: 0, tipo: "neutro" as const }; // 0 para 0
    }

    const diferenca = atual - anterior;
    const porcentagem = Math.round((diferenca / anterior) * 100);

    if (porcentagem > 5) return { porcentagem, tipo: "alta" as const };
    if (porcentagem < -5) return { porcentagem, tipo: "baixa" as const };
    return { porcentagem, tipo: "neutro" as const };
  };

  // Se tivermos o dado deste mês (fluxo), usamos ele para comparar com o fluxo do mês passado.
  // Se não, usamos o total acumulado (que gera distorção se comparado com fluxo mensal).
  const valorParaCompararTotal =
    data.totalEsteMes !== undefined ? data.totalEsteMes : data.total;

  const tendenciaTotal = calcularTendencia(
    valorParaCompararTotal,
    data?.totalMesAnterior,
  );
  const tendenciaPendentes = calcularTendencia(
    data?.pendentes || 0,
    data?.pendentesMesAnterior,
  );

  const urgentesCount = data?.urgentes || 0;

  const statsCards: StatsCard[] = [
    {
      title: "Total de Solicitações",
      value: data?.total || 0,
      icon: FileText,
      color: "text-blue-600",
      titleColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      tendencia: tendenciaTotal,
      link: "/desarquivamentos",
    },
    {
      title: "Atenção necessária",
      value: data?.pendentes || 0,
      icon: Clock,
      color: "text-red-600",
      titleColor: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      tendencia: tendenciaPendentes,
      link:
        `/desarquivamentos?status=${StatusDesarquivamento.SOLICITADO}` +
        "&atencaoNecessaria=true",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted/40 rounded w-32"></div>
                <div className="h-10 w-10 bg-muted/40 rounded-lg"></div>
              </CardHeader>
              <CardContent>
                <div className="h-9 bg-muted/40 rounded w-20 mb-2"></div>
                <div className="h-4 bg-muted/40 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.tendencia.tipo === "alta"
              ? TrendingUp
              : stat.tendencia.tipo === "baixa"
                ? TrendingDown
                : Minus;

          return (
            <Link key={index} to={stat.link}>
              <Card
                className={cn(
                  "relative h-[198px] overflow-hidden cursor-pointer rounded-[1.25rem] border border-border/60 bg-card/85 backdrop-blur-xl shadow-[0_16px_34px_-28px_rgba(15,23,42,0.55)]",
                )}
              >
                <Icon
                  className={cn(
                    "pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 opacity-[0.10]",
                    stat.color,
                  )}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/60 to-transparent dark:from-white/5" />
                <CardHeader className="items-center pb-1 text-center pt-4">
                  <div className="flex h-8 items-center justify-center">
                    <CardTitle
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.14em]",
                        stat.titleColor,
                      )}
                    >
                      {stat.title}
                    </CardTitle>
                  </div>
                  <div
                    className={cn(
                      "mt-1 rounded-lg p-1.5 ring-1 ring-white/60 shadow-sm backdrop-blur",
                      stat.bgColor,
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-0 pb-4 text-center">
                  <div className="mb-1.5 text-[2.25rem] leading-none font-black tracking-tight text-foreground">
                    {(stat.value ?? 0).toLocaleString()}
                  </div>

                  {stat.tendencia.porcentagem !== 0 && (
                    <div
                      className={cn(
                        "mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        stat.tendencia.tipo === "alta" &&
                          "bg-green-100/80 text-green-700 ring-green-200 dark:bg-green-950/40 dark:text-green-400 dark:ring-green-800",
                        stat.tendencia.tipo === "baixa" &&
                          "bg-red-100/80 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800",
                        stat.tendencia.tipo === "neutro" &&
                          "bg-gray-100/80 text-gray-700 ring-gray-200 dark:bg-gray-950/40 dark:text-gray-400 dark:ring-gray-800",
                      )}
                    >
                      <TrendIcon className="h-3 w-3" />
                      <span>{Math.abs(stat.tendencia.porcentagem)}%</span>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    {stat.tendencia.tipo === "alta" &&
                      `${stat.tendencia.porcentagem}% em relação ao mês anterior`}
                    {stat.tendencia.tipo === "baixa" &&
                      `${stat.tendencia.porcentagem}% em relação ao mês anterior`}
                    {stat.tendencia.tipo === "neutro" &&
                      "Sem mudanças significativas"}
                  </p>

                  {stat.destaque && stat.value === 0 && (
                    <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                      Tudo em dia
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Urgentes - Destaque especial */}
      {urgentesCount > 0 && (
        <Link to="/desarquivamentos?urgente=true">
          <Card className="group relative overflow-hidden cursor-pointer border-l-4 border-l-red-500 bg-red-50/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-34px_rgba(239,68,68,0.7)] dark:bg-red-950/20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-red-500/10 to-transparent" />
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2 ring-1 ring-red-200 dark:bg-red-950/50 dark:ring-red-700/30">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Solicitações Urgentes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requerem atenção imediata
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {urgentesCount}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Gráfico por Instituto */}
      {data.porInstituto && Object.keys(data.porInstituto).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Desarquivamentos por Instituto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.porInstituto).map(([instituto, count]) => {
                const total = Object.values(data.porInstituto || {}).reduce(
                  (a, b) => a + b,
                  0,
                );
                const percentage =
                  total > 0 ? Math.round((count / total) * 100) : 0;
                const instituteName =
                  instituto === "IC"
                    ? "Instituto de Criminalística"
                    : instituto === "II"
                      ? "Instituto de Identificação"
                      : instituto === "IML"
                        ? "Instituto de Medicina Legal"
                        : instituto;

                return (
                  <div
                    key={instituto}
                    className="space-y-1 rounded-xl border border-border/40 bg-background/45 p-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{instituteName}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/40/80 rounded-full h-2.5 dark:bg-gray-800/60">
                      <div
                        className={cn(
                          "h-2.5 rounded-full transition-all",
                          instituto === "IC"
                            ? "bg-blue-600"
                            : instituto === "II"
                              ? "bg-green-600"
                              : instituto === "IML"
                                ? "bg-purple-600"
                                : "bg-gray-600",
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
