import React from "react";
import { cn } from "@/utils/cn";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  variant?: "spinner" | "dots" | "pulse";
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  className,
  text = "Carregando...",
  variant = "spinner",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const renderSpinner = () => (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
      )}
    />
  );

  const renderDots = () => (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-primary animate-pulse",
            size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4",
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn("rounded-full bg-primary animate-pulse", sizeClasses[size])}
    />
  );

  const renderVariant = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {renderVariant()}
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

// Componente para loading de página inteira
export const PageLoading: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-lg p-8 border border-border">
        <Loading size="lg" text="Carregando página..." variant="pulse" />
      </div>
    </div>
  );
};

export const RouteLoading: React.FC<{ text?: string }> = ({
  text = "Carregando conteúdo...",
}) => {
  return (
    <div className="flex min-h-[40vh] items-center justify-center py-10">
      <div className="rounded-2xl border border-border/60 bg-card/80 px-6 py-5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <Loading size="md" text={text} variant="dots" />
      </div>
    </div>
  );
};

// Componente para loading de tabela
export const TableLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="rounded-lg p-6 border border-border">
        <Loading text="Carregando dados..." variant="dots" />
      </div>
    </div>
  );
};

// Componente para loading de botão
export const ButtonLoading: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current/30 border-t-current h-4 w-4",
        className,
      )}
    />
  );
};

export { Loading };
export default Loading;
