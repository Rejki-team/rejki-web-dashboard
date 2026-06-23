import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { makeJwt } from '@/test/helpers'

// Mock authApi & http bridge.
vi.mock('@/api/authApi', () => ({
  authApi: {
    adminLogin: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))
vi.mock('@/api/http', () => ({ installAuthBridge: vi.fn() }))

import { authApi } from '@/api/authApi'
import { installAuthBridge } from '@/api/http'
import { useAuthStore } from './auth'

const adminToken = makeJwt({ role: 'admin' })
const userToken = makeJwt({ role: 'user' })

describe('stores/auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('bootstrap memasang bridge & memulihkan role dari token tersimpan', () => {
    localStorage.setItem('rejki.access_token', adminToken)
    localStorage.setItem('rejki.refresh_token', 'ref')
    const auth = useAuthStore()
    auth.bootstrap()
    expect(installAuthBridge).toHaveBeenCalled()
    expect(auth.role).toBe('admin')
  })

  it('login menyimpan token, role, & memuat profil', async () => {
    vi.mocked(authApi.adminLogin).mockResolvedValue({
      access_token: adminToken,
      refresh_token: 'ref',
      token_type: 'Bearer',
      expires_in: 900,
    })
    vi.mocked(authApi.me).mockResolvedValue({
      id: '1',
      username: 'admin',
      full_name: 'Admin',
      avatar: null,
      bio: null,
      phone: null,
      role: 'admin',
      nik_masked: null,
      kyc_status: null,
    })
    const auth = useAuthStore()
    await auth.login('admin@rejki.id', 'pass')
    expect(auth.accessToken).toBe(adminToken)
    expect(auth.isAdmin).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.username).toBe('admin')
    expect(localStorage.getItem('rejki.access_token')).toBe(adminToken)
  })

  it('login membersihkan sesi & melempar pada galat', async () => {
    vi.mocked(authApi.adminLogin).mockRejectedValue(new Error('401'))
    const auth = useAuthStore()
    await expect(auth.login('x', 'y')).rejects.toBeTruthy()
    expect(auth.accessToken).toBeNull()
  })

  it('isAdmin false untuk token non-admin', async () => {
    vi.mocked(authApi.adminLogin).mockResolvedValue({
      access_token: userToken,
      refresh_token: 'ref',
      token_type: 'Bearer',
      expires_in: 900,
    })
    vi.mocked(authApi.me).mockResolvedValue({
      id: '1',
      username: 'u',
      full_name: null,
      avatar: null,
      bio: null,
      phone: null,
      role: 'user',
      nik_masked: null,
      kyc_status: null,
    })
    const auth = useAuthStore()
    await auth.login('u@rejki.id', 'pass')
    expect(auth.isAdmin).toBe(false)
  })

  it('refresh memperbarui token & mengembalikan token baru', async () => {
    const newToken = makeJwt({ role: 'admin' })
    vi.mocked(authApi.refresh).mockResolvedValue({
      access_token: newToken,
      refresh_token: 'ref2',
      token_type: 'Bearer',
      expires_in: 900,
    })
    const auth = useAuthStore()
    auth.refreshToken = 'ref'
    const result = await auth.refresh()
    expect(result).toBe(newToken)
    expect(auth.accessToken).toBe(newToken)
  })

  it('refresh mengembalikan null & membersihkan sesi saat gagal', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('invalid'))
    const auth = useAuthStore()
    auth.accessToken = adminToken
    auth.refreshToken = 'ref'
    const result = await auth.refresh()
    expect(result).toBeNull()
    expect(auth.accessToken).toBeNull()
  })

  it('refresh tanpa refreshToken mengembalikan null', async () => {
    const auth = useAuthStore()
    auth.refreshToken = null
    expect(await auth.refresh()).toBeNull()
  })

  it('logout memanggil API lalu membersihkan sesi (meski API gagal)', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new Error('500'))
    const auth = useAuthStore()
    auth.setTokens(adminToken, 'ref')
    await auth.logout()
    expect(auth.accessToken).toBeNull()
    expect(localStorage.getItem('rejki.access_token')).toBeNull()
  })
})
