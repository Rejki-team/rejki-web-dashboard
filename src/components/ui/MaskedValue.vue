<script setup lang="ts">
// Komponen masking + click-to-view data sensitif (Task 4.3, spec dashboard-patterns).
// Default tampil ter-mask. Klik → panggil `fetchReal()` (yang memicu audit di backend) →
// tampilkan nilai/URL asli. Saat ditutup → kembali ter-mask.
//
// Mode:
//  - 'text'  : tampilkan teks asli (mis. NIK penuh).
//  - 'image' : `fetchReal` mengembalikan URL gambar (presigned) → tampilkan thumbnail + popup.
import { ref } from 'vue'
import { normalizeError } from '@/api/errors'
import { useToast } from '@/composables/useToast'
import BaseIcon from './BaseIcon.vue'
import PopupFoto from './PopupFoto.vue'

const props = withDefaults(
  defineProps<{
    /** Nilai ter-mask yang ditampilkan default (mis. `xxx...8901`). */
    masked: string
    /** Callback mengambil nilai asli; pemanggilan mencatat audit di backend. */
    fetchReal: () => Promise<string>
    mode?: 'text' | 'image'
    /** Label untuk aksesibilitas/popup. */
    label?: string
  }>(),
  { mode: 'text', label: 'data sensitif' },
)

const toast = useToast()
const loading = ref(false)
const revealed = ref(false)
const realValue = ref<string | null>(null)
const photoOpen = ref(false)

async function reveal() {
  if (loading.value) return
  loading.value = true
  try {
    const value = await props.fetchReal()
    realValue.value = value
    revealed.value = true
    if (props.mode === 'image') photoOpen.value = true
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    loading.value = false
  }
}

function hide() {
  revealed.value = false
  realValue.value = null
  photoOpen.value = false
}
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <!-- Teks -->
    <template v-if="mode === 'text'">
      <span class="font-mono">{{ revealed && realValue ? realValue : masked }}</span>
      <button
        v-if="!revealed"
        type="button"
        class="text-brand-700 hover:text-brand-900 disabled:opacity-50"
        :disabled="loading"
        :aria-label="`Lihat ${label} asli`"
        @click="reveal"
      >
        <BaseIcon name="eye" :size="16" />
      </button>
      <button
        v-else
        type="button"
        class="text-slate-400 hover:text-slate-600"
        :aria-label="`Sembunyikan ${label}`"
        @click="hide"
      >
        <BaseIcon name="lock" :size="16" />
      </button>
    </template>

    <!-- Gambar -->
    <template v-else>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-50 disabled:opacity-50"
        :disabled="loading"
        @click="reveal"
      >
        <BaseIcon name="photo" :size="16" />
        {{ loading ? 'Memuat...' : `Lihat ${label}` }}
      </button>
      <PopupFoto
        v-if="realValue"
        :open="photoOpen"
        :urls="[realValue]"
        :title="label"
        @update:open="
          (v) => {
            photoOpen = v
            if (!v) hide()
          }
        "
      />
    </template>
  </span>
</template>
