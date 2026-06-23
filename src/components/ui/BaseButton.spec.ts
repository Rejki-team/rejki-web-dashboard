import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('merender slot & tipe default button', () => {
    const w = mount(BaseButton, { slots: { default: 'Simpan' } })
    expect(w.text()).toContain('Simpan')
    expect(w.find('button').attributes('type')).toBe('button')
  })

  it('disabled saat prop disabled / loading', () => {
    expect(mount(BaseButton, { props: { disabled: true } }).find('button').attributes('disabled')).toBeDefined()
    expect(mount(BaseButton, { props: { loading: true } }).find('button').attributes('disabled')).toBeDefined()
  })

  it('menampilkan spinner saat loading', () => {
    const w = mount(BaseButton, { props: { loading: true } })
    expect(w.find('svg.animate-spin').exists()).toBe(true)
  })

  it('menerapkan kelas varian', () => {
    const danger = mount(BaseButton, { props: { variant: 'danger' } })
    expect(danger.find('button').classes().join(' ')).toContain('bg-danger-500')
  })

  it('emit click saat ditekan', async () => {
    const w = mount(BaseButton)
    await w.find('button').trigger('click')
    expect(w.emitted('click')).toBeTruthy()
  })
})
