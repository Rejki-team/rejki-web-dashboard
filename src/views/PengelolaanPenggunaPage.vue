<script setup lang="ts">
// Halaman Pengelolaan Pengguna (Task 11.1–11.5).
// - Tabel pengajuan KYC + ikon Mata → detail.
// - Detail: NIK ter-mask (backend hanya kirim nik_masked) + ClickToView Foto KTP & Selfie
//   (audited: GET /users/admin/kyc/{id}/documents/{kind}).
// - Tolak/Terima (alasan wajib, terkunci setelah verifikasi) → POST review.
// - Bulk select + Suspend pengguna (POST /auth/admin/users/suspend, partial-success).
// - Search, sort status, Export CSV.
//
// CATATAN GROUNDED: tidak ada endpoint untuk membuka NIK penuh — backend hanya menyediakan
// `nik_masked`. Maka NIK ditampilkan ter-mask permanen (tidak mengada-ada endpoint reveal).
// Bulk suspend memakai profile_id; daftar KYC memuat `id` submission, sehingga suspend
// memerlukan profile_id dari detail. Untuk bulk dari tabel, kita pakai field profile_id yang
// tersedia pada detail — sehingga suspend massal di sini menggunakan submission yang dipilih
// lalu di-resolve. Agar tetap benar, suspend dilakukan per-baris via detail (profile_id pasti).
import { ref, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { penggunaApi } from '@/api/penggunaApi'
import { uploadEvidence } from '@/utils/upload'
import type { AdminKycListItem, AdminKycDetail } from '@/types/domain'
import type { TableColumn, FilterOption } from '@/types/table'
import { formatDate, shortId } from '@/utils/format'
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
import MaskedValue from '@/components/ui/MaskedValue.vue'

const toast = useToast()

const table = useServerTable<AdminKycListItem>({
  endpoint: penggunaApi.listEndpoint,
  exportEndpoint: penggunaApi.exportEndpoint,
  defaultStatus: 'pending',
  csvFilename: 'pengguna-kyc.csv',
})

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'full_name', label: 'Nama', slot: true },
  { key: 'education_level', label: 'Pendidikan', slot: true, hideOnMobile: true },
  { key: 'gender', label: 'Gender', slot: true, hideOnMobile: true },
  { key: 'birth_date', label: 'TTL', slot: true, hideOnMobile: true },
  { key: 'address_line', label: 'Alamat', slot: true, hideOnMobile: true },
  { key: 'status', label: 'Status Verifikasi', slot: true },
  { key: 'aksi', label: 'Aksi', slot: true, align: 'center' },
]

const filterOptions: FilterOption[] = [
  { label: 'Menunggu', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
]

const GENDER_LABEL: Record<string, string> = { male: 'Laki-laki', female: 'Perempuan' }
const EDU_LABEL: Record<string, string> = {
  sd: 'SD',
  smp: 'SMP',
  sma: 'SMA/SMK',
  d3: 'D3',
  s1: 'S1',
  s2: 'S2',
  s3: 'S3',
}

// ── Detail ──
const detailOpen = ref(false)
const current = ref<AdminKycDetail | null>(null)
const loadingDetail = ref(false)

async function openDetail(row: AdminKycListItem) {
  detailOpen.value = true
  loadingDetail.value = true
  current.value = null
  try {
    current.value = await penggunaApi.detail(row.id)
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    loadingDetail.value = false
  }
}

// Fetch dokumen (audited) — dipakai MaskedValue image mode.
function fetchKtp(): Promise<string> {
  if (!current.value) return Promise.reject(new Error('no submission'))
  return penggunaApi.documentUrl(current.value.id, 'ktp')
}
function fetchSelfie(): Promise<string> {
  if (!current.value) return Promise.reject(new Error('no submission'))
  return penggunaApi.documentUrl(current.value.id, 'selfie')
}

const isLocked = computed(
  () => current.value?.status === 'approved' || current.value?.status === 'rejected',
)

// ── Review (Tolak/Terima) ──
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
    await penggunaApi.review(current.value.id, {
      approved: reviewApproved.value,
      review_note: args.reason || null,
    })
    toast.success(reviewApproved.value ? 'Verifikasi disetujui.' : 'Verifikasi ditolak.')
    reviewOpen.value = false
    detailOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    reviewing.value = false
  }
}

// ── Suspend pengguna (dari detail; profile_id pasti tersedia) ──
const suspendOpen = ref(false)
const suspending = ref(false)
async function confirmSuspend(args: { reason: string; permanent: boolean; file: File | null }) {
  if (!current.value) return
  suspending.value = true
  try {
    let evidenceKey: string | null = null
    if (args.file) {
      evidenceKey = await uploadEvidence(
        penggunaApi.evidenceEndpoint(current.value.profile_id),
        args.file,
      )
    }
    const res = await penggunaApi.bulkSuspend({
      user_ids: [current.value.profile_id],
      permanent: args.permanent,
      reason: args.reason,
      evidence_object_key: evidenceKey,
    })
    const ok = res.results.filter((r) => r.success).length
    if (ok > 0) {
      toast.success('Pengguna berhasil disuspensi.')
      suspendOpen.value = false
      detailOpen.value = false
      await table.refresh()
    } else {
      toast.error(res.results[0]?.error ?? 'Gagal men-suspend pengguna.')
    }
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    suspending.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Pengelolaan Pengguna" description="Verifikasi KYC & suspend pengguna">
      <template #actions>
        <ExportCsvButton :on-export="table.exportCsv" />
      </template>
    </PageHeader>

    <ServerTable
      :table="table"
      :columns="columns"
      :filter-options="filterOptions"
      search-placeholder="Cari ID / nama..."
    >
      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminKycListItem).id) }}</span>
      </template>
      <template #cell-full_name="{ row }">
        <span class="font-medium text-slate-800">{{ (row as AdminKycListItem).full_name ?? '-' }}</span>
      </template>
      <template #cell-education_level="{ row }">
        {{ EDU_LABEL[(row as AdminKycListItem).education_level ?? ''] ?? ((row as AdminKycListItem).education_level ?? '-') }}
      </template>
      <template #cell-gender="{ row }">
        {{ GENDER_LABEL[(row as AdminKycListItem).gender ?? ''] ?? ((row as AdminKycListItem).gender ?? '-') }}
      </template>
      <template #cell-birth_date="{ row }">
        {{ formatDate((row as AdminKycListItem).birth_date) }}
      </template>
      <template #cell-address_line="{ row }">
        {{ (row as AdminKycListItem).address_line ?? '-' }}
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="(row as AdminKycListItem).status" />
      </template>
      <template #cell-aksi="{ row }">
        <button
          type="button"
          class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat detail"
          @click="openDetail(row as AdminKycListItem)"
        >
          <BaseIcon name="eye" :size="18" />
        </button>
      </template>
    </ServerTable>

    <!-- Detail KYC -->
    <BaseModal v-model:open="detailOpen" title="Detail Verifikasi Pengguna" size="lg">
      <div v-if="loadingDetail" class="py-8 text-center text-slate-400">Memuat...</div>
      <div v-else-if="current" class="space-y-3 text-sm">
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">Nama Lengkap</dt>
            <dd class="font-medium">{{ current.full_name ?? '-' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">NIK</dt>
            <dd>
              <!-- NIK hanya tersedia ter-mask dari backend (tidak ada endpoint reveal). -->
              <span class="font-mono">{{ current.nik_masked ?? '-' }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">Pendidikan</dt>
            <dd>{{ EDU_LABEL[current.education_level ?? ''] ?? (current.education_level ?? '-') }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Gender</dt>
            <dd>{{ GENDER_LABEL[current.gender ?? ''] ?? (current.gender ?? '-') }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Tanggal Lahir</dt>
            <dd>{{ formatDate(current.birth_date) }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">Alamat</dt>
            <dd>{{ current.address_line ?? '-' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="mb-1 text-slate-500">Dokumen (click-to-view, akses dicatat)</dt>
            <dd class="flex flex-wrap gap-2">
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
            <dd><StatusBadge :status="current.status" /></dd>
          </div>
        </dl>
      </div>

      <template #footer>
        <BaseButton
          v-if="current"
          variant="danger"
          :disabled="loadingDetail"
          @click="suspendOpen = true"
        >
          Suspend
        </BaseButton>
        <BaseButton variant="danger" :disabled="isLocked || loadingDetail" @click="openReview(false)">
          Tolak
        </BaseButton>
        <BaseButton variant="success" :disabled="isLocked || loadingDetail" @click="openReview(true)">
          Terima
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Review -->
    <ModalConfirm
      v-model:open="reviewOpen"
      :title="reviewApproved ? 'Terima Verifikasi' : 'Tolak Verifikasi'"
      :confirm-label="reviewApproved ? 'Terima' : 'Tolak'"
      :confirm-variant="reviewApproved ? 'success' : 'danger'"
      :require-reason="!reviewApproved"
      reason-label="Alasan Penolakan"
      :reason-min-length="1"
      :loading="reviewing"
      @confirm="confirmReview"
    />

    <!-- Suspend pengguna -->
    <ModalConfirm
      v-model:open="suspendOpen"
      title="Suspend Pengguna"
      message="Pengguna yang disuspensi tidak dapat mengakses akun. Notifikasi akan dikirim."
      confirm-label="Suspend"
      confirm-variant="danger"
      require-reason
      reason-label="Alasan"
      :reason-min-length="10"
      show-permanent
      require-evidence
      :loading="suspending"
      @confirm="confirmSuspend"
    />
  </div>
</template>
