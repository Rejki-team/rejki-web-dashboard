import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import IklanPekerjaanPage from './IklanPekerjaanPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminIklanPekerjaan } from '@/types/domain'

vi.mock('@/composables/useSuspendIklan', () => ({
  useSuspendIklan: () => ({ submitting: ref(false), suspend: vi.fn() }),
}))
vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminIklanPekerjaan> = {}): AdminIklanPekerjaan {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    poster_id: '22222222-2222-4222-8222-222222222222',
    judul: 'Lowongan Backend Dev',
    perusahaan: 'PT Rejki',
    deskripsi: 'Backend developer berpengalaman',
    lokasi: 'Bandung',
    foto_urls: [],
    is_active: true,
    moderation_status: 'pending',
    deleted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const emptyTable: UseServerTable<AdminIklanPekerjaan> = {
  data: ref([]),
  loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminIklanPekerjaan>

describe('IklanPekerjaanPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul halaman', () => {
    vi.mocked(useServerTable).mockReturnValue(emptyTable as never)
    const w = mount(IklanPekerjaanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Iklan Pekerjaan')
  })

  it('merender judul lowongan & perusahaan', () => {
    const row = fakeRow({ judul: 'Frontend Dev', perusahaan: 'PT ABC', moderation_status: 'approved' })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(IklanPekerjaanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Frontend Dev')
    expect(w.text()).toContain('PT ABC')
    expect(w.text()).toContain('Disetujui')
  })

  it('menampilkan foto button bila ada foto', () => {
    const row = fakeRow({ foto_urls: ['https://s3/f1.jpg'] })
    const t = { ...emptyTable, data: ref([row]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(IklanPekerjaanPage, { global: { stubs: pageStubs } })
    expect(w.find('[aria-label="Lihat foto"]').exists()).toBe(true)
  })

  it('tombol Suspend ada untuk status pending, tidak untuk suspended', () => {
    const pending = fakeRow({ moderation_status: 'pending' })
    const t1 = { ...emptyTable, data: ref([pending]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t1 as never)
    const w1 = mount(IklanPekerjaanPage, { global: { stubs: pageStubs } })
    expect(w1.findAll('button').some(b => b.text().includes('Suspend'))).toBe(true)

    const suspended = fakeRow({ moderation_status: 'suspended' })
    const t2 = { ...emptyTable, data: ref([suspended]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t2 as never)
    const w2 = mount(IklanPekerjaanPage, { global: { stubs: pageStubs } })
    expect(w2.findAll('button').some(b => b.text().includes('Suspend'))).toBe(false)
  })
})
