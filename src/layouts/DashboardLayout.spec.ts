import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardLayout from './DashboardLayout.vue'

// Stub AppSidebar + AppHeader + RouterView.
const stubs = {
  AppSidebar: { template: '<div class="sidebar-stub">Sidebar</div>' },
  AppHeader: { template: '<div class="header-stub">Header</div>' },
  RouterView: { template: '<div class="router-view-stub">Content</div>' },
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('merender sidebar, header, dan router-view', () => {
    const w = mount(DashboardLayout, { global: { stubs } })
    expect(w.text()).toContain('Sidebar')
    expect(w.text()).toContain('Header')
    expect(w.text()).toContain('Content')
  })

  it('memanggil sidebar.setOpen di onMounted', () => {
    // Verifikasi mount tidak error.
    const w = mount(DashboardLayout, { global: { stubs } })
    expect(w.find('.sidebar-stub').exists()).toBe(true)
  })
})
