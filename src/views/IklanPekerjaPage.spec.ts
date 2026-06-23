import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import IklanPekerjaPage from './IklanPekerjaPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminIklanPekerja } from '@/types/domain'

vi.mock('@/composables/useSuspendIklan', () => ({
  useSuspendIklan: () => ({ submitting: ref(false), suspend: vi.fn() }),
}))
vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminIklanPekerja> = {}): AdminIklanPekerja {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    poster_id: '22222222-2222-4222-8222-222222222222',
    nama: 'Budi Tukang Las', keahlian: ['las', 'cat'], deskripsi: 'x',
    lokasi: 'Jakarta', tarif_min: 50_000, tarif_max: 100_000,
    foto_urls: [], is_active: true, moderation_status: 'pending',
    deleted_at: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

const emptyTable = {
  data: ref<AdminIklanPekerja[]>([]),
  loading: ref(false),
  initialLoading: ref(false),
  error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref<'asc'|'desc'>('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminIklanPekerja>

describe('IklanPekerjaPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul halaman & deskripsi', () => {
    vi.mocked(useServerTable).mockReturnValue(emptyTable as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    expect(wrapper.text()).toContain('Iklan Pekerja')
    expect(wrapper.text()).toContain('Moderasi iklan pencari kerja')
  })

  it('merender nama & status baris data', () => {
    const t = { ...emptyTable, data: ref([fakeRow({ nama: 'Andi', moderation_status: 'approved' })]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    expect(wrapper.text()).toContain('Andi')
    expect(wrapper.text()).toContain('Disetujui')
  })

  it('search v-model terhubung ke table.search', async () => {
    const t = { ...emptyTable, isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    const input = wrapper.find('input[type="search"]')
    expect(input.exists()).toBe(true)
    await input.setValue('budi')
    expect(t.search.value).toBe('budi')
  })

  it('menampilkan empty state saat tidak ada data', () => {
    vi.mocked(useServerTable).mockReturnValue(emptyTable as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    expect(wrapper.text()).toContain('Tidak ada data')
  })

  it('menampilkan foto button untuk baris dengan foto_urls', () => {
    const row = fakeRow({ foto_urls: ['https://s3/f1.jpg'] })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    // ServerTable merender slot #cell-foto yang berisi <button aria-label="Lihat foto">
    expect(wrapper.find('[aria-label="Lihat foto"]').exists()).toBe(true)
  })

  it('menampilkan tombol Suspend untuk baris non-suspended', () => {
    const row = fakeRow({ moderation_status: 'pending' })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    const allButtons = wrapper.findAll('button')
    const hasSuspend = allButtons.some(b => b.text().includes('Suspend'))
    expect(hasSuspend).toBe(true)
  })

  it('tidak menampilkan tombol Suspend untuk iklan suspended', () => {
    const row = fakeRow({ moderation_status: 'suspended' })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    const allButtons = wrapper.findAll('button')
    const hasSuspend = allButtons.some(b => b.text().includes('Suspend'))
    expect(hasSuspend).toBe(false)
  })

  it('tidak ada tombol foto untuk baris tanpa foto', () => {
    const row = fakeRow({ foto_urls: [] })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const wrapper = mount(IklanPekerjaPage, { global: { stubs: pageStubs } })
    expect(wrapper.find('[aria-label="Lihat foto"]').exists()).toBe(false)
  })
})
