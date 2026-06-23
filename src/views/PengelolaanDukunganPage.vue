<script setup lang="ts">
// Halaman Pengelolaan Dukungan (Task 12.1–12.3).
// - Tabel aduan + ikon Mata → detail (keterangan + Foto Bukti via evidence_read_url).
// - "Tindakan yang dilakukan" (action_note) WAJIB sebelum Tolak/Terima.
// - Tombol terkunci setelah aduan ditindaklanjuti (status terminal).
// - Search (ID Pengguna/ID Aduan) + sort status + Export CSV.
import { ref, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { reportApi } from '@/api/reportApi'
import type { AdminReport, AdminReportDetail } from '@/types/domain'
import type { TableColumn, FilterOption } from '@/types/table'
import { formatDateTime, shortId, truncate } from '@/utils/format'
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

const toast = useToast()

const table = useServerTable<AdminReport>({
  endpoint: reportApi.listEndpoint,
  exportEndpoint: reportApi.exportEndpoint,
  csvFilename: 'aduan.csv',
})

const columns: TableColumn[] = [
  { key: 'id', label: 'ID Pengaduan', slot: true },
  { key: 'created_at', label: 'Tanggal', slot: true, hideOnMobile: true },
  { key: 'reporter_id', label: 'ID Pelapor', slot: true, hideOnMobile: true },
  { key: 'target_id', label: 'ID Iklan', slot: true, hideOnMobile: true },
  { key: 'keterangan', label: 'Keterangan', slot: true, hideOnMobile: true },
  { key: 'status', label: 'Status', slot: true },
  { key: 'aksi', label: 'Aksi', slot: true, align: 'center' },
]

const filterOptions: FilterOption[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Ditinjau', value: 'in_review' },
  { label: 'Selesai', value: 'resolved' },
  { label: 'Ditolak', value: 'rejected' },
]

// ── Detail ──
const detailOpen = ref(false)
const current = ref<AdminReportDetail | null>(null)
const loadingDetail = ref(false)
const actionNote = ref('')
const noteError = ref('')
const photoOpen = ref(false)

async function openDetail(row: AdminReport) {
  detailOpen.value = true
  loadingDetail.value = true
  current.value = null
  actionNote.value = ''
  noteError.value = ''
  try {
    current.value = await reportApi.detail(row.id)
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    loadingDetail.value = false
  }
}

const isLocked = computed(
  () => current.value?.status === 'resolved' || current.value?.status === 'rejected',
)

const reviewing = ref(false)
async function review(approved: boolean) {
  if (!current.value) return
  // action_note WAJIB (spec: tolak/terima tanpa tindakan ditolak).
  if (!actionNote.value.trim()) {
    noteError.value = 'Tindakan yang dilakukan wajib diisi.'
    return
  }
  noteError.value = ''
  reviewing.value = true
  try {
    await reportApi.review(current.value.id, {
      approved,
      action_note: actionNote.value.trim(),
    })
    toast.success(approved ? 'Aduan diselesaikan.' : 'Aduan ditolak.')
    detailOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Pengelolaan Dukungan" description="Tindak lanjut aduan pengguna">
      <template #actions>
        <ExportCsvButton :on-export="table.exportCsv" />
      </template>
    </PageHeader>

    <ServerTable
      :table="table"
      :columns="columns"
      :filter-options="filterOptions"
      search-placeholder="Cari ID pengguna / ID aduan..."
    >
      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminReport).id) }}</span>
      </template>
      <template #cell-created_at="{ row }">
        {{ formatDateTime((row as AdminReport).created_at) }}
      </template>
      <template #cell-reporter_id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminReport).reporter_id) }}</span>
      </template>
      <template #cell-target_id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminReport).target_id) }}</span>
      </template>
      <template #cell-keterangan="{ row }">
        {{ truncate((row as AdminReport).keterangan, 40) }}
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="(row as AdminReport).status" />
      </template>
      <template #cell-aksi="{ row }">
        <button
          type="button"
          class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat detail"
          @click="openDetail(row as AdminReport)"
        >
          <BaseIcon name="eye" :size="18" />
        </button>
      </template>
    </ServerTable>

    <BaseModal v-model:open="detailOpen" title="Detail Aduan" size="lg">
      <div v-if="loadingDetail" class="py-8 text-center text-slate-400">Memuat...</div>
      <div v-else-if="current" class="space-y-3 text-sm">
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">ID Pelapor</dt>
            <dd class="font-mono text-xs">{{ current.reporter_id }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Target</dt>
            <dd>{{ current.target_type }} · <span class="font-mono text-xs">{{ shortId(current.target_id) }}</span></dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">Keterangan</dt>
            <dd>{{ current.keterangan }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="mb-1 text-slate-500">Foto Bukti</dt>
            <dd>
              <BaseButton
                v-if="current.evidence_read_url"
                variant="ghost"
                size="sm"
                @click="photoOpen = true"
              >
                <BaseIcon name="photo" :size="16" />
                Lihat Bukti
              </BaseButton>
              <span v-else class="text-xs text-slate-400">Tidak ada bukti.</span>
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">Status</dt>
            <dd><StatusBadge :status="current.status" /></dd>
          </div>
          <div v-if="current.action_note" class="sm:col-span-2">
            <dt class="text-slate-500">Tindakan Sebelumnya</dt>
            <dd>{{ current.action_note }}</dd>
          </div>
        </dl>

        <!-- Tindakan (wajib) -->
        <div v-if="!isLocked">
          <label class="mb-1 block font-medium text-slate-700">Tindakan yang Dilakukan</label>
          <textarea
            v-model="actionNote"
            rows="3"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
            placeholder="Jelaskan tindakan yang Anda lakukan terhadap aduan ini..."
          />
          <p v-if="noteError" class="mt-1 text-xs text-danger-500">{{ noteError }}</p>
        </div>
        <p v-else class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Aduan ini sudah ditindaklanjuti dan terkunci.
        </p>
      </div>

      <template #footer>
        <BaseButton
          variant="danger"
          :disabled="isLocked || loadingDetail"
          :loading="reviewing"
          @click="review(false)"
        >
          Tolak
        </BaseButton>
        <BaseButton
          variant="success"
          :disabled="isLocked || loadingDetail"
          :loading="reviewing"
          @click="review(true)"
        >
          Terima
        </BaseButton>
      </template>
    </BaseModal>

    <PopupFoto
      v-if="current?.evidence_read_url"
      v-model:open="photoOpen"
      :urls="[current.evidence_read_url]"
      title="Foto Bukti Aduan"
    />
  </div>
</template>
