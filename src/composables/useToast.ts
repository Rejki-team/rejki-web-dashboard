// Composable toast global (Task 4.5).
// State modul-level (singleton) sehingga semua komponen berbagi antrean toast yang sama,
// dan ToastContainer me-render-nya. Auto-dismiss dengan timer yang dibersihkan saat unmount.

import { ref, readonly } from 'vue'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
  /** Durasi tampil (ms); 0 = manual dismiss. */
  duration: number
}

const toasts = ref<Toast[]>([])
let seq = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function remove(id: number): void {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
  toasts.value = toasts.value.filter((x) => x.id !== id)
}

function push(kind: ToastKind, message: string, duration = 4000): number {
  const id = ++seq
  toasts.value = [...toasts.value, { id, kind, message, duration }]
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => remove(id), duration),
    )
  }
  return id
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (m: string, d?: number) => push('success', m, d),
    error: (m: string, d?: number) => push('error', m, d),
    info: (m: string, d?: number) => push('info', m, d),
    warning: (m: string, d?: number) => push('warning', m, d),
    dismiss: remove,
  }
}
