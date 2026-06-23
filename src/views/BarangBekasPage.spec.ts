import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import BarangBekasPage from './BarangBekasPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminBarangBekas } from '@/types/domain'

vi.mock('@/composables/useSuspendIklan', () => ({
  useSuspendIklan: () => ({ submitting: ref(false), suspend: vi.fn() }),
}))
vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminBarangBekas> = {}): AdminBarangBekas {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    seller_id: '22222222-2222-4222-8222-222222222222',
    judul: 'Meja Kantor', deskripsi: 'Meja kayu jati', jenis_barang: 'bekas',
    jumlah: 2, lokasi_pengambilan: 'Jakarta Pusat', lokasi: null,
    foto_urls: [], availability_status: 'available', moderation_status: 'pending',
    deleted_at: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const emptyTable: UseServerTable<AdminBarangBekas> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminBarangBekas>

describe('BarangBekasPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul halaman', () => {
    vi.mocked(useServerTable).mockReturnValue(emptyTable as never)
    const w = mount(BarangBekasPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Iklan Barang Bekas Gratis')
  })

  it('merender judul, jenis, jumlah, lokasi', () => {
    const row = fakeRow()
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(BarangBekasPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Meja Kantor')
    expect(w.text()).toContain('Bekas') // JENIS_LABEL['bekas'] → 'Bekas'
    expect(w.text()).toContain('2')    // jumlah
    expect(w.text()).toContain('Jakarta Pusat')
  })

  it('menampilkan tombol foto saat ada foto_urls', () => {
    const row = fakeRow({ foto_urls: ['https://s3/barang.jpg'] })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(BarangBekasPage, { global: { stubs: pageStubs } })
    expect(w.find('[aria-label="Lihat foto"]').exists()).toBe(true)
  })

  it('tombol Suspend untuk non-suspended', () => {
    const row = fakeRow({ moderation_status: 'approved' })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(BarangBekasPage, { global: { stubs: pageStubs } })
    expect(w.findAll('button').some(b => b.text().includes('Suspend'))).toBe(true)
  })
})
