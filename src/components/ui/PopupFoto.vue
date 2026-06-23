<script setup lang="ts">
// Pop-up foto / lightbox (Task 4.4).
// Menampilkan satu/lebih foto dari URL (presigned). Mendukung navigasi bila >1 foto.
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps<{ open: boolean; urls: string[]; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const index = ref(0)

watch(
  () => props.open,
  (v) => {
    if (v) index.value = 0
  },
)

function prev() {
  index.value = (index.value - 1 + props.urls.length) % props.urls.length
}
function next() {
  index.value = (index.value + 1) % props.urls.length
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="title ?? 'Foto'"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="urls.length" class="space-y-3">
      <div class="flex items-center justify-center rounded-lg bg-slate-100 p-2">
        <img
          :src="urls[index]"
          :alt="`Foto ${index + 1}`"
          class="max-h-[60vh] w-auto rounded-md object-contain"
        />
      </div>
      <div v-if="urls.length > 1" class="flex items-center justify-between">
        <BaseButton variant="ghost" size="sm" @click="prev">
          <BaseIcon name="chevron-left" :size="16" />
          Sebelumnya
        </BaseButton>
        <span class="text-sm text-slate-500">{{ index + 1 }} / {{ urls.length }}</span>
        <BaseButton variant="ghost" size="sm" @click="next">
          Berikutnya
          <BaseIcon name="chevron-right" :size="16" />
        </BaseButton>
      </div>
    </div>
    <p v-else class="py-8 text-center text-sm text-slate-400">Tidak ada foto.</p>
  </BaseModal>
</template>
