import { describe, it, expect, vi } from 'vitest'
import { ref, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import ServerTable from './ServerTable.vue'
import type { UseServerTable } from '@/composables/useServerTable'
import type { TableColumn } from '@/types/table'

interface Row {
  id: string
  nama: string
}

function fakeTable(rows: Row[], overrides: Partial<UseServerTable<Row>> = {}): UseServerTable<Row> {
  return {
    data: ref(rows),
    loading: ref(false),
    initialLoading: ref(false),
    error: ref(null),
    pagination: reactive({ page: 1, perPage: 20, total: rows.length, totalPages: 1 }),
    search: ref(''),
    status: ref(''),
    sortBy: ref(''),
    sortDir: ref('desc'),
    isEmpty: ref(rows.length === 0),
    setPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    setStatus: vi.fn(),
    setSort: vi.fn(),
    refresh: vi.fn(),
    exportCsv: vi.fn(),
    ...overrides,
  } as unknown as UseServerTable<Row>
}

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'nama', label: 'Nama' },
]

describe('ServerTable', () => {
  it('merender baris data', () => {
    const w = mount(ServerTable, {
      props: { table: fakeTable([{ id: '1', nama: 'A' }, { id: '2', nama: 'B' }]), columns },
    })
    expect(w.text()).toContain('A')
    expect(w.text()).toContain('B')
  })

  it('menampilkan skeleton saat initialLoading', () => {
    const t = fakeTable([], { initialLoading: ref(true) })
    const w = mount(ServerTable, { props: { table: t, columns } })
    expect(w.find('.animate-pulse').exists()).toBe(true)
  })

  it('menampilkan pesan error & tombol coba lagi', async () => {
    const refresh = vi.fn()
    const t = fakeTable([], {
      error: ref({ userMessage: 'Gagal memuat' }) as never,
      refresh,
    })
    const w = mount(ServerTable, { props: { table: t, columns } })
    expect(w.text()).toContain('Gagal memuat')
    await w.find('button').trigger('click')
    expect(refresh).toHaveBeenCalled()
  })

  it('menampilkan "Tidak ada data" saat kosong', () => {
    const t = fakeTable([], { isEmpty: ref(true) })
    const w = mount(ServerTable, { props: { table: t, columns } })
    expect(w.text()).toContain('Tidak ada data')
  })

  it('selectable: pilih semua memancarkan semua id', async () => {
    const t = fakeTable([{ id: '1', nama: 'A' }, { id: '2', nama: 'B' }])
    const w = mount(ServerTable, {
      props: { table: t, columns, selectable: true, selected: [] },
    })
    const headCheckbox = w.find('thead input[type="checkbox"]')
    await headCheckbox.setValue(true)
    const emitted = w.emitted('update:selected')
    expect(emitted).toBeTruthy()
    expect(emitted!.at(-1)![0]).toEqual(['1', '2'])
  })

  it('selectable: toggle satu baris menambah id', async () => {
    const t = fakeTable([{ id: '1', nama: 'A' }, { id: '2', nama: 'B' }])
    const w = mount(ServerTable, {
      props: { table: t, columns, selectable: true, selected: [] },
    })
    const rowCheckbox = w.findAll('tbody input[type="checkbox"]')[0]
    await rowCheckbox.setValue(true)
    const emitted = w.emitted('update:selected')
    expect(emitted!.at(-1)![0]).toEqual(['1'])
  })

  it('search v-model memperbarui table.search', async () => {
    const t = fakeTable([{ id: '1', nama: 'A' }])
    const w = mount(ServerTable, { props: { table: t, columns } })
    await w.find('input[type="search"]').setValue('cari')
    expect(t.search.value).toBe('cari')
  })
})
