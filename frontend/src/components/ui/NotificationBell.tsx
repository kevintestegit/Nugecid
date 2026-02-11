import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertCircle, Info, Clock } from 'lucide-react';
import { useNotificacoes, type Notificacao } from '../../hooks/useNotificacoes';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const {
    naoLidas,
    notificacoes,
    loading,
    error,
    totalNaoLidas,
    hasNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    fetchNotificacoes
  } = useNotificacoes();

  const normalizePriority = (prioridade?: string) => (prioridade || '').toString().trim().toLowerCase();
  const normalizeType = (tipo?: string) => (tipo || '').toString().trim().toLowerCase();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar todas as notificações quando abrir o dropdown
  const handleToggleDropdown = async () => {
    if (!isOpen && showAll) {
      try {
        await fetchNotificacoes({ limit: 50 });
      } catch (err) {
        console.error('Erro ao buscar notificações:', err);
      }
    }
    setIsOpen(!isOpen);
  };

  const getNotificationDestination = (notificacao: Notificacao) => {
    if (notificacao.link) return notificacao.link;
    if (notificacao.processoId) return `/desarquivamentos/${notificacao.processoId}`;
    if (notificacao.solicitacaoId) return `/desarquivamentos/${notificacao.solicitacaoId}`;
    if (notificacao.tarefaId) return `/tarefas/${notificacao.tarefaId}`;
    return null;
  };

  const handleNotificationClick = useCallback(
    (notificacao: Notificacao) => {
      const destination = getNotificationDestination(notificacao);
      if (!destination) return;

      navigate(destination);
      if (!notificacao.lida) {
        marcarComoLida(notificacao.id);
      }
      setIsOpen(false);
    },
    [navigate, marcarComoLida]
  );

  // Obter ícone baseado no tipo da notificação
  const getNotificationIcon = (tipo: string, prioridade: string) => {
    const normalizedPriority = normalizePriority(prioridade);
    const normalizedType = normalizeType(tipo);
    const iconClass = cn(
      'w-4 h-4 flex-shrink-0',
      normalizedPriority === 'critica' && 'text-red-500',
      normalizedPriority === 'alta' && 'text-orange-500',
      normalizedPriority === 'media' && 'text-yellow-500',
      normalizedPriority === 'baixa' && 'text-blue-500'
    );

    switch (normalizedType) {
      case 'solicitacao_pendente':
        return <Clock className={iconClass} />;
      case 'novo_processo':
        return <Info className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  // Obter cor da prioridade
  const getPriorityColor = (prioridade: string) => {
    switch (normalizePriority(prioridade)) {
      case 'critica':
        return 'border-l-red-500 bg-red-500/10';
      case 'alta':
        return 'border-l-orange-500 bg-orange-500/10';
      case 'media':
        return 'border-l-yellow-500 bg-yellow-500/10';
      case 'baixa':
        return 'border-l-blue-500 bg-blue-500/10';
      default:
        return 'border-l-border bg-muted/30';
    }
  };

  // Renderizar item de notificação
  const renderNotificationItem = (notificacao: Notificacao) => {
    const timeAgo = formatDistanceToNow(new Date(notificacao.createdAt), {
      addSuffix: true,
      locale: ptBR
    });

    const extraInfo = [
      notificacao.detalhes?.nome_completo && `Nome: ${notificacao.detalhes?.nome_completo}`,
      notificacao.detalhes?.numero_processo && `Processo: ${notificacao.detalhes?.numero_processo}`,
      notificacao.detalhes?.tipo_documento && `Documento: ${notificacao.detalhes?.tipo_documento}`,
      notificacao.detalhes?.acao_requerida && `Ação: ${notificacao.detalhes?.acao_requerida}`,
    ].filter(Boolean)

    const destination = getNotificationDestination(notificacao);
    const isClickable = Boolean(destination);

    return (
      <div
        key={notificacao.id}
        className={cn(
          'border-l-4 p-3 transition-all duration-200',
          isClickable ? 'cursor-pointer hover:bg-muted/45' : '',
          getPriorityColor(notificacao.prioridade),
          !notificacao.lida && 'border-l-blue-500 bg-blue-500/10'
        )}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={() => isClickable && handleNotificationClick(notificacao)}
        onKeyDown={(e) => {
          if (!isClickable) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNotificationClick(notificacao);
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {getNotificationIcon(notificacao.tipo, notificacao.prioridade)}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'truncate text-sm font-medium text-foreground',
                !notificacao.lida && 'font-semibold'
              )}>
                {notificacao.titulo}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {notificacao.descricao}
              </p>
              {extraInfo.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {extraInfo.map(info => (
                    <li key={info} className="text-[11px] text-muted-foreground/90">
                      {info}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                {!notificacao.lida && (
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Nova
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notificacao.lida && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  marcarComoLida(notificacao.id);
                }}
                className="p-1 text-muted-foreground transition-colors hover:text-primary"
                title="Marcar como lida"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                excluirNotificacao(notificacao.id);
              }}
              className="p-1 text-muted-foreground transition-colors hover:text-red-500"
              title="Excluir notificação"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const displayNotifications = showAll ? notificacoes : naoLidas;

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={handleToggleDropdown}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-foreground/80 backdrop-blur transition-all',
          'hover:border-border hover:bg-card hover:text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
          hasNotificacoes && 'animate-pulse'
        )}
        title={`${totalNaoLidas} notificações não lidas`}
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge com contador */}
        {totalNaoLidas > 0 && (
          <span className="absolute right-0 top-0 inline-flex h-5 min-w-[1.25rem] -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full border border-red-500/30 bg-red-500 px-2 py-1 text-xs font-bold leading-none text-white shadow-md">
            {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-96 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_26px_55px_-38px_rgba(2,6,23,0.92)] backdrop-blur">
          <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-12 h-24 w-24 rounded-full bg-orange-400/10 blur-2xl" />
          {/* Header */}
          <div className="relative border-b border-border/60 bg-muted/25 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                Notificações {totalNaoLidas > 0 && `(${totalNaoLidas} não lidas)`}
              </h3>
              <div className="flex items-center gap-2">
                {totalNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Toggle entre não lidas e todas */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setShowAll(false)}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
                  !showAll
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Não lidas ({totalNaoLidas})
              </button>
              <button
                onClick={() => {
                  setShowAll(true);
                  if (!notificacoes.length) {
                    fetchNotificacoes({ limit: 50 });
                  }
                }}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
                  showAll
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Todas
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="max-h-80 overflow-y-auto bg-background/45">
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Carregando...</p>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-600">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && displayNotifications.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium mb-1">
                  {showAll ? 'Nenhuma notificação' : 'Nenhuma notificação não lida'}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {showAll 
                    ? 'Você está em dia com suas notificações!' 
                    : 'Todas as notificações foram lidas.'
                  }
                </p>
              </div>
            )}

            {!loading && !error && displayNotifications.length > 0 && (
              <div className="divide-y divide-border/60">
                {displayNotifications.map(renderNotificationItem)}
              </div>
            )}
          </div>

          {/* Footer */}
          {displayNotifications.length > 0 && (
            <div className="border-t border-border/60 bg-muted/20 px-4 py-2">
              <p className="text-center text-xs text-muted-foreground">
                Atualizações automáticas a cada 30 segundos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
