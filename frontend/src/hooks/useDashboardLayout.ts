import { useState, useEffect, useCallback } from 'react';
import { DashboardCard, DEFAULT_DASHBOARD_CARDS, DashboardLayout } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { preferencesService } from '@/services/preferencesService';
import { toast } from '@/lib/toast';

const PREFERENCE_KEY = 'dashboard-layout';
const STORAGE_KEY = 'dashboard-layout'; // Fallback para localStorage

export const useDashboardLayout = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<DashboardCard[]>(DEFAULT_DASHBOARD_CARDS);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar layout do banco ou localStorage
  useEffect(() => {
    if (!user) return;

    const loadLayout = async () => {
      try {
        // Tentar carregar do banco primeiro
        const serverLayout = await preferencesService.get(PREFERENCE_KEY);
        
        if (serverLayout && serverLayout.cards) {
          setCards(serverLayout.cards);
          // Sincronizar com localStorage
          localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(serverLayout));
        } else {
          // Fallback para localStorage
          const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
          if (stored) {
            const layout: DashboardLayout = JSON.parse(stored);
            setCards(layout.cards);
            // Sincronizar com servidor
            await preferencesService.set(PREFERENCE_KEY, layout);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar layout do dashboard:', error);
        // Tentar localStorage como último recurso
        const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
        if (stored) {
          try {
            const layout: DashboardLayout = JSON.parse(stored);
            setCards(layout.cards);
          } catch {
            setCards(DEFAULT_DASHBOARD_CARDS);
          }
        } else {
          setCards(DEFAULT_DASHBOARD_CARDS);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, [user]);

  // Salvar layout no banco e localStorage
  const saveLayout = useCallback(async (newCards: DashboardCard[]) => {
    if (!user) return;

    const layout: DashboardLayout = {
      userId: user.id,
      cards: newCards,
      updatedAt: new Date().toISOString()
    };

    // Salvar no localStorage imediatamente (UX)
    localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(layout));
    setCards(newCards);

    // Salvar no banco em background
    try {
      await preferencesService.set(PREFERENCE_KEY, layout);
      toast.success('Layout salvo!', 'Suas personalizações foram salvas com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar layout no servidor:', error);
      toast.warning('Layout salvo localmente', 'Não foi possível sincronizar com o servidor.');
    }
  }, [user]);

  // Toggle visibilidade do card
  const toggleCardVisibility = useCallback((cardId: string) => {
    const newCards = cards.map(card =>
      card.id === cardId ? { ...card, visible: !card.visible } : card
    );
    saveLayout(newCards);
  }, [cards, saveLayout]);

  // Mover card para cima
  const moveCardUp = useCallback((cardId: string) => {
    const index = cards.findIndex(c => c.id === cardId);
    if (index <= 0) return;

    const newCards = [...cards];
    [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
    
    // Atualizar positions
    newCards.forEach((card, idx) => {
      card.position = idx;
    });

    saveLayout(newCards);
  }, [cards, saveLayout]);

  // Mover card para baixo
  const moveCardDown = useCallback((cardId: string) => {
    const index = cards.findIndex(c => c.id === cardId);
    if (index >= cards.length - 1) return;

    const newCards = [...cards];
    [newCards[index + 1], newCards[index]] = [newCards[index], newCards[index + 1]];
    
    // Atualizar positions
    newCards.forEach((card, idx) => {
      card.position = idx;
    });

    saveLayout(newCards);
  }, [cards, saveLayout]);

  // Resetar para layout padrão
  const resetLayout = useCallback(async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja restaurar o layout padrão? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    await saveLayout(DEFAULT_DASHBOARD_CARDS);
    toast.success('Layout restaurado!', 'O dashboard foi restaurado para o padrão.');
  }, [saveLayout]);

  // Retornar apenas cards visíveis ordenados por position
  const visibleCards = cards
    .filter(card => card.visible)
    .sort((a, b) => a.position - b.position);

  return {
    cards,
    visibleCards,
    isCustomizing,
    isLoading,
    setIsCustomizing,
    toggleCardVisibility,
    moveCardUp,
    moveCardDown,
    resetLayout
  };
};
