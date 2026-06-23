import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { http, installAuthBridge, type AuthBridge } from './http'

// Adapter kustom untuk mensimulasikan respons server tanpa jaringan nyata.
function setAdapter(fn: (config: InternalAxiosRequestConfig) => Promise<unknown>) {
  http.defaults.adapter = fn as never
}

describe('api/http interceptors', () => {
  let bridge: AuthBridge
  let currentToken: string

  beforeEach(() => {
    // Model bridge nyata: refresh() memperbarui token yang dikembalikan getAccessToken()
    // (store memanggil setTokens sebelum refresh resolve).
    currentToken = 'token-lama'
    bridge = {
      getAccessToken: vi.fn(() => currentToken),
      refresh: vi.fn(async () => {
        currentToken = 'token-baru'
        return currentToken
      }),
      onSessionExpired: vi.fn(),
    }
    installAuthBridge(bridge)
  })

  it('menyisipkan Authorization Bearer dari bridge', async () => {
    let seenAuth: string | undefined
    setAdapter(async (config) => {
      seenAuth = config.headers?.get('Authorization') as string
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
    })
    await http.get('/dummy')
    expect(seenAuth).toBe('Bearer token-lama')
  })

  it('pada 401 melakukan refresh sekali lalu retry dengan token baru', async () => {
    let call = 0
    const seenAuths: string[] = []
    setAdapter(async (config) => {
      call++
      seenAuths.push(config.headers?.get('Authorization') as string)
      if (call === 1) {
        const err = new AxiosError('unauthorized')
        err.config = config
        err.response = {
          status: 401,
          data: { error: 'UNAUTHORIZED', message: 'x' },
          statusText: '',
          headers: {},
          config,
        }
        throw err
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
    })

    const res = await http.get('/protected')
    expect((res.data as { ok: boolean }).ok).toBe(true)
    expect(bridge.refresh).toHaveBeenCalledTimes(1)
    // Retry memakai token baru.
    expect(seenAuths[1]).toBe('Bearer token-baru')
  })

  it('memanggil onSessionExpired bila refresh gagal', async () => {
    vi.mocked(bridge.refresh).mockResolvedValueOnce(null)
    setAdapter(async (config) => {
      const err = new AxiosError('unauthorized')
      err.config = config
      err.response = {
        status: 401,
        data: { error: 'UNAUTHORIZED', message: 'x' },
        statusText: '',
        headers: {},
        config,
      }
      throw err
    })
    await expect(http.get('/protected')).rejects.toBeTruthy()
    expect(bridge.onSessionExpired).toHaveBeenCalled()
  })

  it('tidak mencoba refresh pada endpoint login', async () => {
    setAdapter(async (config) => {
      const err = new AxiosError('unauthorized')
      err.config = config
      err.response = {
        status: 401,
        data: { error: 'UNAUTHORIZED', message: 'x' },
        statusText: '',
        headers: new AxiosHeaders(),
        config,
      }
      throw err
    })
    await expect(http.post('/auth/admin/login', {})).rejects.toBeTruthy()
    expect(bridge.refresh).not.toHaveBeenCalled()
  })
})
