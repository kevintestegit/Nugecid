import type { ReactNode } from "react";

interface TooltipProviderProps {
  children: ReactNode;
}

interface TooltipProps {
  children: ReactNode;
}

interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: ReactNode;
  className?: string;
}

export const TooltipProvider = ({ children }: TooltipProviderProps) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }: TooltipProps) => {
  return <>{children}</>;
};

export const TooltipTrigger = ({ children }: TooltipTriggerProps) => {
  return <>{children}</>;
};

export const TooltipContent = ({
  children,
  className,
}: TooltipContentProps) => {
  return (
    <div className={className ?? "hidden"} aria-hidden="true">
      {children}
    </div>
  );
};
