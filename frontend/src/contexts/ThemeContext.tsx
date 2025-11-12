import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'

import { useOptionalAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light')
  const initializedRef = useRef(false)
  const shouldPersistRef = useRef(false)

  const auth = useOptionalAuth()

  const applyTheme = useCallback((nextTheme: Theme, persist: boolean) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      nextTheme = 'light'
    }

    shouldPersistRef.current = persist
    setThemeState(nextTheme)
  }, [])

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      applyTheme(nextTheme, true)
    },
    [applyTheme],
  )

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'light' ? 'dark' : 'light', true)
  }, [applyTheme, theme])

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    let nextTheme: Theme = 'light'
    const savedTheme = localStorage.getItem('theme') as Theme | null

    if (savedTheme === 'light' || savedTheme === 'dark') {
      nextTheme = savedTheme
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      nextTheme = 'dark'
    }

    applyTheme(nextTheme, false)
    initializedRef.current = true
  }, [applyTheme])

  useEffect(() => {
    const userTheme = auth?.user?.settings?.theme as Theme | undefined
    if (!userTheme) {
      return
    }

    if (shouldPersistRef.current) {
      return
    }

    if ((userTheme === 'light' || userTheme === 'dark') && userTheme !== theme) {
      applyTheme(userTheme, false)
    }
  }, [auth?.user?.settings?.theme, applyTheme, theme])

  const persistThemePreference = useCallback(
    async (nextTheme: Theme) => {
      if (!auth?.user || typeof auth.updateUser !== 'function') {
        return
      }

      const optimisticUser = {
        ...auth.user,
        settings: {
          ...(auth.user.settings || {}),
          theme: nextTheme,
        },
      }

      auth.updateUser(optimisticUser)

      try {
        const response = await apiService.updateMySettings({ theme: nextTheme })
        if (response.success && response.data) {
          auth.updateUser({
            ...optimisticUser,
            settings: {
              ...(optimisticUser.settings || {}),
              ...response.data,
            },
          })
        }
      } catch (error) {
        console.error('[ThemeContext] Falha ao salvar preferência de tema:', error)
      }
    },
    [auth],
  )

  useEffect(() => {
    const persist = shouldPersistRef.current
    shouldPersistRef.current = false

    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)

    if (persist) {
      void persistThemePreference(theme)
    }
  }, [theme, persistThemePreference])

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
