import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PopupFoto from './PopupFoto.vue'

// BaseModal di-stub agar tidak bergantung Headless UI.
const stubs = {
  BaseModal: {
    props: { open: Boolean, title: String, size: String },
    emits: ['update:open'],
    template: '<div v-if="open" class="modal-stub"><slot /><div class="footer"><slot name="footer" /></div></div>',
  },
  BaseButton: {
    props: { variant: String, size: String },
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  BaseIcon: { props: { name: String, size: Number }, template: '<svg />' },
}

describe('PopupFoto', () => {
  it('tidak merender saat open=false', () => {
    const w = mount(PopupFoto, { props: { open: false, urls: [] }, global: { stubs } })
    expect(w.find('.modal-stub').exists()).toBe(false)
  })

  it('merender gambar saat open=true', () => {
    const w = mount(PopupFoto, {
      props: { open: true, urls: ['https://s3/foto.jpg'], title: 'Foto' },
      global: { stubs },
    })
    expect(w.find('img').exists()).toBe(true)
    expect(w.find('img').attributes('src')).toBe('https://s3/foto.jpg')
  })

  it('menampilkan tombol navigasi bila >1 foto', () => {
    const w = mount(PopupFoto, {
      props: { open: true, urls: ['url1', 'url2'], title: 'Foto' },
      global: { stubs },
    })
    const btns = w.findAll('button')
    expect(btns.some(b => b.text().includes('Sebelumnya'))).toBe(true)
    expect(btns.some(b => b.text().includes('Berikutnya'))).toBe(true)
  })

  it('tidak menampilkan navigasi bila hanya 1 foto', () => {
    const w = mount(PopupFoto, {
      props: { open: true, urls: ['url1'] },
      global: { stubs },
    })
    const btns = w.findAll('button')
    expect(btns.some(b => b.text().includes('Sebelumnya'))).toBe(false)
  })
})
