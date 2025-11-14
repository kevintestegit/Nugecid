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
    const iconClass = cn(
      'w-4 h-4 flex-shrink-0',
      prioridade === 'CRITICA' && 'text-red-500',
      prioridade === 'ALTA' && 'text-orange-500',
      prioridade === 'MEDIA' && 'text-yellow-500',
      prioridade === 'BAIXA' && 'text-blue-500'
    );

    switch (tipo) {
      case 'SOLICITACAO_PENDENTE':
        return <Clock className={iconClass} />;
      case 'NOVO_PROCESSO':
        return <Info className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  // Obter cor da prioridade
  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'CRITICA':
        return 'border-l-red-500 bg-red-50';
      case 'ALTA':
        return 'border-l-orange-500 bg-orange-50';
      case 'MEDIA':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'BAIXA':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
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
          'p-3 border-l-4 transition-all duration-200',
          isClickable ? 'hover:bg-gray-50 cursor-pointer' : '',
          getPriorityColor(notificacao.prioridade),
          !notificacao.lida && 'bg-blue-50 border-l-blue-500'
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
                'text-sm font-medium text-gray-900 truncate',
                !notificacao.lida && 'font-semibold'
              )}>
                {notificacao.titulo}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {notificacao.descricao}
              </p>
              {extraInfo.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {extraInfo.map(info => (
                    <li key={info} className="text-[11px] text-gray-500">
                      {info}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{timeAgo}</span>
                {!notificacao.lida && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
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
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
          'relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          'text-gray-600 hover:text-gray-900 bg-muted/60 hover:bg-muted/80',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          hasNotificacoes && 'animate-pulse'
        )}
        title={`${totalNaoLidas} notificações não lidas`}
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge com contador */}
        {totalNaoLidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[1.25rem] h-5 shadow-md">
            {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notificações {totalNaoLidas > 0 && `(${totalNaoLidas} não lidas)`}
              </h3>
              <div className="flex items-center gap-2">
                {totalNaoLidas > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  'text-xs px-2 py-1 rounded transition-colors',
                  !showAll
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
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
                  'text-xs px-2 py-1 rounded transition-colors',
                  showAll
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                Todas
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500">
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
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium mb-1">
                  {showAll ? 'Nenhuma notificação' : 'Nenhuma notificação não lida'}
                </p>
                <p className="text-xs text-gray-400">
                  {showAll 
                    ? 'Você está em dia com suas notificações!' 
                    : 'Todas as notificações foram lidas.'
                  }
                </p>
              </div>
            )}

            {!loading && !error && displayNotifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {displayNotifications.map(renderNotificationItem)}
              </div>
            )}
          </div>

          {/* Footer */}
          {displayNotifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
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
