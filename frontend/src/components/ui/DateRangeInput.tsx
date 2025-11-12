import React, { useState } from 'react';
import { Input } from './Input';
import { Calendar, X } from 'lucide-react';
import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const dateToInputValue = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const inputValueToDate = (value: string): Date | null => {
  if (!value) return null;
  // Parse YYYY-MM-DD como data local (sem conversão de timezone)
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
};

const formatDisplayDate = (date: Date | null) =>
  date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '';

export function DateRangeInput({
  value,
  onChange,
  className = '',
  placeholder = 'Selecione o período'
}: DateRangeInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = inputValueToDate(e.target.value);
    onChange({ ...value, startDate: newDate });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = inputValueToDate(e.target.value);
    onChange({ ...value, endDate: newDate });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: null, endDate: null });
  };

  const hasValue = value.startDate || value.endDate;

  const displayText = hasValue
    ? `${formatDisplayDate(value.startDate) || '...'} - ${formatDisplayDate(value.endDate) || '...'}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between text-left font-normal ${!hasValue && 'text-muted-foreground'} ${className}`}
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
            <label className="text-sm font-medium">Data inicial</label>
            <Input
              type="date"
              value={dateToInputValue(value.startDate)}
              onChange={handleStartChange}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data final</label>
            <Input
              type="date"
              value={dateToInputValue(value.endDate)}
              onChange={handleEndChange}
              className="w-full"
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange({ startDate: null, endDate: null });
              }}
              disabled={!hasValue}
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
