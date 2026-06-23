// Debounce sederhana dengan dukungan cancel (untuk membatalkan timer saat unmount).
export interface Debounced<A extends unknown[]> {
  (...args: A): void
  cancel(): void
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, delay = 350): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return wrapped
}
