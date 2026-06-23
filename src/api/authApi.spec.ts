import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./http', () => ({
  http: { post: vi.fn(), get: vi.fn() },
}))

import { http } from './http'
import { authApi } from './authApi'

const env = (data: unknown) => ({ data: { success: true, data, request_id: 'r' } })

describe('api/authApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adminLogin POST /auth/admin/login dengan kredensial', async () => {
    vi.mocked(http.post).mockResolvedValue(
      env({ access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 }),
    )
    const res = await authApi.adminLogin('admin@rejki.id', 'pass')
    expect(http.post).toHaveBeenCalledWith('/auth/admin/login', {
      email: 'admin@rejki.id',
      password: 'pass',
    })
    expect(res.access_token).toBe('a')
  })

  it('refresh POST /auth/refresh dengan refresh_token', async () => {
    vi.mocked(http.post).mockResolvedValue(
      env({ access_token: 'a2', refresh_token: 'r2', token_type: 'Bearer', expires_in: 900 }),
    )
    await authApi.refresh('rtok')
    expect(http.post).toHaveBeenCalledWith('/auth/refresh', { refresh_token: 'rtok' })
  })

  it('logout POST /auth/logout', async () => {
    vi.mocked(http.post).mockResolvedValue(env(null))
    await authApi.logout()
    expect(http.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('me GET /users/me', async () => {
    vi.mocked(http.get).mockResolvedValue(env({ id: '1', username: 'admin', role: 'admin' }))
    const res = await authApi.me()
    expect(http.get).toHaveBeenCalledWith('/users/me')
    expect(res.username).toBe('admin')
  })
})
