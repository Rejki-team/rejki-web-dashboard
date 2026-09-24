import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import PengelolaanDukunganPage from './PengelolaanDukunganPage.vue'
import { pageStubs } from '@/test/renderHelper'
import type { UseServerTable } from '@/composables/useServerTable'
import type { AdminReport, AdminReportDetail } from '@/types/domain'

vi.mock('@/composables/useServerTable', () => ({ useServerTable: vi.fn() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), toasts: ref([]), dismiss: vi.fn() }),
}))
vi.mock('@/api/reportApi', () => ({
  reportApi: { detail: vi.fn(), review: vi.fn(), approveAndSuspend: vi.fn() },
}))

import { useServerTable } from '@/composables/useServerTable'
import { reportApi } from '@/api/reportApi'

function fakeDetail(overrides: Partial<AdminReportDetail> = {}): AdminReportDetail {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    reporter_id: '22222222-2222-4222-8222-222222222222',
    report_type: 'laporkan_iklan',
    target_type: 'iklan',
    target_id: '33333333-3333-4333-8333-333333333333',
    keterangan: 'Iklan mencurigakan dan sangat menyesatkan calon pelamar kerja',
    evidence_object_key: null,
    evidence_read_url: null,
    status: 'pending',
    action_note: null,
    reviewed_by: null,
    due_date: '2026-01-08T00:00:00Z',
    is_overdue: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    reporter_demographics: {
      education_level: null,
      gender: null,
      birth_date: null,
      address_line: null,
      village_name: null,
      district_name: null,
      regency_name: null,
      province_name: null,
      country: null,
    },
    ...overrides,
  }
}

function fakeRow(overrides: Partial<AdminReport> = {}): AdminReport {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    reporter_id: '22222222-2222-4222-8222-222222222222',
    report_type: 'laporkan_iklan',
    target_type: 'iklan',
    target_id: '33333333-3333-4333-8333-333333333333',
    keterangan: 'Iklan mencurigakan',
    evidence_object_key: null,
    status: 'pending',
    action_note: null, reviewed_by: null,
    due_date: '2026-01-08T00:00:00Z', is_overdue: false,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const rt: UseServerTable<AdminReport> = {
  data: ref([]), loading: ref(false), initialLoading: ref(false), error: ref(null),
  pagination: reactive({ page: 1, perPage: 20, total: 0, totalPages: 0 }),
  search: ref(''), status: ref(''), filter2: ref(''), sortBy: ref(''), sortDir: ref('desc'),
  isEmpty: ref(true),
  setPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
  setStatus: vi.fn(), setFilter2: vi.fn(), setSort: vi.fn(), refresh: vi.fn(), exportCsv: vi.fn(),
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

  it('merender kolom Jenis Laporan dengan label yang benar', () => {
    const t = {
      ...rt,
      data: ref([fakeRow({ report_type: 'pelaporan_masalah' })]),
      isEmpty: ref(false),
    }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    expect(w.text()).toContain('Pelaporan Masalah')
  })

  it('menampilkan badge Terlambat hanya pada baris is_overdue true', () => {
    const t = {
      ...rt,
      data: ref([
        fakeRow({ id: 'a', is_overdue: true }),
        fakeRow({ id: 'b', is_overdue: false }),
      ]),
      isEmpty: ref(false),
    }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    expect(w.text().match(/Terlambat/g)?.length).toBe(1)
  })

  it('menampilkan dropdown filter Jenis Laporan (filter kedua)', () => {
    vi.mocked(useServerTable).mockReturnValue(rt as never)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    const selects = w.findAll('select')
    // Status + Jenis Laporan (Sort tidak dipakai halaman ini).
    expect(selects.length).toBe(2)
  })

  // ── Terima & Suspend (P10, Kelompok 6 Q9) ──────────────────────────────────

  it('menampilkan tombol "Terima & Suspend" saat aduan punya target_id', async () => {
    const t = { ...rt, data: ref([fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    vi.mocked(reportApi.detail).mockResolvedValue(fakeDetail())
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    await w.find('[aria-label="Lihat detail"]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Terima & Suspend')
  })

  it('TIDAK menampilkan tombol "Terima & Suspend" bila aduan tanpa target (Pelaporan Masalah)', async () => {
    const t = { ...rt, data: ref([fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    vi.mocked(reportApi.detail).mockResolvedValue(
      fakeDetail({ target_id: null, target_type: null }),
    )
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })
    await w.find('[aria-label="Lihat detail"]').trigger('click')
    await flushPromises()
    const buttons = w.findAll('button').map((b) => b.text())
    expect(buttons.some((t) => t.includes('Terima & Suspend'))).toBe(false)
  })

  it('submit Terima & Suspend memanggil reportApi.approveAndSuspend dengan alasan pre-filled dari keterangan', async () => {
    const t = { ...rt, data: ref([fakeRow()]), isEmpty: ref(false) }
    vi.mocked(useServerTable).mockReturnValue(t as never)
    vi.mocked(reportApi.detail).mockResolvedValue(fakeDetail())
    vi.mocked(reportApi.approveAndSuspend).mockResolvedValue(undefined)
    const w = mount(PengelolaanDukunganPage, { global: { stubs: pageStubs } })

    // Buka detail, lalu klik tombol "Terima & Suspend" di footer detail (modal ke-1).
    await w.find('[aria-label="Lihat detail"]').trigger('click')
    await flushPromises()
    const detailFooter = w.findAll('.modal-footer')[0]
    const openSuspendBtn = detailFooter
      .findAll('button')
      .find((b) => b.text().includes('Terima & Suspend'))
    await openSuspendBtn!.trigger('click')
    await w.vm.$nextTick()

    // Modal konfirmasi (ke-2) muncul dengan alasan pre-filled dari keterangan aduan.
    const suspendModal = w.findAll('.modal-open')[1]
    const textarea = suspendModal.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toContain(
      'Iklan mencurigakan dan sangat menyesatkan calon pelamar kerja',
    )

    const confirmFooter = w.findAll('.modal-footer')[1]
    const confirmBtn = confirmFooter
      .findAll('button')
      .find((b) => b.text().includes('Terima & Suspend'))
    await confirmBtn!.trigger('click')
    await w.vm.$nextTick()

    expect(reportApi.approveAndSuspend).toHaveBeenCalledWith(
      fakeDetail().id,
      expect.objectContaining({
        reason: expect.stringContaining('Iklan mencurigakan'),
        is_permanent: false,
      }),
    )
  })
})
