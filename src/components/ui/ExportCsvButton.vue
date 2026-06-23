<script setup lang="ts">
// Tombol Export CSV (Task 4.8). Memanggil callback exportCsv (dari useServerTable),
// menampilkan loading & toast hasil.
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { normalizeError } from '@/api/errors'
import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps<{ onExport: () => Promise<void> }>()
const toast = useToast()
const loading = ref(false)

async function run() {
  loading.value = true
  try {
    await props.onExport()
    toast.success('Berkas CSV berhasil diunduh.')
  } catch (err) {
    toast.error(normalizeError(err).userMessage)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseButton variant="ghost" size="sm" :loading="loading" @click="run">
    <BaseIcon name="download" :size="16" />
    Export CSV
  </BaseButton>
</template>
