import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import type { UseServerTable } from './useServerTable'

vi.mock('@/api/http', () => ({ http: { get: vi.fn() } }))
vi.mock('@/utils/download', () => ({ downloadCsv: vi.fn() }))

import { http } from '@/api/http'
import { downloadCsv } from '@/utils/download'
import { useServerTable } from './useServerTable'

interface Row {
  id: string
  nama: string
}

// Jalankan composable dalam scope komponen agar onUnmounted valid.
function runTable(opts: Parameters<typeof useServerTable<Row>>[0]) {
  let api!: UseServerTable<Row>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useServerTable<Row>(opts)
        return () => h('div')
      },
    }),
  )
  return { api, wrapper }
}

function mockList(rows: Row[], total: number) {
  vi.mocked(http.get).mockResolvedValue({
    data: { success: true, data: rows, meta: { page: 1, per_page: 20, total, total_pages: 1 }, request_id: 'r' },
  } as never)
}

describe('composables/useServerTable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetch awal mengisi data & pagination dari meta', async () => {
    mockList([{ id: '1', nama: 'A' }], 1)
    const { api } = runTable({ endpoint: '/x/admin' })
    await nextTick()
    await nextTick()
    expect(api.data.value).toHaveLength(1)
    expect(api.pagination.total).toBe(1)
    expect(api.initialLoading.value).toBe(false)
  })

  it('mengirim limit & offset sesuai halaman', async () => {
    mockList([{ id: '1', nama: 'A' }], 100)
    const { api } = runTable({ endpoint: '/x/admin', perPage: 20 })
    await nextTick()
    await nextTick()
    api.setPage(2)
    await nextTick()
    const lastCall = vi.mocked(http.get).mock.calls.at(-1)
    expect(lastCall?.[1]?.params).toMatchObject({ limit: '20', offset: '20' })
  })

  it('setStatus menambahkan param status & reset page', async () => {
    mockList([], 0)
    const { api } = runTable({ endpoint: '/x/admin' })
    await nextTick()
    api.setStatus('approved')
    await nextTick()
    const lastCall = vi.mocked(http.get).mock.calls.at(-1)
    expect(lastCall?.[1]?.params).toMatchObject({ status: 'approved' })
    expect(api.pagination.page).toBe(1)
  })

  it('setSort menambahkan sort_by & sort_dir', async () => {
    mockList([], 0)
    const { api } = runTable({ endpoint: '/x/admin' })
    await nextTick()
    api.setSort('created_at', 'asc')
    await nextTick()
    const lastCall = vi.mocked(http.get).mock.calls.at(-1)
    expect(lastCall?.[1]?.params).toMatchObject({ sort_by: 'created_at', sort_dir: 'asc' })
  })

  it('isEmpty true saat tidak ada data', async () => {
    mockList([], 0)
    const { api } = runTable({ endpoint: '/x/admin' })
    await nextTick()
    await nextTick()
    expect(api.isEmpty.value).toBe(true)
  })

  it('error diisi saat fetch gagal', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('boom'))
    const { api } = runTable({ endpoint: '/x/admin' })
    await nextTick()
    await nextTick()
    expect(api.error.value).not.toBeNull()
    expect(api.data.value).toHaveLength(0)
  })

  it('exportCsv memanggil downloadCsv dengan filter aktif', async () => {
    mockList([], 0)
    const { api } = runTable({
      endpoint: '/x/admin',
      exportEndpoint: '/x/admin/export.csv',
      csvFilename: 'x.csv',
    })
    await nextTick()
    api.status.value = 'pending'
    await api.exportCsv()
    expect(downloadCsv).toHaveBeenCalledWith(
      '/x/admin/export.csv',
      expect.objectContaining({ status: 'pending' }),
      'x.csv',
    )
  })
})
