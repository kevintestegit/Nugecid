import { useEffect, useCallback, RefObject } from 'react';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

/**
 * Hook para gerenciar navegação por teclado
 * Melhora a acessibilidade permitindo navegação completa sem mouse
 */
export const useKeyboardNavigation = (
  ref: RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions = {}
) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('keydown', handleKeyDown);
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, handleKeyDown, enabled]);
};

/**
 * Hook para gerenciar foco em modais e dialogs
 * Previne que o foco escape do modal durante navegação por teclado
 */
export const useFocusTrap = (ref: RefObject<HTMLElement>, isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    const element = ref.current;
    if (!element) return;

    // Salvar elemento focado anteriormente
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focar no primeiro elemento focável dentro do modal
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Prevenir foco de sair do modal
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Restaurar foco ao desmontar
    return () => {
      element.removeEventListener('keydown', handleTabKey);
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [ref, isActive]);
};

/**
 * Hook para anunciar mudanças dinamicamente para screen readers
 */
export const useAnnounce = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return announce;
};

export default useKeyboardNavigation;
