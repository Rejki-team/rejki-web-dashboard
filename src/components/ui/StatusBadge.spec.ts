import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'

describe('StatusBadge', () => {
  it('memetakan status dikenal ke label Indonesia', () => {
    expect(mount(StatusBadge, { props: { status: 'pending' } }).text()).toBe('Menunggu')
    expect(mount(StatusBadge, { props: { status: 'approved' } }).text()).toBe('Disetujui')
    expect(mount(StatusBadge, { props: { status: 'suspended' } }).text()).toBe('Disuspensi')
    expect(mount(StatusBadge, { props: { status: 'resolved' } }).text()).toBe('Selesai')
  })

  it('status tidak dikenal ditampilkan apa adanya', () => {
    expect(mount(StatusBadge, { props: { status: 'aneh' } }).text()).toBe('aneh')
  })
})
