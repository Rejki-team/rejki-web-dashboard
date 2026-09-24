<script setup lang="ts">
// Halaman Iklan Pekerja (Task 5.1–5.4).
// Kolom: ID, Nama, Pengalaman (keahlian), Upah (tarif), Jam Kerja, Cara Hubungi
// (phone_number — F-7, Kelompok 6 P8.2, BUKAN lokasi seperti sebelumnya), Foto, Status, Aksi.
// Fitur: search, sort status, popup foto, bulk select + suspend, export CSV,
// popup detail dengan click-to-view NIK/KTP/Selfie poster (F-27b, teraudit di user-service).
import { ref, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { useSuspendIklan } from '@/composables/useSuspendIklan'
import { iklanApi } from '@/api/iklanApi'
import type { AdminIklanPekerja, AdminIklanPekerjaDetail } from '@/types/domain'
import type { TableColumn, FilterOption, SortOption } from '@/types/table'
import { formatRange, shortId } from '@/utils/format'
import { normalizeError } from '@/api/errors'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServerTable from '@/components/ui/ServerTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ExportCsvButton from '@/components/ui/ExportCsvButton.vue'
import PopupFoto from '@/components/ui/PopupFoto.vue'
import ModalConfirm from '@/components/ui/ModalConfirm.vue'
import BulkSelectActionBar from '@/components/ui/BulkSelectActionBar.vue'
import MaskedValue from '@/components/ui/MaskedValue.vue'

const toast = useToast()

const table = useServerTable<AdminIklanPekerja>({
  endpoint: iklanApi.listEndpoint('pekerja'),
  exportEndpoint: iklanApi.exportEndpoint('pekerja'),
  csvFilename: 'iklan-pekerja.csv',
})

const { submitting, suspend } = useSuspendIklan('pekerja')

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'nama', label: 'Nama', slot: true },
  { key: 'keahlian', label: 'Pengalaman', slot: true, hideOnMobile: true },
  { key: 'tarif', label: 'Upah', slot: true, hideOnMobile: true },
  { key: 'jam_kerja', label: 'Jam Kerja', slot: true, hideOnMobile: true },
  { key: 'kontak', label: 'Cara Hubungi', slot: true, hideOnMobile: true },
  { key: 'foto', label: 'Foto', slot: true, align: 'center' },
  { key: 'status', label: 'Status', slot: true },
  { key: 'aksi', label: 'Aksi', slot: true, align: 'center' },
]

const filterOptions: FilterOption[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Disuspensi', value: 'suspended' },
]

const sortOptions: SortOption[] = [
  { label: 'Terbaru', sortBy: 'created_at', sortDir: 'desc' },
  { label: 'Terlama', sortBy: 'created_at', sortDir: 'asc' },
]

// Bulk select
const selected = ref<string[]>([])

// Popup foto
const photoOpen = ref(false)
const photoUrls = ref<string[]>([])
function openPhoto(urls: string[]) {
  photoUrls.value = urls
  photoOpen.value = true
}

// Suspend modal
const suspendOpen = ref(false)
const suspendTargets = ref<string[]>([])
function openSuspend(ids: string[]) {
  if (ids.length === 0) return
  suspendTargets.value = ids
  suspendOpen.value = true
}

async function onSuspendConfirm(args: {
  reason: string
  permanent: boolean
  file: File | null
}) {
  const ok = await suspend(suspendTargets.value, args)
  if (ok) {
    suspendOpen.value = false
    selected.value = []
    await table.refresh()
  }
}

const suspendCount = computed(() => suspendTargets.value.length)

// ── Detail (F-27b) ──
const detailOpen = ref(false)
const current = ref<AdminIklanPekerjaDetail | null>(null)
const loadingDetail = ref(false)

async function openDetail(row: AdminIklanPekerja) {
  detailOpen.value = true
  loadingDetail.value = true
  current.value = null
  try {
    current.value = await iklanApi.pekerjaDetail(row.id)
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    loadingDetail.value = false
  }
}

// Fetch data sensitif (audited di user-service) — dipakai MaskedValue.
function fetchNik(): Promise<string> {
  if (!current.value) return Promise.reject(new Error('no iklan'))
  return iklanApi.pekerjaRevealSensitive(current.value.id, 'nik')
}
function fetchKtp(): Promise<string> {
  if (!current.value) return Promise.reject(new Error('no iklan'))
  return iklanApi.pekerjaRevealSensitive(current.value.id, 'ktp')
}
function fetchSelfie(): Promise<string> {
  if (!current.value) return Promise.reject(new Error('no iklan'))
  return iklanApi.pekerjaRevealSensitive(current.value.id, 'selfie')
}
</script>

<template>
  <div>
    <PageHeader title="Iklan Pekerja" description="Moderasi iklan pencari kerja" />

    <ServerTable
      v-model:selected="selected"
      :table="table"
      :columns="columns"
      :filter-options="filterOptions"
      :sort-options="sortOptions"
      search-placeholder="Cari nama / kode / pembuat..."
      selectable
    >
      <template #actions>
        <ExportCsvButton :on-export="table.exportCsv" />
      </template>

      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminIklanPekerja).id) }}</span>
      </template>

      <template #cell-nama="{ row }">
        <span class="font-medium text-slate-800">{{ (row as AdminIklanPekerja).nama }}</span>
      </template>

      <template #cell-keahlian="{ row }">
        {{ (row as AdminIklanPekerja).keahlian.join(', ') || '-' }}
      </template>

      <template #cell-tarif="{ row }">
        {{ formatRange((row as AdminIklanPekerja).tarif_min, (row as AdminIklanPekerja).tarif_max) }}
      </template>

      <template #cell-jam_kerja="{ row }">
        {{ (row as AdminIklanPekerja).jam_kerja ?? '-' }}
      </template>

      <template #cell-kontak="{ row }">
        {{ (row as AdminIklanPekerja).phone_number ?? '-' }}
      </template>

      <template #cell-foto="{ row }">
        <button
          v-if="(row as AdminIklanPekerja).foto_urls.length"
          type="button"
          class="inline-flex items-center justify-center rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat foto"
          @click="openPhoto((row as AdminIklanPekerja).foto_urls)"
        >
          <BaseIcon name="photo" :size="18" />
        </button>
        <span v-else class="text-slate-300">-</span>
      </template>

      <template #cell-status="{ row }">
        <div class="flex items-center gap-2">
          <StatusBadge :status="(row as AdminIklanPekerja).moderation_status" />
          <BaseButton
            v-if="(row as AdminIklanPekerja).moderation_status !== 'suspended'"
            variant="danger"
            size="sm"
            @click="openSuspend([(row as AdminIklanPekerja).id])"
          >
            Suspend
          </BaseButton>
        </div>
      </template>

      <template #cell-aksi="{ row }">
        <button
          type="button"
          class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat detail"
          @click="openDetail(row as AdminIklanPekerja)"
        >
          <BaseIcon name="eye" :size="18" />
        </button>
      </template>
    </ServerTable>

    <BulkSelectActionBar
      :count="selected.length"
      action-label="Suspend"
      @action="openSuspend(selected)"
      @clear="selected = []"
    />

    <PopupFoto v-model:open="photoOpen" :urls="photoUrls" title="Foto Pekerjaan" />

    <!-- Detail iklan + click-to-view NIK/KTP/Selfie poster (F-27b) -->
    <BaseModal v-model:open="detailOpen" title="Detail Iklan Pekerja" size="lg">
      <div v-if="loadingDetail" class="py-8 text-center text-slate-400">Memuat...</div>
      <div v-else-if="current" class="space-y-3 text-sm">
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">Nama</dt>
            <dd class="font-medium">{{ current.nama }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Upah</dt>
            <dd>{{ formatRange(current.tarif_min, current.tarif_max) }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">Pengalaman</dt>
            <dd>{{ current.keahlian.join(', ') || '-' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">Deskripsi</dt>
            <dd>{{ current.deskripsi }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="mb-1 text-slate-500">Dokumen Sensitif Poster (click-to-view, akses dicatat)</dt>
            <dd class="flex flex-wrap items-center gap-3">
              <MaskedValue
                v-if="current.has_nik"
                mode="text"
                masked="xxx...xxxx"
                label="NIK"
                :fetch-real="fetchNik"
              />
              <span v-else class="text-xs text-slate-400">NIK tidak tersedia</span>
              <MaskedValue
                v-if="current.has_ktp"
                mode="image"
                masked="KTP"
                label="Foto KTP"
                :fetch-real="fetchKtp"
              />
              <span v-else class="text-xs text-slate-400">KTP tidak tersedia</span>
              <MaskedValue
                v-if="current.has_selfie"
                mode="image"
                masked="Selfie"
                label="Foto Selfie"
                :fetch-real="fetchSelfie"
              />
              <span v-else class="text-xs text-slate-400">Selfie tidak tersedia</span>
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">Status</dt>
            <dd><StatusBadge :status="current.moderation_status" /></dd>
          </div>
        </dl>
      </div>
    </BaseModal>

    <ModalConfirm
      v-model:open="suspendOpen"
      :title="`Suspend ${suspendCount} Iklan`"
      message="Iklan yang disuspensi akan disembunyikan dan pemilik akan menerima notifikasi."
      confirm-label="Suspend"
      confirm-variant="danger"
      require-reason
      reason-label="Alasan"
      :reason-min-length="10"
      show-permanent
      require-evidence
      :loading="submitting"
      @confirm="onSuspendConfirm"
    />
  </div>
</template>
