<script setup lang="ts">
// Modal konfirmasi aksi reusable (Task 4.6).
// Mode dapat dikonfigurasi:
//  - requireReason : tampilkan textarea alasan (wajib bila true).
//  - showPermanent : tampilkan pilihan sementara/permanen (untuk suspend).
//  - requireEvidence: tampilkan input unggah bukti (file).
//  - reasonMinLength: validasi panjang alasan (mis. suspend reason min 10).
//
// Emit `confirm` dengan payload { reason, permanent, file } setelah validasi lolos.
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { validateEvidenceFile } from '@/utils/upload'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    confirmVariant?: 'primary' | 'danger' | 'success'
    requireReason?: boolean
    reasonLabel?: string
    reasonMinLength?: number
    showPermanent?: boolean
    requireEvidence?: boolean
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Konfirmasi',
    confirmVariant: 'primary',
    requireReason: false,
    reasonLabel: 'Alasan',
    reasonMinLength: 0,
    showPermanent: false,
    requireEvidence: false,
    loading: false,
  },
)

const emit = defineEmits<{
  'update:open': [boolean]
  confirm: [{ reason: string; permanent: boolean; file: File | null }]
}>()

const reason = ref('')
const permanent = ref(false)
const file = ref<File | null>(null)
const fileError = ref('')
const submitted = ref(false)

watch(
  () => props.open,
  (v) => {
    if (v) {
      reason.value = ''
      permanent.value = false
      file.value = null
      fileError.value = ''
      submitted.value = false
    }
  },
)

const reasonError = computed(() => {
  if (!props.requireReason) return ''
  if (!reason.value.trim()) return `${props.reasonLabel} wajib diisi.`
  if (reason.value.trim().length < props.reasonMinLength)
    return `${props.reasonLabel} minimal ${props.reasonMinLength} karakter.`
  return ''
})

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  fileError.value = ''
  if (f) {
    const v = validateEvidenceFile(f)
    if (!v.ok) {
      fileError.value = v.message
      file.value = null
      return
    }
  }
  file.value = f
}

const canConfirm = computed(() => {
  if (reasonError.value) return false
  if (props.requireEvidence && !file.value) return false
  if (fileError.value) return false
  return true
})

function onConfirm() {
  submitted.value = true
  if (!canConfirm.value) return
  emit('confirm', { reason: reason.value.trim(), permanent: permanent.value, file: file.value })
}
</script>

<template>
  <BaseModal :open="open" :title="title" size="md" @update:open="emit('update:open', $event)">
    <div class="space-y-4">
      <p v-if="message" class="text-sm text-slate-600">{{ message }}</p>

      <!-- Pilihan sementara / permanen -->
      <fieldset v-if="showPermanent" class="space-y-2">
        <legend class="text-sm font-medium text-slate-700">Jenis suspensi</legend>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="permanent" type="radio" :value="false" name="permanent" />
          Sementara
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="permanent" type="radio" :value="true" name="permanent" />
          Permanen
        </label>
      </fieldset>

      <!-- Alasan -->
      <div v-if="requireReason">
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ reasonLabel }}</label>
        <textarea
          v-model="reason"
          rows="3"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
          :placeholder="`Tuliskan ${reasonLabel.toLowerCase()}...`"
        />
        <p v-if="submitted && reasonError" class="mt-1 text-xs text-danger-500">
          {{ reasonError }}
        </p>
      </div>

      <!-- Unggah bukti -->
      <div v-if="requireEvidence">
        <label class="mb-1 block text-sm font-medium text-slate-700">
          Unggah Bukti (PDF/Gambar, maks 5 MB)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700"
          @change="onFileChange"
        />
        <p v-if="fileError" class="mt-1 text-xs text-danger-500">{{ fileError }}</p>
        <p v-else-if="submitted && requireEvidence && !file" class="mt-1 text-xs text-danger-500">
          Bukti wajib diunggah.
        </p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" :disabled="loading" @click="emit('update:open', false)">
        Batalkan
      </BaseButton>
      <BaseButton :variant="confirmVariant" :loading="loading" @click="onConfirm">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
