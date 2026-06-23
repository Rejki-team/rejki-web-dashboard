import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import PengelolaanDukunganPage from './PengelolaanDukunganPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminReport } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/reportApi', () => ({
  reportApi: { detail: vi.fn(), review: vi.fn() },
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminReport> = {}): AdminReport {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    reporter_id: '22222222-2222-4222-8222-222222222222',
    target_type: 'iklan',
    target_id: '33333333-3333-4333-8333-333333333333',
    keterangan: 'Iklan mencurigakan',
    evidence_object_key: null,
    status: 'pending',
    action_note: null, reviewed_by: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const rt: UseServerTable<AdminReport> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminReport>

describe('PengelolaanDukunganPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul', () => {
    vi.mocked(useServerTable).mockReturnValue(rt as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Pengelolaan Dukungan')
  })

  it('merender baris aduan dengan keterangan & status', () => {
    const t = { ...rt, data: ref([fakeRow({ keterangan: 'Spam', status: 'resolved' })]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Spam')
    expect(w.text()).toContain('Selesai')
  })

  it('ikon Mata muncul untuk setiap aduan', () => {
    const t = { ...rt, data: ref([fakeRow(), fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    const eyeBtns = w.findAll('[aria-label="Lihat detail"]')
    expect(eyeBtns.length).toBe(2)
  })

  it('menampilkan filter status', () => {
    vi.mocked(useServerTable).mockReturnValue(rt as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    const select = w.find('select')
    expect(select.exists()).toBe(true)
  })
})
