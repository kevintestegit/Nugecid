import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface StatsData {
  total: number;
  pendente: number;
  emAnalise: number;
  aprovado: number;
  expirados: number;
}

interface ListingStatsProps {
  stats: StatsData;
  isLoading?: boolean;
  className?: string;
}

const ListingStats: React.FC<ListingStatsProps> = ({
  stats,
  isLoading = false,
  className,
}) => {
  const statsItems = [
    {
      label: "Total",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      label: "Pendentes",
      value: stats.pendente,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      label: "Em Análise",
      value: stats.emAnalise,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      label: "Aprovados",
      value: stats.aprovado,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      label: "Expirados",
      value: stats.expirados,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4",
          className,
        )}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1" />
                  <div className="h-6 bg-gray-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4",
        className,
      )}
    >
      {statsItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <Card
            key={index}
            className={cn(
              "border transition-all hover:shadow-md",
              item.borderColor,
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg",
                    item.bgColor,
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress bar for visual representation */}
              {stats.total > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        item.color.replace("text-", "bg-"),
                      )}
                      style={{
                        width: `${Math.min((item.value / stats.total) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total > 0
                      ? Math.round((item.value / stats.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ListingStats;
export type { StatsData, ListingStatsProps };
