import React, { useMemo } from "react";
import { DateRange as DayPickerRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar } from "./Calendar";
import { cn } from "@/utils/cn";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const formatDisplayDate = (date: Date | null) =>
  date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "";

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecionar periodo",
  className = "",
}: DateRangePickerProps) {
  const selectedRange = useMemo<DayPickerRange | undefined>(() => {
    if (value.startDate || value.endDate) {
      return {
        from: value.startDate ?? undefined,
        to: value.endDate ?? undefined,
      };
    }
    return undefined;
  }, [value.startDate, value.endDate]);

  const label = useMemo(() => {
    if (value.startDate && value.endDate) {
      return `${formatDisplayDate(value.startDate)} - ${formatDisplayDate(value.endDate)}`;
    }
    if (value.startDate) {
      return `A partir de ${formatDisplayDate(value.startDate)}`;
    }
    if (value.endDate) {
      return `Ate ${formatDisplayDate(value.endDate)}`;
    }
    return placeholder;
  }, [value.startDate, value.endDate, placeholder]);

  const handleSelect = (range?: DayPickerRange) => {
    onChange({
      startDate: range?.from ?? null,
      endDate: range?.to ?? null,
    });
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onChange({ startDate: null, endDate: null });
  };

  return (
    <div className={cn("flex w-full", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value.startDate && !value.endDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 max-w-[240px]"
          align="start"
          side="bottom"
        >
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={selectedRange}
            onSelect={handleSelect}
            defaultMonth={selectedRange?.from ?? new Date()}
            initialFocus
          />
          <div className="flex items-center justify-between border-t px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!value.startDate && !value.endDate}
              className="text-muted-foreground hover:text-foreground h-6 px-2 text-[0.7rem]"
            >
              <X className="mr-0.5 h-3 w-3" />
              Limpar
            </Button>
            {(value.startDate || value.endDate) && (
              <span className="text-[0.65rem] text-muted-foreground">
                {value.startDate
                  ? formatDisplayDate(value.startDate)
                  : "Inicio indefinido"}
                {" - "}
                {value.endDate
                  ? formatDisplayDate(value.endDate)
                  : "Sem data final"}
              </span>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
