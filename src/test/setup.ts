// Setup global untuk Vitest (jsdom).
// Menyediakan stub yang tidak ada di jsdom namun dipakai komponen.

import { vi } from 'vitest'

// matchMedia stub (dipakai oleh logika responsif).
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// URL.createObjectURL / revokeObjectURL stub (dipakai ExportCsv & PopupFoto).
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock')
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn()
}
