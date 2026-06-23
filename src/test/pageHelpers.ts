import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { ref, reactive, type Ref, type UnwrapNestedRefs } from 'vue'
import type { UseServerTable, PaginationState } from '@/composables/useServerTable'
import type { AppApiError } from '@/api/errors'

/**
 * Bangun return value `useServerTable<T>` palsu yang reactive untuk test halaman.
 * Semua aksi default no-op; data & state bisa dimutasi via `.value` langsung.
 */
export function fakeTable<T extends { id: string }>(
  rows: T[] = [],
): UseServerTable<T> & { _data: Ref<T[]> } {
  const _data = ref<T[]>(rows) as Ref<T[]>
  const pagination = reactive<PaginationState>({
    page: 1,
    perPage: 20,
    total: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / 20)),
  })
  return {
    data: _data,
    loading: ref(false),
    initialLoading: ref(false),
    error: ref<AppApiError | null>(null),
    pagination,
    search: ref(''),
    status: ref(''),
    sortBy: ref('created_at'),
    sortDir: ref<'asc' | 'desc'>('desc'),
    isEmpty: ref(rows.length === 0),
    setPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    setStatus: vi.fn(),
    setSort: vi.fn(),
    refresh: vi.fn(),
    exportCsv: vi.fn(),
    _data,
  } as unknown as UseServerTable<T> & { _data: Ref<T[]> }
}

// Shared mock state agar test dapat mengontrolnya dari luar.
export const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
  toasts: ref([]),
}
vi.mock('@/composables/useToast', () => ({ useToast: () => toastMock }))

// Stub komponen ringan yang membungkus Headless UI (bermasalah di jsdom).
export const stubs = {
  BaseIcon: {
    props: { name: String, size: Number },
    template: '<span class="icon-stub" :data-name="name"></span>',
  },
  StatusBadge: {
    props: { status: String },
    template: '<span class="badge-stub" :data-status="status">{{ status }}</span>',
  },
  BaseButton: {
    props: { variant: String, size: String, loading: Boolean, disabled: Boolean, type: String },
    template:
      '<button :disabled="disabled||loading" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>',
  },
  BaseModal: {
    props: { open: Boolean, title: String, size: String },
    emits: ['update:open'],
    template:
      '<div v-if="open" class="modal-stub"><h2>{{ title }}</h2><slot /><div class="footer"><slot name="footer" /></div></div>',
  },
  ModalConfirm: {
    props: {
      open: Boolean,
      title: String,
      message: String,
      confirmLabel: String,
      confirmVariant: String,
      requireReason: Boolean,
      reasonLabel: String,
      reasonMinLength: Number,
      showPermanent: Boolean,
      requireEvidence: Boolean,
      loading: Boolean,
    },
    emits: ['update:open', 'confirm'],
    template: '<div v-if="open" class="confirm-stub"><slot /></div>',
  },
  PopupFoto: {
    props: { open: Boolean, urls: Array, title: String },
    emits: ['update:open'],
    template: '<div v-if="open" class="popup-stub" :data-urls="JSON.stringify(urls)"></div>',
  },
  ExportCsvButton: {
    props: { onExport: Function },
    template: '<button class="csv-btn" @click="onExport()">Export CSV</button>',
  },
  ServerTable: {
    props: {
      table: Object,
      columns: Array,
      searchPlaceholder: String,
      filterOptions: Array,
      sortOptions: Array,
      selectable: Boolean,
      selected: Array,
    },
    emits: ['update:selected'],
    template: `
      <div class="server-table-stub">
        <input class="search-stub" :placeholder="searchPlaceholder" @input="$emit('update:selected', $event)" />
        <div v-for="r in table.data.value" :key="r.id" class="row-stub" :data-id="r.id">
          <slot name="cell-id" :row="r"><span>{{ r.id }}</span></slot>
          <slot name="cell-nama" :row="r"><span>{{ r.nama }}</span></slot>
          <slot name="cell-judul" :row="r"><span>{{ r.judul }}</span></slot>
          <slot name="cell-deskripsi" :row="r"><span>{{ r.deskripsi }}</span></slot>
          <slot name="cell-perusahaan" :row="r"><span>{{ r.perusahaan }}</span></slot>
          <slot name="cell-lokasi" :row="r"><span>{{ r.lokasi }}</span></slot>
          <slot name="cell-keahlian" :row="r"><span /></slot>
          <slot name="cell-jenis_barang" :row="r"><span>{{ r.jenis_barang }}</span></slot>
          <slot name="cell-tarif" :row="r"><span /></slot>
          <slot name="cell-jumlah" :row="r"><span>{{ r.jumlah }}</span></slot>
          <slot name="cell-lokasi_pengambilan" :row="r"><span>{{ r.lokasi_pengambilan }}</span></slot>
          <slot name="cell-foto" :row="r"><span /></slot>
          <slot name="cell-status" :row="r"><span>{{ r.moderation_status }}</span></slot>
          <slot name="cell-aksi" :row="r"><span /></slot>
        </div>
        <div v-if="selectable" class="bulk-bar"><slot name="bulk" /></div>
      </div>`,
  },
  BulkSelectActionBar: {
    props: { count: Number, actionLabel: String },
    emits: ['action', 'clear'],
    template:
      '<div v-if="count>0" class="bulk-bar-stub"><button class="bulk-action" @click="$emit(\'action\')">{{ actionLabel }} ({{ count }})</button><button class="bulk-clear" @click="$emit(\'clear\')">Clear</button></div>',
  },
  PageHeader: {
    props: { title: String, description: String },
    template: '<div class="page-header-stub"><h1>{{ title }}</h1><p>{{ description }}</p><slot name="actions" /></div>',
  },
  RouterLink: {
    props: { to: [String, Object] },
    template: '<a :href="typeof to === \'string\' ? to : to?.name"><slot /></a>',
  },
}

/** Reset semua mock antar test. */
export function resetAllMocks() {
  vi.clearAllMocks()
  toastMock.success.mockReset()
  toastMock.error.mockReset()
  toastMock.warning.mockReset()
}
