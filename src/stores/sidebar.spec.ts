import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSidebarStore } from './sidebar'

describe('stores/sidebar', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('default terbuka', () => {
    expect(useSidebarStore().open).toBe(true)
  })

  it('toggle membalik state', () => {
    const s = useSidebarStore()
    s.toggle()
    expect(s.open).toBe(false)
    s.toggle()
    expect(s.open).toBe(true)
  })

  it('close & setOpen', () => {
    const s = useSidebarStore()
    s.close()
    expect(s.open).toBe(false)
    s.setOpen(true)
    expect(s.open).toBe(true)
  })
})
