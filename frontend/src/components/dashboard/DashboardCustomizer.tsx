import React from 'react';
import { X, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw, Settings } from 'lucide-react';
import { DashboardCard } from '@/types/dashboard';

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
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Personalizar Dashboard</h2>
              <p className="text-sm text-foreground/70">Organize e exiba os cards como preferir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-foreground/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] bg-background">
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`
                  flex items-center justify-between p-4 rounded-xl border transition-all
                  ${card.visible 
                    ? 'bg-card border-border/50' 
                    : 'bg-muted/30 border-border/30 opacity-60'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onMoveUp(card.id)}
                      disabled={index === 0}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onMoveDown(card.id)}
                      disabled={index === cards.length - 1}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{card.title}</h3>
                    <p className="text-sm text-foreground/60">
                      {getCardDescription(card.type)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onToggleVisibility(card.id)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                    ${card.visible
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-muted/50 text-foreground/50 hover:bg-muted'
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
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg font-medium text-foreground/70 hover:bg-muted/50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

function getCardDescription(type: DashboardCard['type']): string {
  const descriptions: Record<DashboardCard['type'], string> = {
    'stats': 'Estatísticas gerais do sistema',
    'quick-actions': 'Atalhos para ações frequentes',
    'tasks': 'Suas tarefas pendentes',
    'activity': 'Últimas atividades no sistema',
    'calendar': 'Prazos e datas importantes',
    'online-users': 'Usuários conectados agora',
    'system-info': 'Informações do sistema'
  };
  return descriptions[type] || '';
}
