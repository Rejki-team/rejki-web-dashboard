<script setup lang="ts">
// Action bar bulk-select (Task 4.7). Muncul saat ada item terpilih.
// Menampilkan jumlah terpilih + tombol aksi (mis. Suspend (N)) + batal pilih.
import BaseButton from './BaseButton.vue'
import BaseIcon from './BaseIcon.vue'

defineProps<{ count: number; actionLabel?: string }>()
const emit = defineEmits<{ action: []; clear: [] }>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200"
    enter-from-class="opacity-0 translate-y-2"
    leave-active-class="transition duration-150"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="count > 0"
      class="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-card bg-brand-900 px-5 py-3 text-white shadow-xl"
    >
      <span class="text-sm font-medium">{{ count }} item dipilih</span>
      <div class="flex items-center gap-2">
        <BaseButton variant="danger" size="sm" @click="emit('action')">
          {{ actionLabel ?? 'Suspend' }} ({{ count }})
        </BaseButton>
        <button
          type="button"
          class="rounded-md p-2 text-slate-300 hover:bg-white/10"
          aria-label="Batal pilih"
          @click="emit('clear')"
        >
          <BaseIcon name="close" :size="18" />
        </button>
      </div>
    </div>
  </Transition>
</template>
