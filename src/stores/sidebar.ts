// Store state sidebar (design D2): terbuka/tertutup + mode mobile.
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    /** Terbuka di desktop (default true) / overlay di mobile. */
    open: true,
  }),
  actions: {
    toggle() {
      this.open = !this.open
    },
    close() {
      this.open = false
    },
    setOpen(v: boolean) {
      this.open = v
    },
  },
})
