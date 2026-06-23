<script setup lang="ts">
// Container toast global (Task 4.5) — render daftar toast dari useToast().
// Diletakkan sekali di App.vue. Posisi top-right, auto-dismiss diatur composable.
import { useToast, type ToastKind } from '@/composables/useToast'
import BaseIcon from './BaseIcon.vue'

const { toasts, dismiss } = useToast()

const STYLE: Record<ToastKind, string> = {
  success: 'border-success-500 bg-success-50 text-success-500',
  error: 'border-danger-500 bg-danger-50 text-danger-500',
  warning: 'border-warning-500 bg-warning-50 text-warning-500',
  info: 'border-info-500 bg-info-50 text-info-500',
}
</script>

<template>
  <div class="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2" aria-live="polite">
    <TransitionGroup
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-x-4"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0 translate-x-4"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="STYLE[t.kind]"
        class="flex items-start gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-md"
        role="alert"
      >
        <span class="flex-1 text-sm text-slate-700">{{ t.message }}</span>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600"
          aria-label="Tutup notifikasi"
          @click="dismiss(t.id)"
        >
          <BaseIcon name="close" :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
