<script setup lang="ts">
// Modal/dialog reusable berbasis Headless UI (aksesibel: focus-trap, ESC, ARIA).
// Slot: #title, default (body), #footer. v-model:open mengontrol visibilitas.
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import BaseIcon from './BaseIcon.vue'

withDefaults(defineProps<{ open: boolean; title?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }>(), {
  size: 'md',
})

const emit = defineEmits<{ 'update:open': [boolean] }>()

const SIZE: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <TransitionRoot :show="open" as="template">
    <Dialog class="relative z-50" @close="close">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-brand-900/50 backdrop-blur-sm" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          as="template"
          enter="duration-200 ease-out"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="duration-150 ease-in"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel
            :class="SIZE[size]"
            class="w-full max-h-[90vh] overflow-y-auto rounded-card bg-white shadow-xl"
          >
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <DialogTitle class="text-lg font-semibold text-brand-900">
                <slot name="title">{{ title }}</slot>
              </DialogTitle>
              <button
                type="button"
                class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup"
                @click="close"
              >
                <BaseIcon name="close" :size="20" />
              </button>
            </div>

            <div class="px-6 py-4">
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"
            >
              <slot name="footer" />
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
