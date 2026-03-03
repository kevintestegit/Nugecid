import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useFeriados } from "@/hooks/useFeriados";
import { FERIADOS_TIPO_LABELS, type FeriadoTipo } from "@/constants/feriadosBR";
import { cn } from "@/utils/cn";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface PrazoItem {
  id: number;
  titulo: string;
  data: string;
  tipo: "devolucao" | "solicitacao";
  urgente?: boolean;
}

interface PrazosCalendarProps {
  prazos: PrazoItem[];
  isLoading?: boolean;
}

const ISO_DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_UTC_MIDNIGHT_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T\s]00:00:00(?:\.\d{1,3})?(?:Z|[+-]00:00)$/i;
const BR_DATE_ONLY_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const holidayTypeAccentClasses: Record<FeriadoTipo, string> = {
  nacional: "bg-emerald-500",
  estadual: "bg-amber-500",
  municipal: "bg-violet-500",
  ponto_facultativo: "bg-sky-500",
};

const holidayTypePanelClasses: Record<FeriadoTipo, string> = {
  nacional:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  estadual:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  municipal:
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  ponto_facultativo:
    "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolveCalendarDateKey = (value: string): string | null => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;

  const dateOnlyMatch = normalizedValue.match(ISO_DATE_ONLY_REGEX);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${year}-${month}-${day}`;
  }

  const utcMidnightMatch = normalizedValue.match(ISO_UTC_MIDNIGHT_REGEX);
  if (utcMidnightMatch) {
    const [, year, month, day] = utcMidnightMatch;
    return `${year}-${month}-${day}`;
  }

  const brDateMatch = normalizedValue.match(BR_DATE_ONLY_REGEX);
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return toDateKey(parsedDate);
};

const PrazosCalendar: React.FC<PrazosCalendarProps> = ({
  prazos,
  isLoading,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const currentYear = currentDate.getFullYear();
  const { getFeriadosForDay } = useFeriados(currentYear);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
    setActiveDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
    setActiveDay(null);
  };

  const prazosByDate = useMemo(() => {
    const grouped = new Map<string, PrazoItem[]>();

    prazos.forEach((prazo) => {
      const dateKey = resolveCalendarDateKey(prazo.data);
      if (!dateKey) return;

      const currentItems = grouped.get(dateKey) ?? [];
      currentItems.push(prazo);
      grouped.set(dateKey, currentItems);
    });

    return grouped;
  }, [prazos]);

  const getPrazosForDay = (day: number) => {
    const dateStr = toDateKey(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
    );
    return prazosByDate.get(dateStr) ?? [];
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (isLoading) {
    return (
      <Card className="relative overflow-visible border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/10 dark:ring-white/5 shadow-sm backdrop-blur">
              <Calendar className="h-4 w-4 text-primary" />
            </span>
            Calendário de Prazos
          </CardTitle>
        </CardHeader>
        <CardContent className="relative overflow-visible">
          <div className="animate-pulse space-y-3">
            <div className="h-8 rounded bg-muted"></div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-muted"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-visible border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/10 dark:ring-white/5 shadow-sm backdrop-blur">
              <Calendar className="h-4 w-4 text-primary" />
            </span>
            Calendário de Prazos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium capitalize">
              {monthName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative overflow-visible">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPrazos = getPrazosForDay(day);
            const hasPrazos = dayPrazos.length > 0;
            const hasUrgente = dayPrazos.some((prazo) => prazo.urgente);
            const dayFeriados = getFeriadosForDay(day, currentDate.getMonth());
            const isFeriado = dayFeriados.length > 0;
            const isActive = activeDay === day;
            const tooltipId = `calendar-day-details-${currentYear}-${currentDate.getMonth()}-${day}`;

            const dayColumn = (firstDay + i) % 7;
            const dayRow = Math.floor((firstDay + i) / 7);
            const horizontalTooltipClass =
              dayColumn <= 1
                ? "left-0"
                : dayColumn >= 5
                  ? "right-0"
                  : "left-1/2 -translate-x-1/2";
            const verticalTooltipClass =
              dayRow <= 1 ? "top-full mt-2" : "bottom-full mb-2";

            return (
              <div
                key={day}
                className="relative"
                onMouseEnter={() => {
                  if (hasPrazos || isFeriado) {
                    setActiveDay(day);
                  }
                }}
                onMouseLeave={() => {
                  if (activeDay === day) {
                    setActiveDay(null);
                  }
                }}
              >
                <button
                  type="button"
                  className={cn(
                    "relative flex h-12 w-full items-center justify-center rounded-lg text-sm transition-all",
                    "hover:bg-muted/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isToday(day) &&
                      "bg-primary/10 font-bold text-primary ring-2 ring-primary/30",
                    hasPrazos && !isToday(day) && "bg-accent/5",
                    hasUrgente && "ring-2 ring-red-500/30",
                    isFeriado &&
                      !isToday(day) &&
                      "bg-amber-500/5 font-semibold text-amber-600 ring-2 ring-amber-500/30 dark:text-amber-400",
                    !isToday(day) && !isFeriado && "text-foreground",
                    isActive && "shadow-[0_16px_30px_-24px_rgba(15,23,42,0.9)]",
                  )}
                  onFocus={() => {
                    if (hasPrazos || isFeriado) {
                      setActiveDay(day);
                    }
                  }}
                  onBlur={() => {
                    if (activeDay === day) {
                      setActiveDay(null);
                    }
                  }}
                  onClick={() => {
                    if (hasPrazos || isFeriado) {
                      setActiveDay((current) => (current === day ? null : day));
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && activeDay === day) {
                      setActiveDay(null);
                    }
                  }}
                  aria-controls={hasPrazos || isFeriado ? tooltipId : undefined}
                  aria-expanded={hasPrazos || isFeriado ? isActive : undefined}
                  aria-label={
                    hasPrazos || isFeriado
                      ? `${day} de ${monthName}. ${dayPrazos.length} prazo${dayPrazos.length === 1 ? "" : "s"} e ${dayFeriados.length} ocorrência${dayFeriados.length === 1 ? "" : "s"} de feriado.`
                      : `${day} de ${monthName}.`
                  }
                >
                  {day}
                </button>

                {isFeriado && (
                  <div className="pointer-events-none absolute right-0.5 top-0.5">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  </div>
                )}

                {hasPrazos && (
                  <div className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                    {dayPrazos.slice(0, 3).map((prazo, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          prazo.urgente
                            ? "bg-red-500"
                            : prazo.tipo === "devolucao"
                              ? "bg-blue-500"
                              : "bg-green-500",
                        )}
                      />
                    ))}
                  </div>
                )}

                {isActive && (hasPrazos || isFeriado) && (
                  <div
                    id={tooltipId}
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "absolute z-[70] w-64 rounded-2xl border border-border/80 bg-popover/95 p-3 shadow-[0_24px_55px_-38px_rgba(15,23,42,0.9)] backdrop-blur",
                      horizontalTooltipClass,
                      verticalTooltipClass,
                    )}
                  >
                    <div className="space-y-2">
                      <p className="border-b border-border pb-1 text-xs font-semibold text-foreground">
                        {day} de {monthName}
                      </p>

                      {isFeriado && (
                        <div className="mb-2 space-y-2 border-b border-border/50 pb-2">
                          {dayFeriados.map((feriado, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "rounded-xl border px-2.5 py-2",
                                holidayTypePanelClasses[feriado.tipo],
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full",
                                    holidayTypeAccentClasses[feriado.tipo],
                                  )}
                                />
                                <p className="flex-1 text-xs font-medium text-foreground">
                                  {feriado.nome}
                                </p>
                              </div>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {FERIADOS_TIPO_LABELS[feriado.tipo]}
                                {" · "}
                                {feriado.abrangencia}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {hasPrazos &&
                        dayPrazos.map((prazo) => (
                          <div key={prazo.id} className="space-y-1 text-xs">
                            <div className="flex items-start gap-2">
                              <div
                                className={cn(
                                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                                  prazo.urgente
                                    ? "bg-red-500"
                                    : prazo.tipo === "devolucao"
                                      ? "bg-blue-500"
                                      : "bg-green-500",
                                )}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  {prazo.titulo}
                                </p>
                                <p className="text-muted-foreground">
                                  {prazo.tipo === "devolucao"
                                    ? "Prazo de devolução"
                                    : "Solicitação"}
                                </p>
                              </div>
                              {prazo.urgente && (
                                <Badge
                                  variant="destructive"
                                  className="px-1 py-0 text-[10px]"
                                >
                                  Urgente
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-border/50 pt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Devolução</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Solicitação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Urgente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span className="text-muted-foreground">Feriado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-sky-500"></div>
            <span className="text-muted-foreground">Ponto facultativo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrazosCalendar;
