<script setup lang="ts">
// Halaman Badge Pelatihan (Task 9.1–9.3).
// Tabel badge + ikon Mata → detail + tampilkan Sertifikat + Tolak/Terima (alasan wajib, terkunci).
//
// CATATAN GROUNDED: backend admin_badge_detail mengembalikan BadgeResponse yang hanya memuat
// `sertifikat_object_key` (BUKAN presigned read URL). Maka sertifikat ditampilkan sebagai
// referensi object key — tidak ada URL gambar yang dapat dirender langsung (tidak mengada-ada).
import { ref, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { pelatihanApi } from '@/api/pelatihanApi'
import type { AdminBadge } from '@/types/domain'
import type { TableColumn, FilterOption } from '@/types/table'
import { formatDateTime, shortId } from '@/utils/format'
import { normalizeError } from '@/api/errors'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServerTable from '@/components/ui/ServerTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ExportCsvButton from '@/components/ui/ExportCsvButton.vue'
import ModalConfirm from '@/components/ui/ModalConfirm.vue'

const toast = useToast()

const table = useServerTable<AdminBadge>({
  endpoint: pelatihanApi.badgeListEndpoint,
  exportEndpoint: pelatihanApi.badgeExportEndpoint,
  csvFilename: 'badge-pelatihan.csv',
})

const columns: TableColumn[] = [
  { key: 'id', label: 'ID Pelatihan', slot: true },
  { key: 'user_id', label: 'ID Pengguna', slot: true, hideOnMobile: true },
  { key: 'sertifikat', label: 'Sertifikat', slot: true, align: 'center', hideOnMobile: true },
  { key: 'approved_at', label: 'Tanggal Badge', slot: true, hideOnMobile: true },
  { key: 'status', label: 'Status', slot: true },
  { key: 'aksi', label: 'Aksi', slot: true, align: 'center' },
]

const filterOptions: FilterOption[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
]

const detailOpen = ref(false)
const current = ref<AdminBadge | null>(null)
const loadingDetail = ref(false)

async function openDetail(row: AdminBadge) {
  detailOpen.value = true
  loadingDetail.value = true
  current.value = row
  try {
    current.value = await pelatihanApi.badgeDetail(row.id)
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    loadingDetail.value = false
  }
}

const reviewOpen = ref(false)
const reviewApproved = ref(true)
const reviewing = ref(false)
function openReview(approved: boolean) {
  reviewApproved.value = approved
  reviewOpen.value = true
}
async function confirmReview(args: { reason: string }) {
  if (!current.value) return
  reviewing.value = true
  try {
    await pelatihanApi.badgeReview(current.value.id, {
      approved: reviewApproved.value,
      review_note: args.reason || null,
    })
    toast.success(reviewApproved.value ? 'Badge disetujui.' : 'Badge ditolak.')
    reviewOpen.value = false
    detailOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    reviewing.value = false
  }
}

const isLocked = computed(
  () => current.value?.status === 'approved' || current.value?.status === 'rejected',
)
</script>

<template>
  <div>
    <PageHeader title="Badge Pelatihan" description="Verifikasi sertifikat & penerbitan badge">
      <template #actions>
        <ExportCsvButton :on-export="table.exportCsv" />
      </template>
    </PageHeader>

    <ServerTable
      :table="table"
      :columns="columns"
      :filter-options="filterOptions"
      search-placeholder="Cari ID pelatihan / pengguna..."
    >
      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminBadge).pelatihan_id) }}</span>
      </template>
      <template #cell-user_id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminBadge).user_id) }}</span>
      </template>
      <template #cell-sertifikat="{ row }">
        <span v-if="(row as AdminBadge).sertifikat_object_key" class="text-success-500">
          <BaseIcon name="check" :size="18" class="inline" />
        </span>
        <span v-else class="text-slate-300">-</span>
      </template>
      <template #cell-approved_at="{ row }">
        {{ formatDateTime((row as AdminBadge).approved_at) }}
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="(row as AdminBadge).status" />
      </template>
      <template #cell-aksi="{ row }">
        <button
          type="button"
          class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat detail"
          @click="openDetail(row as AdminBadge)"
        >
          <BaseIcon name="eye" :size="18" />
        </button>
      </template>
    </ServerTable>

    <BaseModal v-model:open="detailOpen" title="Detail Badge" size="md">
      <div v-if="current" class="space-y-3 text-sm">
        <dl class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">ID Pelatihan</dt>
            <dd class="font-mono text-xs">{{ current.pelatihan_id }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">ID Pengguna</dt>
            <dd class="font-mono text-xs">{{ current.user_id }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Tanggal Badge</dt>
            <dd>{{ formatDateTime(current.approved_at) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Status</dt>
            <dd><StatusBadge :status="current.status" /></dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">Sertifikat (object key)</dt>
            <dd class="break-all font-mono text-xs">
              {{ current.sertifikat_object_key ?? 'Tidak ada' }}
            </dd>
          </div>
          <div v-if="current.review_note" class="sm:col-span-2">
            <dt class="text-slate-500">Catatan Review</dt>
            <dd>{{ current.review_note }}</dd>
          </div>
        </dl>
      </div>
      <template #footer>
        <BaseButton variant="danger" :disabled="isLocked || loadingDetail" @click="openReview(false)">
          Tolak
        </BaseButton>
        <BaseButton variant="success" :disabled="isLocked || loadingDetail" @click="openReview(true)">
          Terima
        </BaseButton>
      </template>
    </BaseModal>

    <ModalConfirm
      v-model:open="reviewOpen"
      :title="reviewApproved ? 'Terima Badge' : 'Tolak Badge'"
      :confirm-label="reviewApproved ? 'Terima' : 'Tolak'"
      :confirm-variant="reviewApproved ? 'success' : 'danger'"
      :require-reason="!reviewApproved"
      reason-label="Alasan Penolakan"
      :reason-min-length="1"
      :loading="reviewing"
      @confirm="confirmReview"
    />
  </div>
</template>
