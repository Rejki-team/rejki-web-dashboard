import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { normalizeError, AppApiError } from './errors'

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const err = new AxiosError('req failed')
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
  return err
}

describe('api/errors', () => {
  it('mengembalikan AppApiError apa adanya', () => {
    const e = new AppApiError('NOT_FOUND', 404, 'x', 'pesan')
    expect(normalizeError(e)).toBe(e)
  })

  it('memetakan ErrorBody backend → kode + userMessage', () => {
    const e = normalizeError(axiosErrorWith(404, { error: 'NOT_FOUND', message: 'tidak ada' }))
    expect(e.code).toBe('NOT_FOUND')
    expect(e.status).toBe(404)
    expect(e.userMessage).toBe('Data tidak ditemukan.')
  })

  it('memetakan ACCOUNT_NOT_ADMIN', () => {
    const e = normalizeError(axiosErrorWith(403, { error: 'ACCOUNT_NOT_ADMIN', message: 'x' }))
    expect(e.code).toBe('ACCOUNT_NOT_ADMIN')
    expect(e.userMessage).toMatch(/admin/i)
  })

  it('menangani error tanpa response sebagai NETWORK_ERROR', () => {
    const e = normalizeError(new AxiosError('Network Error'))
    expect(e.code).toBe('NETWORK_ERROR')
    expect(e.status).toBe(0)
  })

  it('menangani body tidak dikenal sebagai UNKNOWN', () => {
    const e = normalizeError(axiosErrorWith(500, 'plain text'))
    expect(e.code).toBe('UNKNOWN')
  })

  it('menangani error non-Axios', () => {
    const e = normalizeError(new Error('boom'))
    expect(e.code).toBe('UNKNOWN')
    expect(e.message).toBe('boom')
  })
})
