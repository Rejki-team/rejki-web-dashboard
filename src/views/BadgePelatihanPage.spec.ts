import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import BadgePelatihanPage from './BadgePelatihanPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminBadge } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/pelatihanApi', () => ({
  pelatihanApi: { badgeDetail: vi.fn(), badgeReview: vi.fn() },
}))

import { useServerTable } from '@/composables/useServerTable'

function fakeRow(overrides: Partial<AdminBadge> = {}): AdminBadge {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    pelatihan_id: '22222222-2222-4222-8222-222222222222',
    user_id: '33333333-3333-4333-8333-333333333333',
    sertifikat_object_key: 'sert/obj.key',
    approved_at: null,
    status: 'pending',
    reviewed_by: null, review_note: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const bt: UseServerTable<AdminBadge> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
} as unknown as UseServerTable<AdminBadge>

describe('BadgePelatihanPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merender judul', () => {
    vi.mocked(useServerTable).mockReturnValue(bt as never)
    const w = mount(BadgePelatihanPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Badge Pelatihan')
  })

  it('ikon sertifikat tampil bila object_key ada', () => {
    const t = { ...bt, data: ref([fakeRow({ sertifikat_object_key: 'k' })]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(BadgePelatihanPage, { global: { stubs: pageStubs } })
    // BaseIcon asli merender SVG; object_key ada → span .text-success-500 dengan check icon.
    expect(w.findAll('.text-success-500').length).toBeGreaterThanOrEqual(1)
  })

  it('ikon Mata ada untuk setiap baris', () => {
    const t = { ...bt, data: ref([fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(BadgePelatihanPage, { global: { stubs: pageStubs } })
    const eyeBtns = w.findAll('[aria-label="Lihat detail"]')
    expect(eyeBtns.length).toBe(1)
  })
})
