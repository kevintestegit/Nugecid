import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { cn } from "@/utils/cn";
import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  locale = ptBR,
  ...props
}: CalendarProps) => (
  <DayPicker
    showOutsideDays={showOutsideDays}
    locale={locale}
    className={cn("p-1.5", className)}
    classNames={{
      months:
        "flex flex-col space-y-1.5 sm:flex-row sm:space-x-1.5 sm:space-y-0",
      month: "space-y-1.5",
      caption: "flex justify-center pt-0.5 relative items-center",
      caption_label: "text-[0.7rem] font-medium",
      nav: "space-x-1 flex items-center",
      nav_button:
        "inline-flex h-5 w-5 items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
      nav_button_previous: "absolute left-0.5",
      nav_button_next: "absolute right-0.5",
      table: "w-full border-collapse space-y-0.5",
      head_row: "flex",
      head_cell:
        "text-muted-foreground rounded-md w-6 font-normal text-[0.65rem]",
      row: "flex w-full mt-0.5",
      cell: cn(
        "relative h-6 w-6 text-center text-[0.65rem] focus-within:relative focus-within:z-20",
        "[&:has([aria-selected].day-range-end)]:rounded-r-md",
        "[&:has([aria-selected].day-range-start)]:rounded-l-md",
        "[&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-outside)]:text-muted-foreground",
        "data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground",
      ),
      day: cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md text-[0.65rem] font-normal transition-colors",
        "hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
      ),
      day_range_start: "day-range-start",
      day_range_end: "day-range-end",
      day_selected:
        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
      day_today: "bg-accent text-accent-foreground",
      day_outside: "day-outside text-muted-foreground opacity-50",
      day_disabled: "text-muted-foreground opacity-50",
      day_range_middle:
        "aria-selected:bg-primary/10 aria-selected:text-primary",
      day_hidden: "invisible",
      ...classNames,
    }}
    components={{
      IconLeft: (props) => (
        <span
          {...props}
          aria-hidden
          className="inline-flex h-4 w-4 items-center justify-center"
        >
          &#x2039;
        </span>
      ),
      IconRight: (props) => (
        <span
          {...props}
          aria-hidden
          className="inline-flex h-4 w-4 items-center justify-center"
        >
          &#x203A;
        </span>
      ),
    }}
    {...props}
  />
);
