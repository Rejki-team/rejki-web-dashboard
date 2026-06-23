import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/iklanApi', () => ({
  iklanApi: {
    evidenceEndpoint: (v: string) => `/${v}/admin/suspend/evidence`,
    suspend: vi.fn(),
  },
}))
vi.mock('@/utils/upload', () => ({ uploadEvidence: vi.fn() }))
const toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toastMock }))

import { iklanApi } from '@/api/iklanApi'
import { uploadEvidence } from '@/utils/upload'
import { useSuspendIklan } from './useSuspendIklan'

describe('composables/useSuspendIklan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mengunggah bukti lalu suspend; sukses penuh → true + toast success', async () => {
    vi.mocked(uploadEvidence).mockResolvedValue('key-123')
    vi.mocked(iklanApi.suspend).mockResolvedValue({
      results: [{ iklan_id: '1', success: true, error: null }],
    })
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' })
    const { suspend } = useSuspendIklan('pekerja')
    const ok = await suspend(['1'], { reason: 'sepuluh char', permanent: false, file })
    expect(ok).toBe(true)
    expect(uploadEvidence).toHaveBeenCalledWith('/pekerja/admin/suspend/evidence', file)
    expect(iklanApi.suspend).toHaveBeenCalledWith('pekerja', expect.objectContaining({
      iklan_ids: ['1'],
      evidence_object_key: 'key-123',
    }))
    expect(toastMock.success).toHaveBeenCalled()
  })

  it('tanpa file → error & tidak memanggil suspend', async () => {
    const { suspend } = useSuspendIklan('barang')
    const ok = await suspend(['1'], { reason: 'r', permanent: false, file: null })
    expect(ok).toBe(false)
    expect(iklanApi.suspend).not.toHaveBeenCalled()
    expect(toastMock.error).toHaveBeenCalled()
  })

  it('daftar id kosong → false tanpa aksi', async () => {
    const { suspend } = useSuspendIklan('pekerjaan')
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' })
    const ok = await suspend([], { reason: 'r', permanent: false, file })
    expect(ok).toBe(false)
    expect(uploadEvidence).not.toHaveBeenCalled()
  })

  it('partial-success → warning & false', async () => {
    vi.mocked(uploadEvidence).mockResolvedValue('k')
    vi.mocked(iklanApi.suspend).mockResolvedValue({
      results: [
        { iklan_id: '1', success: true, error: null },
        { iklan_id: '2', success: false, error: 'gagal' },
      ],
    })
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' })
    const { suspend } = useSuspendIklan('pekerja')
    const ok = await suspend(['1', '2'], { reason: 'r', permanent: true, file })
    expect(ok).toBe(false)
    expect(toastMock.warning).toHaveBeenCalled()
  })

  it('exception saat upload → error toast & false', async () => {
    vi.mocked(uploadEvidence).mockRejectedValue(new Error('net'))
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' })
    const { suspend } = useSuspendIklan('pekerja')
    const ok = await suspend(['1'], { reason: 'r', permanent: false, file })
    expect(ok).toBe(false)
    expect(toastMock.error).toHaveBeenCalled()
  })
})
