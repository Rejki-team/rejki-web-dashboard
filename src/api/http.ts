// Instance Axios tunggal dengan interceptor auth (Task 2.2).
//
// Desain (grounded design D3 + Risks):
// - Request interceptor: sisipkan `Authorization: Bearer <access>`.
// - Response interceptor: pada 401, lakukan refresh token SEKALI saja meski banyak
//   request 401 bersamaan (atomic refresh queue → Zero Race Condition). Request yang
//   gagal di-antre lalu di-retry setelah token baru didapat.
// - Jika refresh gagal → bersihkan sesi & arahkan ke /login (via callback hook).
//
// Hook (`onSessionExpired`, refresh impl) diinjeksi dari luar agar modul ini tidak
// bergantung langsung pada store/router (Dependency Inversion — SOLID).

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { config } from '@/config'

/** Kontrak penyedia token & aksi sesi yang diinjeksikan store auth. */
export interface AuthBridge {
  getAccessToken: () => string | null
  /** Lakukan refresh; kembalikan access token baru atau null bila gagal. */
  refresh: () => Promise<string | null>
  /** Dipanggil saat sesi tidak dapat dipulihkan (refresh gagal). */
  onSessionExpired: () => void
}

// Flag retry agar tidak loop tak hingga pada request yang sama.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let bridge: AuthBridge | null = null

/** Pasang jembatan auth (dipanggil sekali saat store auth dibuat). */
export function installAuthBridge(b: AuthBridge): void {
  bridge = b
}

export const http: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Request interceptor ─────────────────────────────────────────────────────────
http.interceptors.request.use((cfg) => {
  const token = bridge?.getAccessToken()
  if (token) {
    cfg.headers.set('Authorization', `Bearer ${token}`)
  }
  return cfg
})

// ── Atomic refresh queue (Zero Race Condition) ───────────────────────────────────
// Saat refresh berlangsung, semua 401 lain menunggu Promise yang sama.
let refreshPromise: Promise<string | null> | null = null

function refreshOnce(): Promise<string | null> {
  if (!bridge) return Promise.resolve(null)
  if (!refreshPromise) {
    refreshPromise = bridge.refresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// ── Response interceptor ─────────────────────────────────────────────────────────
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    // Hanya tangani 401 sekali, dan jangan pada endpoint auth (login/refresh) sendiri.
    const isAuthEndpoint =
      typeof original?.url === 'string' &&
      (original.url.includes('/auth/admin/login') ||
        original.url.includes('/auth/refresh') ||
        original.url.includes('/auth/login'))

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      const newToken = await refreshOnce()
      if (newToken) {
        // Set header eksplisit untuk berjaga; request interceptor juga akan menyetelnya
        // dari bridge (yang sudah diperbarui oleh refresh) saat request di-retry.
        original.headers.set('Authorization', `Bearer ${newToken}`)
        return http(original as AxiosRequestConfig)
      }
      // Refresh gagal → sesi berakhir.
      bridge?.onSessionExpired()
    }

    return Promise.reject(error)
  },
)
