import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Settings,
} from "lucide-react";
import { DashboardCard } from "@/types/dashboard";

interface DashboardCustomizerProps {
  cards: DashboardCard[];
  onToggleVisibility: (cardId: string) => void;
  onMoveUp: (cardId: string) => void;
  onMoveDown: (cardId: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  cards,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onReset,
  onClose,
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[999] bg-slate-950/65 backdrop-blur-sm"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
        }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <div className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-[0_36px_80px_-52px_rgba(2,6,23,0.95)] backdrop-blur pointer-events-auto">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-20 h-40 w-40 rounded-full bg-orange-400/15 blur-3xl" />
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-border/60 bg-muted/20 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Personalizar painel
                </h2>
                <p className="text-sm text-muted-foreground">
                  Organize e exiba os cards como preferir
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted/60"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(85vh-180px)] overflow-y-auto bg-background/55 p-6">
            <div className="space-y-3">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className={`
                  flex items-center justify-between rounded-2xl border p-4 transition-all
                  ${
                    card.visible
                      ? "border-border/70 bg-card/80 shadow-[0_16px_30px_-30px_rgba(15,23,42,0.85)]"
                      : "border-border/40 bg-muted/30 opacity-65"
                  }
                `}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => onMoveUp(card.id)}
                        disabled={index === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onMoveDown(card.id)}
                        disabled={index === cards.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                        {card.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {getCardDescription(card.type)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleVisibility(card.id)}
                    className={`
                    flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all
                    ${
                      card.visible
                        ? "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                        : "border border-border/70 bg-muted/45 text-muted-foreground hover:bg-muted"
                    }
                  `}
                  >
                    {card.visible ? (
                      <>
                        <Eye className="h-4 w-4" />
                        Visível
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Oculto
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 p-6">
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrão
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-primary/20 bg-primary px-6 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(
    <div className={theme === "dark" ? "dark" : ""}>
      {modalContent}
    </div>,
    document.body
  );
};

function getCardDescription(type: DashboardCard["type"]): string {
  const descriptions: Record<DashboardCard["type"], string> = {
    stats: "Estatísticas gerais do sistema",
    "quick-actions": "Atalhos para ações frequentes",
    tasks: "Suas tarefas pendentes",
    activity: "Últimas atividades no sistema",
    calendar: "Prazos e datas importantes",
    "online-users": "Usuários conectados agora",
    "system-info": "Informações do sistema",
  };
  return descriptions[type] || "";
}
