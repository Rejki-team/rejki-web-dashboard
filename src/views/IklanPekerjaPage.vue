<script setup lang="ts">
// Halaman Iklan Pekerja (Task 5.1–5.4).
// Kolom: ID, Nama, Pengalaman (keahlian), Upah (tarif), Cara Hubungi, Foto, Status.
// Fitur: search, sort status, popup foto, bulk select + suspend, export CSV.
import { ref, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { useSuspendIklan } from '@/composables/useSuspendIklan'
import { iklanApi } from '@/api/iklanApi'
import type { AdminIklanPekerja } from '@/types/domain'
import type { TableColumn, FilterOption, SortOption } from '@/types/table'
import { formatRange, shortId, truncate } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServerTable from '@/components/ui/ServerTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import ExportCsvButton from '@/components/ui/ExportCsvButton.vue'
import PopupFoto from '@/components/ui/PopupFoto.vue'
import ModalConfirm from '@/components/ui/ModalConfirm.vue'
import BulkSelectActionBar from '@/components/ui/BulkSelectActionBar.vue'

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
  { key: 'lokasi', label: 'Cara Hubungi', slot: true, hideOnMobile: true },
  { key: 'foto', label: 'Foto', slot: true, align: 'center' },
  { key: 'status', label: 'Status', slot: true },
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

      <template #cell-lokasi="{ row }">
        {{ truncate((row as AdminIklanPekerja).lokasi, 30) }}
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
    </ServerTable>

    <BulkSelectActionBar
      :count="selected.length"
      action-label="Suspend"
      @action="openSuspend(selected)"
      @clear="selected = []"
    />

    <PopupFoto v-model:open="photoOpen" :urls="photoUrls" title="Foto Pekerjaan" />

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
