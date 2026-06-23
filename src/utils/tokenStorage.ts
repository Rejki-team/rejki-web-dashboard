// Penyimpanan token terabstraksi (single source of truth).
// Saat ini localStorage (acceptable untuk dev, lihat design Open Questions).
// Diabstraksi agar mudah diganti ke httpOnly cookie tanpa menyentuh store.

const ACCESS_KEY = 'rejki.access_token'
const REFRESH_KEY = 'rejki.refresh_token'

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  setAccess(access: string): void {
    localStorage.setItem(ACCESS_KEY, access)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
