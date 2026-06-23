import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, readonly } from 'vue'
import ToastContainer from './ToastContainer.vue'

const toastsList = ref([
  { id: 1, kind: 'success' as const, message: 'Berhasil', duration: 0 },
  { id: 2, kind: 'error' as const, message: 'Gagal', duration: 0 },
])
const dismissFn = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toasts: readonly(toastsList),
    dismiss: dismissFn,
    success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(),
  }),
}))

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    toastsList.value = [
      { id: 1, kind: 'success', message: 'Berhasil', duration: 0 },
      { id: 2, kind: 'error', message: 'Gagal', duration: 0 },
    ]
  })

  it('merender semua toast dari useToast', () => {
    const w = mount(ToastContainer, {
      global: { stubs: { BaseIcon: { template: '<svg />' }, TransitionGroup: { template: '<div><slot /></div>' } } },
    })
    expect(w.text()).toContain('Berhasil')
    expect(w.text()).toContain('Gagal')
  })

  it('tombol dismiss menghapus toast', async () => {
    const w = mount(ToastContainer, {
      global: { stubs: { BaseIcon: { template: '<svg />' }, TransitionGroup: { template: '<div><slot /></div>' } } },
    })
    const buttons = w.findAll('button[aria-label="Tutup notifikasi"]')
    expect(buttons.length).toBe(2)
    await buttons[0].trigger('click')
    expect(dismissFn).toHaveBeenCalledWith(1)
  })
})
