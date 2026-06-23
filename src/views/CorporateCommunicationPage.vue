<script setup lang="ts">
// Halaman Corporate Communication (Task 13.1–13.5).
// - Tabel artikel (ID, Pembuat read-only, Kategori, Judul, Isi, Foto) + ikon Pena + Tong Sampah.
// - "Buat Artikel" → modal (Judul, Isi, Kategori=informasi, Foto) → POST (broadcast).
// - Ikon Pena → popup lihat/edit (timestamps & pembuat read-only) → PATCH (broadcast).
// - Ikon Tong Sampah → konfirmasi hapus → DELETE.
// - Search (judul) + sort kategori.
import { ref, reactive, computed } from 'vue'
import axios from 'axios'
import { useServerTable } from '@/composables/useServerTable'
import { articleApi } from '@/api/articleApi'
import type { AdminArticle } from '@/types/domain'
import type { TableColumn, SortOption } from '@/types/table'
import { formatDateTime, shortId, truncate } from '@/utils/format'
import { validateEvidenceFile } from '@/utils/upload'
import { normalizeError } from '@/api/errors'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import ServerTable from '@/components/ui/ServerTable.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ModalConfirm from '@/components/ui/ModalConfirm.vue'

const toast = useToast()

const table = useServerTable<AdminArticle>({
  endpoint: articleApi.listEndpoint,
  csvFilename: 'artikel.csv',
})

const columns: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'author_id', label: 'Pembuat', slot: true, hideOnMobile: true },
  { key: 'category', label: 'Kategori', slot: true, hideOnMobile: true },
  { key: 'title', label: 'Judul', slot: true },
  { key: 'body', label: 'Isi', slot: true, hideOnMobile: true },
  { key: 'photo', label: 'Foto', slot: true, align: 'center', hideOnMobile: true },
  { key: 'aksi', label: 'Aksi', slot: true, align: 'center' },
]

// Backend kategori saat ini hanya "informasi"; sort_dir mengurutkan kategori.
const sortOptions: SortOption[] = [
  { label: 'Kategori A→Z', sortBy: 'category', sortDir: 'asc' },
  { label: 'Kategori Z→A', sortBy: 'category', sortDir: 'desc' },
]

// ── Buat artikel ──
const createOpen = ref(false)
const creating = ref(false)
const createForm = reactive({ title: '', body: '', category: 'informasi' })
const createFile = ref<File | null>(null)
const createFileError = ref('')

function onCreateFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  createFileError.value = ''
  if (f) {
    const v = validateEvidenceFile(f)
    if (!v.ok) {
      createFileError.value = v.message
      createFile.value = null
      return
    }
  }
  createFile.value = f
}

function openCreate() {
  createForm.title = ''
  createForm.body = ''
  createForm.category = 'informasi'
  createFile.value = null
  createFileError.value = ''
  createOpen.value = true
}

async function submitCreate() {
  if (createForm.title.trim().length < 3) {
    toast.error('Judul minimal 3 karakter.')
    return
  }
  if (!createForm.body.trim()) {
    toast.error('Isi artikel wajib diisi.')
    return
  }
  creating.value = true
  try {
    // 1. buat artikel.
    const article = await articleApi.create({
      title: createForm.title.trim(),
      body: createForm.body.trim(),
      category: createForm.category,
    })
    // 2. bila ada foto, unggah lalu update artikel dengan object_key.
    if (createFile.value) {
      const perm = await articleApi.photoUpload(createFile.value)
      await uploadToPresigned(perm.presigned_url, createFile.value)
      await articleApi.update(article.id, {
        title: article.title,
        body: article.body,
        category: article.category,
        photo_object_key: perm.object_key,
      })
    }
    toast.success('Artikel diterbitkan & disiarkan ke pengguna.')
    createOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    creating.value = false
  }
}

// ── Edit artikel ──
const editOpen = ref(false)
const editing = ref(false)
const current = ref<AdminArticle | null>(null)
const editForm = reactive({ title: '', body: '', category: 'informasi' })

function openEdit(row: AdminArticle) {
  current.value = row
  editForm.title = row.title
  editForm.body = row.body
  editForm.category = row.category
  editOpen.value = true
}

async function submitEdit() {
  if (!current.value) return
  if (editForm.title.trim().length < 3) {
    toast.error('Judul minimal 3 karakter.')
    return
  }
  editing.value = true
  try {
    await articleApi.update(current.value.id, {
      title: editForm.title.trim(),
      body: editForm.body.trim(),
      category: editForm.category,
      photo_object_key: current.value.photo_object_key,
    })
    toast.success('Artikel diperbarui & notifikasi pembaruan dikirim.')
    editOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    editing.value = false
  }
}

// ── Hapus artikel ──
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteTarget = ref<AdminArticle | null>(null)
function openDelete(row: AdminArticle) {
  deleteTarget.value = row
  deleteOpen.value = true
}
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await articleApi.remove(deleteTarget.value.id)
    toast.success('Artikel dihapus.')
    deleteOpen.value = false
    await table.refresh()
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    deleting.value = false
  }
}

// Util PUT file ke presigned URL (key sudah didapat dari photoUpload).
async function uploadToPresigned(url: string, file: File): Promise<void> {
  await axios.put(url, file, { headers: { 'Content-Type': file.type } })
}

const createdInfo = computed(() => (current.value ? formatDateTime(current.value.created_at) : ''))
const updatedInfo = computed(() => (current.value ? formatDateTime(current.value.updated_at) : ''))

const deleteMessage = computed(() =>
  deleteTarget.value
    ? `Yakin menghapus artikel "${deleteTarget.value.title}"? Tindakan ini tidak dapat dibatalkan.`
    : '',
)
</script>

<template>
  <div>
    <PageHeader title="Corporate Communication" description="Kelola artikel & broadcast notifikasi">
      <template #actions>
        <BaseButton variant="primary" size="sm" @click="openCreate">
          <BaseIcon name="plus" :size="16" />
          Buat Artikel
        </BaseButton>
      </template>
    </PageHeader>

    <ServerTable
      :table="table"
      :columns="columns"
      :sort-options="sortOptions"
      search-placeholder="Cari judul..."
    >
      <template #cell-id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminArticle).id) }}</span>
      </template>
      <template #cell-author_id="{ row }">
        <span class="font-mono text-xs">{{ shortId((row as AdminArticle).author_id) }}</span>
      </template>
      <template #cell-category="{ row }">
        <span class="capitalize">{{ (row as AdminArticle).category }}</span>
      </template>
      <template #cell-title="{ row }">
        <span class="font-medium text-slate-800">{{ (row as AdminArticle).title }}</span>
      </template>
      <template #cell-body="{ row }">{{ truncate((row as AdminArticle).body, 50) }}</template>
      <template #cell-photo="{ row }">
        <BaseIcon
          v-if="(row as AdminArticle).photo_object_key"
          name="photo"
          :size="18"
          class="inline text-brand-700"
        />
        <span v-else class="text-slate-300">-</span>
      </template>
      <template #cell-aksi="{ row }">
        <div class="flex items-center justify-center gap-1">
          <button
            type="button"
            class="rounded-md p-1.5 text-brand-700 hover:bg-brand-50"
            aria-label="Edit artikel"
            @click="openEdit(row as AdminArticle)"
          >
            <BaseIcon name="pencil" :size="18" />
          </button>
          <button
            type="button"
            class="rounded-md p-1.5 text-danger-500 hover:bg-danger-50"
            aria-label="Hapus artikel"
            @click="openDelete(row as AdminArticle)"
          >
            <BaseIcon name="trash" :size="18" />
          </button>
        </div>
      </template>
    </ServerTable>

    <!-- Modal Buat Artikel -->
    <BaseModal v-model:open="createOpen" title="Buat Artikel" size="lg">
      <form class="space-y-3" @submit.prevent="submitCreate">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Judul</label>
          <input
            v-model="createForm.title"
            type="text"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Isi</label>
          <textarea
            v-model="createForm.body"
            rows="5"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
          <select
            v-model="createForm.category"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="informasi">Informasi</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">
            Foto (opsional, PDF/Gambar maks 5 MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
            @change="onCreateFile"
          />
          <p v-if="createFileError" class="mt-1 text-xs text-danger-500">{{ createFileError }}</p>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" :disabled="creating" @click="createOpen = false">
          Batalkan
        </BaseButton>
        <BaseButton variant="primary" :loading="creating" @click="submitCreate">Simpan</BaseButton>
      </template>
    </BaseModal>

    <!-- Modal Edit Artikel -->
    <BaseModal v-model:open="editOpen" title="Edit Artikel" size="lg">
      <div v-if="current" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <div>Pembuat: <span class="font-mono">{{ shortId(current.author_id) }}</span></div>
          <div>Dibuat: {{ createdInfo }}</div>
          <div>Diperbarui: {{ updatedInfo }}</div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Judul</label>
          <input
            v-model="editForm.title"
            type="text"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Isi</label>
          <textarea
            v-model="editForm.body"
            rows="5"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
          <select
            v-model="editForm.category"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="informasi">Informasi</option>
          </select>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="editing" @click="editOpen = false">Batalkan</BaseButton>
        <BaseButton variant="primary" :loading="editing" @click="submitEdit">Simpan</BaseButton>
      </template>
    </BaseModal>

    <!-- Konfirmasi Hapus -->
    <ModalConfirm
      v-model:open="deleteOpen"
      title="Hapus Artikel"
      :message="deleteMessage"
      confirm-label="Hapus"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
