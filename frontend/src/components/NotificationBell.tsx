import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useNotificacoes } from '../hooks/useNotificacoes';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    naoLidas,
    loading,
    error,
    fetchNaoLidas,
    marcarComoLida,
    excluirNotificacao
  } = useNotificacoes();

  // Polling para buscar novas notificações a cada 30 segundos
  useEffect(() => {
    fetchNaoLidas();
    
    const interval = setInterval(() => {
      fetchNaoLidas();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchNaoLidas]);

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

  const handleMarcarComoLida = async (id: number) => {
    try {
      await marcarComoLida(id);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await excluirNotificacao(id);
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'text-red-600 bg-red-50';
      case 'alta':
        return 'text-orange-600 bg-orange-50';
      case 'media':
        return 'text-yellow-600 bg-yellow-50';
      case 'baixa':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return <AlertTriangle className="w-4 h-4" />;
      case 'alta':
        return <AlertTriangle className="w-4 h-4" />;
      case 'media':
        return <Info className="w-4 h-4" />;
      case 'baixa':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        title="Notificações"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge com contador */}
        {naoLidas.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {naoLidas.length > 99 ? '99+' : naoLidas.length}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificações
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {naoLidas.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {naoLidas.length} notificação{naoLidas.length !== 1 ? 'ões' : ''} não lida{naoLidas.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-red-600">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            ) : naoLidas.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma notificação pendente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {naoLidas.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Ícone de prioridade */}
                      <div className={`flex-shrink-0 p-2 rounded-full ${getPriorityColor(notificacao.prioridade)}`}>
                        {getPriorityIcon(notificacao.prioridade)}
                      </div>
                      
                      {/* Conteúdo da notificação */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notificacao.titulo}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notificacao.descricao}
                            </p>
                            
                            {/* Informações adicionais */}
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(notificacao.createdAt)}
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notificacao.prioridade)}`}>
                                {notificacao.prioridade}
                              </span>
                            </div>
                          </div>
                          
                          {/* Ações */}
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => handleMarcarComoLida(notificacao.id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Marcar como lida"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExcluir(notificacao.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Excluir"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {naoLidas.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Implementar visualizar todas as notificações
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;