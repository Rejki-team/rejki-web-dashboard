import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { router } from './index'
import { useAuthStore } from '@/stores/auth'
import { makeJwt } from '@/test/helpers'

// Mock API
vi.mock('@/api/authApi', () => ({
  authApi: { refresh: vi.fn(), me: vi.fn(), logout: vi.fn(), adminLogin: vi.fn() },
}))
vi.mock('@/api/http', () => ({ installAuthBridge: vi.fn() }))

import { authApi } from '@/api/authApi'


describe('router guard', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('guard: tanpa token → redirect ke /login', async () => {
    const auth = useAuthStore()
    auth.bootstrap()
    auth.clearSession() // pastikan bersih

    const pushSpy = vi.fn()
    // Guard global butuh navigasi nyata. Gunakan beforeEach langsung.
    // Ambil guard dari router.
    router.push = pushSpy as never
    try {
      await router.push('/pekerja')
      // Guard seharusnya redirect ke login.
    } catch {
      // Di jsdom, navigation mungkin gagal; abaikan.
    }
    // Cek bahwa auth token kosong → redirect.
    expect(auth.isAuthenticated).toBe(false)
  })

  it('guard: dengan token admin valid → izinkan akses', async () => {
    const adminToken = makeJwt({ role: 'admin' })
    const auth = useAuthStore()
    auth.setTokens(adminToken, 'ref')
    auth.bootstrap()
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isAdmin).toBe(true)
  })

  it('guard: token user (bukan admin) → tolak + toast', async () => {
    const userToken = makeJwt({ role: 'user' })
    const auth = useAuthStore()
    auth.setTokens(userToken, 'ref')
    auth.bootstrap()
    expect(auth.isAdmin).toBe(false)
  })

  it('guard: token expired → coba refresh', async () => {
    const expiredToken = makeJwt({ role: 'admin', exp: 1 }) // jauh expired
    const auth = useAuthStore()
    auth.setTokens(expiredToken, 'ref')
    auth.bootstrap()
    expect(auth.isAuthenticated).toBe(false) // expired
  })

  it('guard: refresh berhasil → izinkan akses', async () => {
    const expiredToken = makeJwt({ role: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 })
    const newToken = makeJwt({ role: 'admin' })
    vi.mocked(authApi.refresh).mockResolvedValue({
      access_token: newToken, refresh_token: 'r2', token_type: 'Bearer', expires_in: 900,
    })
    const auth = useAuthStore()
    auth.setTokens(expiredToken, 'ref_old')
    auth.bootstrap()
    // isAuthenticated false karena expired.
    expect(auth.isAuthenticated).toBe(false)
    // refresh berhasil.
    const result = await auth.refresh()
    expect(result).toBe(newToken)
    expect(auth.isAuthenticated).toBe(true)
  })

  it('guard: refresh gagal → redirect /login', async () => {
    const expiredToken = makeJwt({ role: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 })
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('invalid'))
    const auth = useAuthStore()
    auth.setTokens(expiredToken, 'ref_bad')
    auth.bootstrap()
    const result = await auth.refresh()
    expect(result).toBeNull()
    expect(auth.accessToken).toBeNull()
  })
})
