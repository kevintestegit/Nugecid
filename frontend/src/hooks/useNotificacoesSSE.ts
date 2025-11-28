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
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    // Criar EventSource com token no URL (SSE não suporta headers)
    const url = `/api/notificacoes/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.addEventListener('notificacoes', (event: MessageEvent) => {
      try {
        const data: NotificacaoSSE = JSON.parse(event.data);
        
        setNotificacoes(data.notificacoes);
        setTotal(data.total);
      } catch (err) {
        // Silencioso
      }
    });

    eventSource.onerror = (err) => {
      setConnected(false);
      setError('Erro na conexão de notificações em tempo real');
      
      // Fechar conexão em caso de erro
      eventSource.close();
    };

    // Cleanup ao desmontar ou trocar de usuário
    return () => {
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
