import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeInputProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
  placeholder?: string;
}

const formatDisplayDate = (date: Date | null) =>
  date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "";

const formatEditableDate = (date: Date | null) =>
  date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "";

const applyDateMask = (
  rawValue: string,
  previousValue: string = "",
): string => {
  // Extract only digits from the raw value
  let digits = rawValue.replace(/\D/g, "");

  // If the user is typing and we have more than 8 digits, keep only the last 8
  // This handles cases where user edits in the middle of the year
  if (digits.length > 8) {
    // Keep the first 4 digits (day + month) and the last 4 digits (year)
    const dayMonth = digits.slice(0, 4);
    const year = digits.slice(-4);
    digits = dayMonth + year;
  }

  digits = digits.slice(0, 8);

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
};

const parseInputValueToDate = (value: string): Date | null => {
  if (!value) return null;
  if (value.length !== 10) return null;

  const [dayPart, monthPart, yearPart] = value.split("/");
  const day = Number(dayPart);
  const month = Number(monthPart);
  const year = Number(yearPart);

  if (!day || !month || !year) return null;

  const parsedDate = new Date(year, month - 1, day);
  const isValidDate =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;

  return isValidDate ? parsedDate : null;
};

const hasIncompleteDate = (value: string) =>
  value.length > 0 && value.length < 10;

const hasInvalidCompleteDate = (value: string) =>
  value.length === 10 && parseInputValueToDate(value) === null;

export function DateRangeInput({
  value,
  onChange,
  className = "",
  placeholder = "Selecione o período",
}: DateRangeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startInputValue, setStartInputValue] = useState(
    formatEditableDate(value.startDate),
  );
  const [endInputValue, setEndInputValue] = useState(
    formatEditableDate(value.endDate),
  );

  useEffect(() => {
    if (!isOpen) {
      setStartInputValue(formatEditableDate(value.startDate));
      setEndInputValue(formatEditableDate(value.endDate));
    }
  }, [isOpen, value.endDate, value.startDate]);

  const startDateHasError = hasInvalidCompleteDate(startInputValue);
  const endDateHasError = hasInvalidCompleteDate(endInputValue);
  const hasIncompleteValue =
    hasIncompleteDate(startInputValue) || hasIncompleteDate(endInputValue);
  const hasInvalidValue = startDateHasError || endDateHasError;

  const canApply = !hasIncompleteValue && !hasInvalidValue;

  const displayText = useMemo(() => {
    const hasValue = value.startDate || value.endDate;

    if (!hasValue) return placeholder;

    return `${formatDisplayDate(value.startDate) || "..."} - ${
      formatDisplayDate(value.endDate) || "..."
    }`;
  }, [placeholder, value.endDate, value.startDate]);

  const hasValue = value.startDate || value.endDate;

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = applyDateMask(event.target.value);
    setStartInputValue(nextValue);

    if (!nextValue) {
      onChange({ ...value, startDate: null });
      return;
    }

    const parsedDate = parseInputValueToDate(nextValue);
    if (parsedDate) {
      onChange({ ...value, startDate: parsedDate });
    }
  };

  const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = applyDateMask(event.target.value);
    setEndInputValue(nextValue);

    if (!nextValue) {
      onChange({ ...value, endDate: null });
      return;
    }

    const parsedDate = parseInputValueToDate(nextValue);
    if (parsedDate) {
      onChange({ ...value, endDate: parsedDate });
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    setStartInputValue("");
    setEndInputValue("");
    onChange({ startDate: null, endDate: null });
  };

  const resetDraftValues = () => {
    setStartInputValue(formatEditableDate(value.startDate));
    setEndInputValue(formatEditableDate(value.endDate));
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      resetDraftValues();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between text-left font-normal ${
            !hasValue && "text-muted-foreground"
          } ${className}`}
        >
          <span className="flex items-center gap-2 truncate">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">{displayText}</span>
          </span>
          {hasValue && (
            <X
              className="h-4 w-4 shrink-0 hover:text-destructive"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" side="bottom">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="date-range-start" className="text-sm font-medium">
              Data inicial
            </label>
            <Input
              id="date-range-start"
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              value={startInputValue}
              onChange={handleStartChange}
              className="w-full"
              maxLength={10}
              aria-invalid={startDateHasError}
            />
            <p className="text-xs text-muted-foreground">
              Digite a data no formato dd/mm/aaaa.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="date-range-end" className="text-sm font-medium">
              Data final
            </label>
            <Input
              id="date-range-end"
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              value={endInputValue}
              onChange={handleEndChange}
              className="w-full"
              maxLength={10}
              aria-invalid={endDateHasError}
            />
            <p className="text-xs text-muted-foreground">
              Digite a data no formato dd/mm/aaaa.
            </p>
          </div>
          {(hasIncompleteValue || hasInvalidValue) && (
            <p className="text-xs text-destructive">
              Preencha as datas com um valor valido antes de aplicar o filtro.
            </p>
          )}
          <div className="flex items-center justify-between border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartInputValue("");
                setEndInputValue("");
                onChange({ startDate: null, endDate: null });
              }}
              disabled={!hasValue && !startInputValue && !endInputValue}
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!canApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
