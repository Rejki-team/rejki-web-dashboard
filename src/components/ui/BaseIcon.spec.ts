import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseIcon from './BaseIcon.vue'

describe('BaseIcon', () => {
  it('merender svg dengan ukuran default 20', () => {
    const w = mount(BaseIcon, { props: { name: 'eye' } })
    const svg = w.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('20')
  })

  it('menghormati prop size', () => {
    const w = mount(BaseIcon, { props: { name: 'trash', size: 32 } })
    expect(w.find('svg').attributes('width')).toBe('32')
  })

  it('menyisipkan path untuk ikon dikenal', () => {
    const w = mount(BaseIcon, { props: { name: 'pencil' } })
    expect(w.find('svg').html()).toContain('<path')
  })
})
