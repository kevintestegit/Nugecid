import { render, screen } from '@testing-library/react'
import { GeneralSettings } from '../GeneralSettings'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { vi } from 'vitest'

vi.mock('@/services/api', () => ({
  apiService: {
    getNotificationPreferences: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 1,
        userId: 1,
        inAppEnabled: true,
        pushEnabled: false,
        soundEnabled: true,
        enabledTypes: {},
        pushSubscription: null,
      },
    }),
    updateNotificationPreferences: vi.fn().mockResolvedValue({
      success: true,
      data: {},
    }),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('GeneralSettings', () => {
  it('should render appearance and notifications cards', async () => {
    render(
      <ThemeProvider>
        <GeneralSettings />
      </ThemeProvider>
    )

    expect(await screen.findByText('Aparência')).toBeInTheDocument()
    expect(screen.getByText('Notificações')).toBeInTheDocument()
    expect(screen.getByText('Notificações in-app')).toBeInTheDocument()
    expect(screen.getByText('Som')).toBeInTheDocument()
  })
})
