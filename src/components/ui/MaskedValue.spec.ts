import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import MaskedValue from './MaskedValue.vue'

// Stub PopupFoto (membungkus Headless UI Dialog — bermasalah di jsdom).
const PopupFotoStub = defineComponent({
  props: { open: Boolean, urls: Array, title: String },
  emits: ['update:open'],
  template: '<div class="popup-stub" />',
})

describe('MaskedValue', () => {
  it('mode text: default ter-mask, klik memanggil fetchReal & menampilkan nilai asli', async () => {
    const fetchReal = vi.fn().mockResolvedValue('3275012345678901')
    const w = mount(MaskedValue, {
      props: { masked: 'xxx...8901', fetchReal, mode: 'text', label: 'NIK' },
    })
    expect(w.text()).toContain('xxx...8901')
    await w.find('button').trigger('click')
    await flushPromises()
    expect(fetchReal).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain('3275012345678901')
  })

  it('mode text: tombol sembunyikan mengembalikan ke ter-mask', async () => {
    const fetchReal = vi.fn().mockResolvedValue('NILAI')
    const w = mount(MaskedValue, {
      props: { masked: 'mask', fetchReal, mode: 'text' },
    })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('NILAI')
    // Klik tombol sembunyikan.
    await w.find('button').trigger('click')
    expect(w.text()).toContain('mask')
    expect(w.text()).not.toContain('NILAI')
  })

  it('mode image: klik memanggil fetchReal (audit) untuk dapat URL', async () => {
    const fetchReal = vi.fn().mockResolvedValue('https://s3/ktp.jpg')
    const w = mount(MaskedValue, {
      props: { masked: 'KTP', fetchReal, mode: 'image', label: 'Foto KTP' },
      global: { stubs: { PopupFoto: PopupFotoStub } },
    })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(fetchReal).toHaveBeenCalledTimes(1)
  })
})
