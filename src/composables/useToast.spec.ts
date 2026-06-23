import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from './useToast'

describe('composables/useToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    // Bersihkan toast tersisa antar test.
    const { toasts, dismiss } = useToast()
    ;[...toasts.value].forEach((t) => dismiss(t.id))
  })

  it('menambah toast success & auto-dismiss setelah durasi', () => {
    const { toasts, success } = useToast()
    success('berhasil', 1000)
    expect(toasts.value.at(-1)?.message).toBe('berhasil')
    expect(toasts.value.at(-1)?.kind).toBe('success')
    vi.advanceTimersByTime(1000)
    expect(toasts.value.find((t) => t.message === 'berhasil')).toBeUndefined()
  })

  it('mendukung error/info/warning', () => {
    const { toasts, error, info, warning } = useToast()
    error('e', 0)
    info('i', 0)
    warning('w', 0)
    const kinds = toasts.value.map((t) => t.kind)
    expect(kinds).toContain('error')
    expect(kinds).toContain('info')
    expect(kinds).toContain('warning')
  })

  it('durasi 0 tidak auto-dismiss', () => {
    const { toasts, info } = useToast()
    info('tetap', 0)
    vi.advanceTimersByTime(10_000)
    expect(toasts.value.some((t) => t.message === 'tetap')).toBe(true)
  })

  it('dismiss menghapus toast manual', () => {
    const { toasts, error, dismiss } = useToast()
    const id = error('hapus', 0)
    dismiss(id)
    expect(toasts.value.some((t) => t.id === id)).toBe(false)
  })
})
