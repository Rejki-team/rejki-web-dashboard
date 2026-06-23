import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('merender judul & deskripsi', () => {
    const w = mount(PageHeader, { props: { title: 'Judul', description: 'Deskripsi' } })
    expect(w.text()).toContain('Judul')
    expect(w.text()).toContain('Deskripsi')
  })

  it('merender slot actions', () => {
    const w = mount(PageHeader, {
      props: { title: 'X' },
      slots: { actions: '<button>Aksi</button>' },
    })
    expect(w.text()).toContain('Aksi')
  })
})
