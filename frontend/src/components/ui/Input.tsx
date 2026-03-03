import * as React from "react";
import { cn } from "@/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground",
          "bg-transparent dark:bg-input/30 border-border/50 flex h-11 w-full min-w-0 rounded-xl border backdrop-blur-sm px-4 py-3 text-sm",
          "shadow-modern transition-all duration-300 outline-none",
          "hover:border-border hover:shadow-modern-md",
          "focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:shadow-modern-lg",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive/50 aria-invalid:ring-4 aria-invalid:ring-destructive/10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
