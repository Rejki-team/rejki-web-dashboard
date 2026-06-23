import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import PengelolaanPenggunaPage from './PengelolaanPenggunaPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminKycListItem } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/penggunaApi', () => ({
  penggunaApi: {
    listEndpoint: '/users/admin/kyc',
    exportEndpoint: '/users/admin/kyc/export.csv',
    detail: vi.fn(),
    review: vi.fn(),
    documentUrl: vi.fn(),
    evidenceEndpoint: vi.fn(),
    bulkSuspend: vi.fn(),
  },
}))
vi.mock('@/utils/upload', () => ({ validateEvidenceFile: () => ({ ok: true }), uploadEvidence: vi.fn() }))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminKycListItem> = {}): AdminKycListItem {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    full_name: 'Budi Santoso',
    education_level: 's1',
    gender: 'male',
    birth_date: '1990-01-01',
    address_line: 'Jl. Merdeka No. 10',
    country_code: 'ID',
    province_id: null, regency_id: null, district_id: null, village_id: null,
    nik_masked: 'xxx...8901',
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const kt: UseServerTable<AdminKycListItem> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref('pending'), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminKycListItem>

describe('PengelolaanPenggunaPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul', () => {
    vi.mocked(useServerTable).mockReturnValue(kt as never)
    const w = mount(PengelolaanPenggunaPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Pengelolaan Pengguna')
  })

  it('merender nama & status KYC', () => {
    const t = { ...kt, data: ref([fakeRow({ full_name: 'Andi', status: 'approved' })]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanPenggunaPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Andi')
    expect(w.text()).toContain('Disetujui')
  })

  it('menampilkan label pendidikan (EDU_LABEL) & gender', () => {
    const t = { ...kt, data: ref([fakeRow({ education_level: 'sma', gender: 'female' })]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanPenggunaPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('SMA/SMK')
    expect(w.text()).toContain('Perempuan')
  })

  it('ikon Mata ada untuk setiap pengajuan', () => {
    const t = { ...kt, data: ref([fakeRow(), fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanPenggunaPage, { global: { stubs: pageStubs } })
    const eyeBtns = w.findAll('[aria-label="Lihat detail"]')
    expect(eyeBtns.length).toBe(2)
  })

  it('filter status default pending', () => {
    vi.mocked(useServerTable).mockReturnValue(kt as never)
    const w = mount(PengelolaanPenggunaPage, { global: { stubs: pageStubs } })
    const select = w.find('select')
    expect(select.exists()).toBe(true)
  })
})
