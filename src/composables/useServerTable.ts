// Composable tabel server-side (Task 4.1) — abstraksi reuse untuk 10+ halaman admin.
//
// GROUNDED pada kontrak backend:
//  - Query: limit, offset, q (search), status (filter), sort_by, sort_dir (asc|desc).
//  - Respons: ApiResponse<T[]> dengan meta PaginatedMeta { page, per_page, total, total_pages }.
//
// Mengembalikan state reaktif + aksi. Setiap perubahan page/search/sort/filter memicu fetch
// baru (server-side). Search di-debounce. Membatalkan request usang (race) via token urutan.

import { ref, reactive, computed, watch, onUnmounted, type Ref } from 'vue'
import type { ApiResponse } from '@/types/api'
import { http } from '@/api/http'
import { normalizeError, AppApiError } from '@/api/errors'
import { downloadCsv } from '@/utils/download'
import { debounce } from '@/utils/debounce'

export interface ServerTableOptions {
  /** Path list, mis. `/pekerja/admin`. */
  endpoint: string
  /** Path export CSV, mis. `/pekerja/admin/export.csv` (opsional). */
  exportEndpoint?: string
  /** Items per halaman (default 20). */
  perPage?: number
  /** Status default (mis. KYC default `pending`). */
  defaultStatus?: string
  /** Kolom sort default. */
  defaultSortBy?: string
  defaultSortDir?: 'asc' | 'desc'
  /** Nama berkas CSV. */
  csvFilename?: string
}

export interface PaginationState {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface UseServerTable<T> {
  data: Ref<T[]>
  loading: Ref<boolean>
  /** True hanya pada pemuatan PERTAMA (untuk skeleton). */
  initialLoading: Ref<boolean>
  error: Ref<AppApiError | null>
  pagination: PaginationState
  search: Ref<string>
  status: Ref<string>
  sortBy: Ref<string>
  sortDir: Ref<'asc' | 'desc'>
  isEmpty: Ref<boolean>
  setPage: (p: number) => void
  nextPage: () => void
  prevPage: () => void
  setStatus: (s: string) => void
  setSort: (by: string, dir: 'asc' | 'desc') => void
  refresh: () => Promise<void>
  exportCsv: () => Promise<void>
}

export function useServerTable<T>(opts: ServerTableOptions): UseServerTable<T> {
  const perPage = opts.perPage ?? 20

  const data = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const initialLoading = ref(true)
  const error = ref<AppApiError | null>(null)

  const search = ref('')
  const status = ref(opts.defaultStatus ?? '')
  const sortBy = ref(opts.defaultSortBy ?? '')
  const sortDir = ref<'asc' | 'desc'>(opts.defaultSortDir ?? 'desc')

  const pagination = reactive<PaginationState>({
    page: 1,
    perPage,
    total: 0,
    totalPages: 0,
  })

  const isEmpty = computed(() => !loading.value && data.value.length === 0)

  // Token urutan untuk membuang respons usang (Zero Race Condition pada UI tabel).
  let requestSeq = 0

  function buildParams(): Record<string, string> {
    const params: Record<string, string> = {
      limit: String(pagination.perPage),
      offset: String((pagination.page - 1) * pagination.perPage),
    }
    if (search.value.trim()) params.q = search.value.trim()
    if (status.value) params.status = status.value
    if (sortBy.value) params.sort_by = sortBy.value
    if (sortDir.value) params.sort_dir = sortDir.value
    return params
  }

  async function fetchData(): Promise<void> {
    const seq = ++requestSeq
    loading.value = true
    error.value = null
    try {
      const res = await http.get<ApiResponse<T[]>>(opts.endpoint, { params: buildParams() })
      if (seq !== requestSeq) return // respons usang → buang.
      data.value = res.data.data
      const meta = res.data.meta
      if (meta) {
        pagination.total = meta.total
        // total_pages backend dihitung dari per_page-nya; gunakan perPage lokal sebagai sumber
        // halaman agar konsisten dengan limit yang dikirim.
        pagination.totalPages = Math.max(1, Math.ceil(meta.total / pagination.perPage))
      } else {
        pagination.total = data.value.length
        pagination.totalPages = 1
      }
    } catch (err) {
      if (seq !== requestSeq) return
      error.value = normalizeError(err)
      data.value = []
    } finally {
      if (seq === requestSeq) {
        loading.value = false
        initialLoading.value = false
      }
    }
  }

  const debouncedFetch = debounce(() => {
    pagination.page = 1
    void fetchData()
  }, 350)

  // Search → debounce + reset page.
  watch(search, () => debouncedFetch())

  function setPage(p: number) {
    const target = Math.min(Math.max(1, p), Math.max(1, pagination.totalPages))
    if (target === pagination.page) return
    pagination.page = target
    void fetchData()
  }
  function nextPage() {
    setPage(pagination.page + 1)
  }
  function prevPage() {
    setPage(pagination.page - 1)
  }
  function setStatus(s: string) {
    status.value = s
    pagination.page = 1
    void fetchData()
  }
  function setSort(by: string, dir: 'asc' | 'desc') {
    sortBy.value = by
    sortDir.value = dir
    pagination.page = 1
    void fetchData()
  }
  async function refresh() {
    await fetchData()
  }

  async function exportCsv() {
    if (!opts.exportEndpoint) return
    const params: Record<string, string | undefined> = {
      q: search.value.trim() || undefined,
      status: status.value || undefined,
    }
    await downloadCsv(opts.exportEndpoint, params, opts.csvFilename ?? 'export.csv')
  }

  onUnmounted(() => debouncedFetch.cancel())

  // Fetch awal.
  void fetchData()

  return {
    data,
    loading,
    initialLoading,
    error,
    pagination,
    search,
    status,
    sortBy,
    sortDir,
    isEmpty,
    setPage,
    nextPage,
    prevPage,
    setStatus,
    setSort,
    refresh,
    exportCsv,
  }
}
