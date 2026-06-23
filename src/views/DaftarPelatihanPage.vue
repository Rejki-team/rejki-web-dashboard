<script setup lang="ts">
// Halaman Daftar Pelatihan (Task 7.1–7.5).
// - Tabel pelatihan + ikon Mata (detail) + tombol "Tambah Pelatihan".
// - Tambah → modal form → POST admin create (auto-approve).
// - Detail popup: tombol kontekstual berdasarkan created_by_role:
//     admin → Batalkan / Edit / Simpan ; user → Tolak (wajib alasan) / Terima (terkunci).
// - Search, sort status, Export CSV.
import { ref, reactive, computed } from 'vue'
import { useServerTable } from '@/composables/useServerTable'
import { pelatihanApi, type CreatePelatihanPayload } from '@/api/pelatihanApi'
import type { AdminPelatihan } from '@/types/domain'
import type { TableColumn, FilterOption, SortOption } from '@/types/table'
import { formatDate, shortId, truncate } from '@/utils/format'
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

const table = useServerTable<AdminPelatihan>({
  endpoint: pelatihanApi.listEndpoint,
  exportEndpoint: pelatihanApi.exportEndpoint,
  csvFilename: 'pelatihan.csv',
})

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'judul', label: 'Judul', slot: true },
  { key: 'deskripsi', label: 'Deskripsi', slot: true, hideOnMobile: true },
  { key: 'penyelenggara', label: 'Penyelenggara', slot: true, hideOnMobile: true },
  { key: 'lokasi', label: 'Lokasi', slot: true, hideOnMobile: true },
  { key: 'tanggal_mulai', label: 'Tanggal', slot: true, hideOnMobile: true },
  { key: 'jumlah_peserta', label: 'Peserta', slot: true, align: 'center', hideOnMobile: true },
  { key: 'status', label: 'Status', slot: true },
  { key: 'aksi', label: 'Aksi', slot: true, align: 'center' },
]

const filterOptions: FilterOption[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

const sortOptions: SortOption[] = [
  { label: 'Terbaru', sortBy: 'created_at', sortDir: 'desc' },
  { label: 'Terlama', sortBy: 'created_at', sortDir: 'asc' },
]

// ── Tambah pelatihan ──
const addOpen = ref(false)
const adding = ref(false)
const form = reactive<CreatePelatihanPayload>({
  judul: '',
  penyelenggara: '',
  deskripsi: '',
  lokasi: '',
  tanggal_mulai: '',
  jumlah_peserta: null,
})

function resetForm() {
  form.judul = ''
  form.penyelenggara = ''
  form.deskripsi = ''
  form.lokasi = ''
  form.tanggal_mulai = ''
  form.jumlah_peserta = null
}

function openAdd() {
  resetForm()
  addOpen.value = true
}

async function submitAdd() {
  if (!form.judul.trim() || !form.penyelenggara.trim() || !form.deskripsi.trim()) {
    toast.error('Judul, penyelenggara, dan deskripsi wajib diisi.')
    return
  }
  adding.value = true
  try {
    await pelatihanApi.create({
      ...form,
      tanggal_mulai: form.tanggal_mulai || null,
    })
    toast.success('Pelatihan berhasil dibuat (otomatis disetujui).')
    addOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    adding.value = false
  }
}

// ── Detail / Edit ──
const detailOpen = ref(false)
const editMode = ref(false)
const current = ref<AdminPelatihan | null>(null)
const saving = ref(false)
const editForm = reactive({
  judul: '',
  penyelenggara: '',
  deskripsi: '',
  lokasi: '',
  tanggal_mulai: '',
  jumlah_peserta: null as number | null,
})

function openDetail(row: AdminPelatihan) {
  current.value = row
  editMode.value = false
  detailOpen.value = true
}

function enterEdit() {
  if (!current.value) return
  editForm.judul = current.value.judul
  editForm.penyelenggara = current.value.penyelenggara
  editForm.deskripsi = current.value.deskripsi
  editForm.lokasi = current.value.lokasi ?? ''
  editForm.tanggal_mulai = current.value.tanggal_mulai?.slice(0, 10) ?? ''
  editForm.jumlah_peserta = current.value.jumlah_peserta
  editMode.value = true
}

async function saveEdit() {
  if (!current.value) return
  saving.value = true
  try {
    const updated = await pelatihanApi.update(current.value.id, {
      judul: editForm.judul,
      penyelenggara: editForm.penyelenggara,
      deskripsi: editForm.deskripsi,
      lokasi: editForm.lokasi || null,
      tanggal_mulai: editForm.tanggal_mulai || null,
      jumlah_peserta: editForm.jumlah_peserta,
    })
    current.value = updated
    editMode.value = false
    toast.success('Pelatihan diperbarui.')
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    saving.value = false
  }
}

// Batalkan pelatihan (admin, DELETE).
const cancelOpen = ref(false)
const cancelling = ref(false)
async function confirmCancel() {
  if (!current.value) return
  cancelling.value = true
  try {
    await pelatihanApi.cancel(current.value.id)
    toast.success('Pelatihan dibatalkan.')
    cancelOpen.value = false
    detailOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    cancelling.value = false
  }
}

// Review pelatihan milik user (Tolak/Terima).
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
    await pelatihanApi.review(current.value.id, {
      approved: reviewApproved.value,
      review_note: args.reason || null,
    })
    toast.success(reviewApproved.value ? 'Pelatihan disetujui.' : 'Pelatihan ditolak.')
    reviewOpen.value = false
    detailOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    reviewing.value = false
  }
}

const isAdminCreated = computed(() => current.value?.created_by_role === 'admin')
const isLocked = computed(
  () => current.value?.status === 'approved' || current.value?.status === 'rejected',
)
</script>

<template>
  <div>
    <PageHeader title="Daftar Pelatihan" description="Kelola & moderasi pelatihan">
      <template #actions>
        <ExportCsvButton :on-export="table.exportCsv" />
        <BaseButton variant="primary" size="sm" @click="openAdd">
          <BaseIcon name="plus" :size="16" />
          Tambah Pelatihan
        </BaseButton>
      </template>
    </PageHeader>

    <ServerTable
      :table="table"
      :columns="columns"
      :filter-options="filterOptions"
      :sort-options="sortOptions"
      search-placeholder="Cari judul / kode / penyelenggara..."
    >
      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminPelatihan).id) }}</span>
      </template>
      <template #cell-judul="{ row }">
        <span class="font-medium text-slate-800">{{ (row as AdminPelatihan).judul }}</span>
      </template>
      <template #cell-deskripsi="{ row }">
        {{ truncate((row as AdminPelatihan).deskripsi, 40) }}
      </template>
      <template #cell-penyelenggara="{ row }">{{ (row as AdminPelatihan).penyelenggara }}</template>
      <template #cell-lokasi="{ row }">{{ truncate((row as AdminPelatihan).lokasi, 24) }}</template>
      <template #cell-tanggal_mulai="{ row }">
        {{ formatDate((row as AdminPelatihan).tanggal_mulai) }}
      </template>
      <template #cell-jumlah_peserta="{ row }">
        {{ (row as AdminPelatihan).jumlah_peserta ?? '-' }}
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="(row as AdminPelatihan).status" />
      </template>
      <template #cell-aksi="{ row }">
        <button
          type="button"
          class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
          aria-label="Lihat detail"
          @click="openDetail(row as AdminPelatihan)"
        >
          <BaseIcon name="eye" :size="18" />
        </button>
      </template>
    </ServerTable>

    <!-- Modal Tambah Pelatihan -->
    <BaseModal v-model:open="addOpen" title="Tambah Pelatihan" size="lg">
      <form class="space-y-3" @submit.prevent="submitAdd">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Judul</label>
          <input
            v-model="form.judul"
            type="text"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            rows="3"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Penyelenggara</label>
            <input
              v-model="form.penyelenggara"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Lokasi</label>
            <input
              v-model="form.lokasi"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Tanggal Mulai</label>
            <input
              v-model="form.tanggal_mulai"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Jumlah Peserta</label>
            <input
              v-model.number="form.jumlah_peserta"
              type="number"
              min="0"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" :disabled="adding" @click="addOpen = false">Batalkan</BaseButton>
        <BaseButton variant="primary" :loading="adding" @click="submitAdd">Simpan</BaseButton>
      </template>
    </BaseModal>

    <!-- Modal Detail / Edit -->
    <BaseModal v-model:open="detailOpen" title="Detail Pelatihan" size="lg">
      <div v-if="current" class="space-y-3 text-sm">
        <template v-if="!editMode">
          <dl class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div><dt class="text-slate-500">Judul</dt><dd class="font-medium">{{ current.judul }}</dd></div>
            <div><dt class="text-slate-500">Penyelenggara</dt><dd>{{ current.penyelenggara }}</dd></div>
            <div class="sm:col-span-2">
              <dt class="text-slate-500">Deskripsi</dt><dd>{{ current.deskripsi }}</dd>
            </div>
            <div><dt class="text-slate-500">Lokasi</dt><dd>{{ current.lokasi ?? '-' }}</dd></div>
            <div><dt class="text-slate-500">Tanggal</dt><dd>{{ formatDate(current.tanggal_mulai) }}</dd></div>
            <div><dt class="text-slate-500">Jumlah Peserta</dt><dd>{{ current.jumlah_peserta ?? '-' }}</dd></div>
            <div>
              <dt class="text-slate-500">Pembuat</dt>
              <dd>{{ current.created_by_role === 'admin' ? 'Admin' : 'Pengguna' }}</dd>
            </div>
            <div><dt class="text-slate-500">Status</dt><dd><StatusBadge :status="current.status" /></dd></div>
          </dl>
        </template>

        <!-- Edit mode (admin) -->
        <template v-else>
          <div>
            <label class="mb-1 block font-medium text-slate-700">Judul</label>
            <input v-model="editForm.judul" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label class="mb-1 block font-medium text-slate-700">Deskripsi</label>
            <textarea v-model="editForm.deskripsi" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-medium text-slate-700">Penyelenggara</label>
              <input v-model="editForm.penyelenggara" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label class="mb-1 block font-medium text-slate-700">Lokasi</label>
              <input v-model="editForm.lokasi" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label class="mb-1 block font-medium text-slate-700">Tanggal Mulai</label>
              <input v-model="editForm.tanggal_mulai" type="date" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label class="mb-1 block font-medium text-slate-700">Jumlah Peserta</label>
              <input v-model.number="editForm.jumlah_peserta" type="number" min="0" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <!-- Pembuat admin: Batalkan / Edit / Simpan -->
        <template v-if="isAdminCreated">
          <template v-if="!editMode">
            <BaseButton variant="danger" @click="cancelOpen = true">Batalkan Pelatihan</BaseButton>
            <BaseButton variant="primary" @click="enterEdit">Edit</BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="ghost" :disabled="saving" @click="editMode = false">Batalkan</BaseButton>
            <BaseButton variant="primary" :loading="saving" @click="saveEdit">Simpan</BaseButton>
          </template>
        </template>
        <!-- Pembuat user: Tolak / Terima (terkunci setelah verifikasi) -->
        <template v-else>
          <BaseButton variant="danger" :disabled="isLocked" @click="openReview(false)">Tolak</BaseButton>
          <BaseButton variant="success" :disabled="isLocked" @click="openReview(true)">Terima</BaseButton>
        </template>
      </template>
    </BaseModal>

    <!-- Konfirmasi cancel -->
    <ModalConfirm
      v-model:open="cancelOpen"
      title="Batalkan Pelatihan"
      message="Pelatihan akan dibatalkan. Lanjutkan?"
      confirm-label="Ya, Batalkan"
      confirm-variant="danger"
      :loading="cancelling"
      @confirm="confirmCancel"
    />

    <!-- Review user pelatihan -->
    <ModalConfirm
      v-model:open="reviewOpen"
      :title="reviewApproved ? 'Terima Pelatihan' : 'Tolak Pelatihan'"
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
