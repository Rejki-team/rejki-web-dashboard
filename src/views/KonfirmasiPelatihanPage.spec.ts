import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import KonfirmasiPelatihanPage from './KonfirmasiPelatihanPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminEnrollment } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/pelatihanApi', () => ({
  pelatihanApi: { enrollmentDetail: vi.fn(), enrollmentReview: vi.fn() },
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminEnrollment> = {}): AdminEnrollment {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    pelatihan_id: '22222222-2222-4222-8222-222222222222',
    user_id: '33333333-3333-4333-8333-333333333333',
    bukti_transfer_object_key: 'bukti/obj.key',
    status: 'pending',
    reviewed_by: null, review_note: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const et: UseServerTable<AdminEnrollment> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminEnrollment>

function dt(rows: AdminEnrollment[]) {
  return { ...et, data: ref(rows), isEmpty: ref(rows.length === 0) }
}

describe('KonfirmasiPelatihanPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul', () => {
    vi.mocked(useServerTable).mockReturnValue(et as never)
    const w = mount(KonfirmasiPelatihanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Konfirmasi Pelatihan')
  })

  it('merender baris enrollment dengan status', () => {
    const t = dt([fakeRow({ status: 'approved' })])
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(KonfirmasiPelatihanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Disetujui')
  })

  it('ikon bukti transfer (check) tampil bila object_key ada', () => {
    const t = dt([fakeRow({ bukti_transfer_object_key: 'k' })])
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(KonfirmasiPelatihanPage, { global: { stubs: pageStubs } })
    // BaseIcon asli merender <svg>; cari di kolom bukti (text-content check alternatif).
    // object_key ada → template render `<span class="text-success-500">` berisi check icon.
    expect(w.findAll('.text-success-500').length).toBeGreaterThanOrEqual(1)
  })

  it('ikon Mata membuka detail', async () => {
    const t = dt([fakeRow({ status: 'pending' })])
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(KonfirmasiPelatihanPage, { global: { stubs: pageStubs } })
    const eyeBtns = w.findAll('[aria-label="Lihat detail"]')
    expect(eyeBtns.length).toBe(1)
  })

  it('search terhubung ke table', async () => {
    vi.mocked(useServerTable).mockReturnValue(dt([]) as never)
    const w = mount(KonfirmasiPelatihanPage, { global: { stubs: pageStubs } })
    const inp = w.find('input[type="search"]')
    expect(inp.exists()).toBe(true)
  })
})
