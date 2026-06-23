import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BulkSelectActionBar from './BulkSelectActionBar.vue'

describe('BulkSelectActionBar', () => {
  it('tersembunyi saat count 0', () => {
    const w = mount(BulkSelectActionBar, { props: { count: 0 } })
    expect(w.text()).not.toContain('dipilih')
  })

  it('menampilkan jumlah & label aksi saat count > 0', () => {
    const w = mount(BulkSelectActionBar, { props: { count: 3, actionLabel: 'Suspend' } })
    expect(w.text()).toContain('3 item dipilih')
    expect(w.text()).toContain('Suspend (3)')
  })

  it('emit action & clear', async () => {
    const w = mount(BulkSelectActionBar, { props: { count: 2 } })
    const buttons = w.findAll('button')
    await buttons[0].trigger('click') // tombol aksi
    expect(w.emitted('action')).toBeTruthy()
    await buttons[1].trigger('click') // tombol clear
    expect(w.emitted('clear')).toBeTruthy()
  })
})
