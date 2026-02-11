import { render, screen, fireEvent } from '@testing-library/react'
import { SystemSettings } from '../SystemSettings'
import { vi } from 'vitest'

vi.mock('@/services/backupService', () => ({
  __esModule: true,
  default: {
    getSystemSettings: vi.fn().mockResolvedValue({
      autoBackup: true,
      backupFrequency: 'daily',
      logLevel: 'info',
      maintenanceMode: false,
      cacheEnabled: true,
    }),
    updateSystemSettings: vi.fn().mockResolvedValue({}),
    listBackups: vi.fn().mockResolvedValue({ backups: [] }),
    createFullBackup: vi.fn().mockResolvedValue({ success: true, filename: 'backup.sql', size: '1MB' }),
    restoreBackup: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock('@/services/escavadorService', () => ({
  __esModule: true,
  default: {
    getStatus: vi.fn().mockResolvedValue(null),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('SystemSettings', () => {
  it('should render key sections', async () => {
    render(<SystemSettings />)

    expect(await screen.findByText('Backup e Recuperação')).toBeInTheDocument()
    expect(screen.getByText('Logs e Monitoramento')).toBeInTheDocument()
    expect(screen.getByText('Manutenção')).toBeInTheDocument()
  })

  it('should change backup frequency when select changes', async () => {
    render(<SystemSettings />)

    const select = await screen.findByLabelText('Frequência do backup')
    fireEvent.change(select, { target: { value: 'weekly' } })

    expect((select as HTMLSelectElement).value).toBe('weekly')
  })
})
