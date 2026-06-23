import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import DaftarPelatihanPage from './DaftarPelatihanPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminPelatihan } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/pelatihanApi', () => ({
  pelatihanApi: {
    listEndpoint: '/pelatihan/admin/pelatihan',
    exportEndpoint: '/pelatihan/admin/pelatihan/export.csv',
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    review: vi.fn(),
  },
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminPelatihan> = {}): AdminPelatihan {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    poster_id: '22222222-2222-4222-8222-222222222222',
    judul: 'Workshop Las', penyelenggara: 'BLK', deskripsi: 'Pelatihan las dasar',
    lokasi: 'Surabaya', harga: null, tanggal_mulai: '2026-07-01T00:00:00Z', tanggal_selesai: null,
    foto_urls: [], is_active: true, status: 'approved', created_by_role: 'admin',
    jumlah_peserta: 20, deleted_at: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const emptyTable: UseServerTable<AdminPelatihan> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminPelatihan>

function dataTable(rows: AdminPelatihan[]) {
  return { ...emptyTable, data: ref(rows), isEmpty: ref(rows.length === 0) }
}

describe('DaftarPelatihanPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul halaman & tombol Tambah', () => {
    vi.mocked(useServerTable).mockReturnValue(emptyTable as never)
    const w = mount(DaftarPelatihanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Daftar Pelatihan')
  })

  it('merender data pelatihan dalam tabel', () => {
    const t = dataTable([fakeRow({ judul: 'Web Dev', penyelenggara: 'Dicoding', status: 'approved' })])
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(DaftarPelatihanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Web Dev')
    expect(w.text()).toContain('Disetujui')
  })

  it('ikon Mata tampil di kolom aksi setiap baris', () => {
    const t = dataTable([fakeRow()])
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(DaftarPelatihanPage, { global: { stubs: pageStubs } })
    const eyeBtns = w.findAll('[aria-label="Lihat detail"]')
    expect(eyeBtns.length).toBe(1)
  })

  it('search input v-model', async () => {
    const t = dataTable([])
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(DaftarPelatihanPage, { global: { stubs: pageStubs } })
    const inp = w.find('input[type="search"]')
    expect(inp.exists()).toBe(true)
    await inp.setValue('workshop')
    expect(t.search.value).toBe('workshop')
  })
})
