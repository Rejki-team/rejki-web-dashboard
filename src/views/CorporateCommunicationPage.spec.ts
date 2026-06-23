import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import CorporateCommunicationPage from './CorporateCommunicationPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminArticle } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/articleApi', () => ({
  articleApi: { detail: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), photoUpload: vi.fn() },
}))
vi.mock('@/utils/upload', () => ({ validateEvidenceFile: () => ({ ok: true }) }))
vi.mock('axios', () => ({ default: { put: vi.fn().mockResolvedValue({}) } }))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminArticle> = {}): AdminArticle {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    author_id: '22222222-2222-4222-8222-222222222222',
    category: 'informasi', title: 'Pengumuman', body: 'Isi pengumuman...',
    photo_object_key: null, deleted_at: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const at: UseServerTable<AdminArticle> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminArticle>

describe('CorporateCommunicationPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul', () => {
    vi.mocked(useServerTable).mockReturnValue(at as never)
    const w = mount(CorporateCommunicationPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Corporate Communication')
  })

  it('merender artikel dengan judul & isi', () => {
    const t = { ...at, data: ref([fakeRow({ title: 'Info', body: 'Konten' })]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(CorporateCommunicationPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Info')
    expect(w.text()).toContain('Konten')
  })

  it('menampilkan tombol Buat Artikel', () => {
    vi.mocked(useServerTable).mockReturnValue(at as never)
    const w = mount(CorporateCommunicationPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Buat Artikel')
  })

  it('ikon Pena & Tong Sampah muncul untuk setiap baris', () => {
    const t = { ...at, data: ref([fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(CorporateCommunicationPage, { global: { stubs: pageStubs } })
    // BaseIcon asli tidak punya .icon-stub. Verifikasi via teks tombol aksi.
    const cellAksi = w.findAll('[aria-label="Edit artikel"]')
    expect(cellAksi.length).toBe(1)
    const deleteBtn = w.findAll('[aria-label="Hapus artikel"]')
    expect(deleteBtn.length).toBe(1)
  })

  it('search terhubung', async () => {
    vi.mocked(useServerTable).mockReturnValue(at as never)
    const w = mount(CorporateCommunicationPage, { global: { stubs: pageStubs } })
    const inp = w.find('input[type="search"]')
    expect(inp.exists()).toBe(true)
  })
})
