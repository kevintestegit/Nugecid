import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NotificacaoSSE {
  notificacoes: any[];
  total: number;
  timestamp: string;
}

export const useNotificacoesSSE = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('👤 Usuário não autenticado, SSE não será iniciado');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('🔑 Token não encontrado, SSE não será iniciado');
      return;
    }

    console.log('🚀 Iniciando conexão SSE para notificações...');

    // Criar EventSource com token no URL (SSE não suporta headers)
    const url = `/api/notificacoes/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ Conexão SSE estabelecida');
      setConnected(true);
      setError(null);
    };

    eventSource.addEventListener('notificacoes', (event: MessageEvent) => {
      try {
        const data: NotificacaoSSE = JSON.parse(event.data);
        console.log('📨 Notificações recebidas via SSE:', data);
        
        setNotificacoes(data.notificacoes);
        setTotal(data.total);
      } catch (err) {
        console.error('❌ Erro ao processar mensagem SSE:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('❌ Erro na conexão SSE:', err);
      setConnected(false);
      setError('Erro na conexão de notificações em tempo real');
      
      // Fechar conexão em caso de erro
      eventSource.close();
    };

    // Cleanup ao desmontar ou trocar de usuário
    return () => {
      console.log('🔌 Fechando conexão SSE');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
    };
  }, [user]);

  return {
    notificacoes,
    total,
    connected,
    error,
    isRealTime: connected,
  };
};
