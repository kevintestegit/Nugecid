import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { AnnouncementModal } from '@/components/announcements/AnnouncementModal'

const onClose = vi.fn()

vi.mock('@/services/api', () => ({
  apiService: {
    getActiveAnnouncements: vi.fn(),
    markAnnouncementAsViewed: vi.fn(),
  },
}))

const apiService = (await import('@/services/api')).apiService as unknown as {
  getActiveAnnouncements: ReturnType<typeof vi.fn>
}

describe('AnnouncementModal', () => {
  beforeEach(() => {
    onClose.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fecha quando API retorna vazia', async () => {
    apiService.getActiveAnnouncements.mockResolvedValue({ success: true, data: [] })

    render(<AnnouncementModal onClose={onClose} />)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('fecha quando API falha', async () => {
    apiService.getActiveAnnouncements.mockRejectedValue(new Error('fail'))

    render(<AnnouncementModal onClose={onClose} />)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

