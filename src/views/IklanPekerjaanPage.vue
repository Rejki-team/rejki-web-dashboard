<script setup lang="ts">
// Halaman Iklan Pekerjaan (Task 6.1–6.2). Pola sama dengan Iklan Pekerja.
// Kolom mengikuti AdminIklanDocResponse nyata (ID, Judul, Perusahaan, Deskripsi, Lokasi,
// Foto, Status). Field upah/jam tidak ada di DTO admin backend → tidak ditampilkan
// (grounded; tidak mengada-ada).
import { ref, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { useSuspendIklan } from '@/composables/useSuspendIklan'
import { iklanApi } from '@/api/iklanApi'
import type { AdminIklanPekerjaan } from '@/types/domain'
import type { TableColumn, FilterOption, SortOption } from '@/types/table'
import { shortId, truncate } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServerTable from '@/components/ui/ServerTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import ExportCsvButton from '@/components/ui/ExportCsvButton.vue'
import PopupFoto from '@/components/ui/PopupFoto.vue'
import ModalConfirm from '@/components/ui/ModalConfirm.vue'
import BulkSelectActionBar from '@/components/ui/BulkSelectActionBar.vue'

const table = useServerTable<AdminIklanPekerjaan>({
  endpoint: iklanApi.listEndpoint('pekerjaan'),
  exportEndpoint: iklanApi.exportEndpoint('pekerjaan'),
  csvFilename: 'iklan-pekerjaan.csv',
})

const { submitting, suspend } = useSuspendIklan('pekerjaan')

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'judul', label: 'Judul', slot: true },
  { key: 'perusahaan', label: 'Perusahaan', slot: true, hideOnMobile: true },
  { key: 'deskripsi', label: 'Deskripsi', slot: true, hideOnMobile: true },
  { key: 'lokasi', label: 'Lokasi', slot: true, hideOnMobile: true },
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

const selected = ref<string[]>([])

const photoOpen = ref(false)
const photoUrls = ref<string[]>([])
function openPhoto(urls: string[]) {
  photoUrls.value = urls
  photoOpen.value = true
}

const suspendOpen = ref(false)
const suspendTargets = ref<string[]>([])
function openSuspend(ids: string[]) {
  if (ids.length === 0) return
  suspendTargets.value = ids
  suspendOpen.value = true
}

async function onSuspendConfirm(args: { reason: string; permanent: boolean; file: File | null }) {
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
    <PageHeader title="Iklan Pekerjaan" description="Moderasi iklan lowongan pekerjaan" />

    <ServerTable
      v-model:selected="selected"
      :table="table"
      :columns="columns"
      :filter-options="filterOptions"
      :sort-options="sortOptions"
      search-placeholder="Cari judul / kode / pembuat..."
      selectable
    >
      <template #actions>
        <ExportCsvButton :on-export="table.exportCsv" />
      </template>

      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminIklanPekerjaan).id) }}</span>
      </template>
      <template #cell-judul="{ row }">
        <span class="font-medium text-slate-800">{{ (row as AdminIklanPekerjaan).judul }}</span>
      </template>
      <template #cell-perusahaan="{ row }">
        {{ (row as AdminIklanPekerjaan).perusahaan }}
      </template>
      <template #cell-deskripsi="{ row }">
        {{ truncate((row as AdminIklanPekerjaan).deskripsi, 40) }}
      </template>
      <template #cell-lokasi="{ row }">
        {{ truncate((row as AdminIklanPekerjaan).lokasi, 30) }}
      </template>
      <template #cell-foto="{ row }">
        <button
          v-if="(row as AdminIklanPekerjaan).foto_urls.length"
          type="button"
          class="inline-flex items-center justify-center rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat foto"
          @click="openPhoto((row as AdminIklanPekerjaan).foto_urls)"
        >
          <BaseIcon name="photo" :size="18" />
        </button>
        <span v-else class="text-slate-300">-</span>
      </template>
      <template #cell-status="{ row }">
        <div class="flex items-center gap-2">
          <StatusBadge :status="(row as AdminIklanPekerjaan).moderation_status" />
          <BaseButton
            v-if="(row as AdminIklanPekerjaan).moderation_status !== 'suspended'"
            variant="danger"
            size="sm"
            @click="openSuspend([(row as AdminIklanPekerjaan).id])"
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
