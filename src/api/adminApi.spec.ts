import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./http', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import { http } from './http'
import { iklanApi } from './iklanApi'
import { pelatihanApi } from './pelatihanApi'
import { penggunaApi } from './penggunaApi'
import { reportApi } from './reportApi'
import { articleApi } from './articleApi'

const env = (data: unknown) => ({ data: { success: true, data, request_id: 'r' } })

beforeEach(() => vi.clearAllMocks())

describe('api/iklanApi', () => {
  it('endpoint builder memakai mount point benar per vertikal', () => {
    expect(iklanApi.listEndpoint('pekerja')).toBe('/pekerja/admin')
    expect(iklanApi.exportEndpoint('pekerjaan')).toBe('/pekerjaan/admin/export.csv')
    expect(iklanApi.evidenceEndpoint('barang')).toBe('/barang/admin/suspend/evidence')
  })

  it('suspend POST {base}/suspend dengan payload', async () => {
    vi.mocked(http.post).mockResolvedValue(env({ results: [] }))
    await iklanApi.suspend('pekerja', {
      iklan_ids: ['1'],
      is_permanent: false,
      reason: 'r',
      evidence_object_key: 'k',
    })
    expect(http.post).toHaveBeenCalledWith('/pekerja/admin/suspend', expect.objectContaining({
      iklan_ids: ['1'],
    }))
  })
})

describe('api/pelatihanApi', () => {
  it('endpoint list & export benar (mount /pelatihan/admin)', () => {
    expect(pelatihanApi.listEndpoint).toBe('/pelatihan/admin/pelatihan')
    expect(pelatihanApi.enrollmentListEndpoint).toBe('/pelatihan/admin/enrollments')
    expect(pelatihanApi.badgeListEndpoint).toBe('/pelatihan/admin/badges')
  })

  it('create/update/cancel/review pelatihan memakai path benar', async () => {
    vi.mocked(http.post).mockResolvedValue(env({ id: '1' }))
    vi.mocked(http.patch).mockResolvedValue(env({ id: '1' }))
    vi.mocked(http.delete).mockResolvedValue(env(null))
    await pelatihanApi.create({ judul: 'J', penyelenggara: 'P', deskripsi: 'D' })
    expect(http.post).toHaveBeenCalledWith('/pelatihan/admin/pelatihan', expect.any(Object))
    await pelatihanApi.update('1', { judul: 'J', penyelenggara: 'P', deskripsi: 'D' })
    expect(http.patch).toHaveBeenCalledWith('/pelatihan/admin/pelatihan/1', expect.any(Object))
    await pelatihanApi.cancel('1')
    expect(http.delete).toHaveBeenCalledWith('/pelatihan/admin/pelatihan/1')
    await pelatihanApi.review('1', { approved: true })
    expect(http.post).toHaveBeenCalledWith('/pelatihan/admin/pelatihan/1/review', { approved: true })
  })

  it('enrollment & badge review path', async () => {
    vi.mocked(http.post).mockResolvedValue(env({ id: '1' }))
    vi.mocked(http.get).mockResolvedValue(env({ id: '1' }))
    await pelatihanApi.enrollmentReview('e1', { approved: false, review_note: 'x' })
    expect(http.post).toHaveBeenCalledWith('/pelatihan/admin/enrollments/e1/review', expect.any(Object))
    await pelatihanApi.badgeDetail('b1')
    expect(http.get).toHaveBeenCalledWith('/pelatihan/admin/badges/b1')
  })
})

describe('api/penggunaApi', () => {
  it('endpoint KYC & suspend evidence', () => {
    expect(penggunaApi.listEndpoint).toBe('/users/admin/kyc')
    expect(penggunaApi.exportEndpoint).toBe('/users/admin/kyc/export.csv')
    expect(penggunaApi.evidenceEndpoint('u1')).toBe('/auth/admin/users/u1/suspend/evidence')
  })

  it('documentUrl GET endpoint teraudit & kembalikan presigned_url', async () => {
    vi.mocked(http.get).mockResolvedValue(env({ presigned_url: 'https://s3/ktp', object_key: 'k' }))
    const url = await penggunaApi.documentUrl('s1', 'ktp')
    expect(http.get).toHaveBeenCalledWith('/users/admin/kyc/s1/documents/ktp')
    expect(url).toBe('https://s3/ktp')
  })

  it('bulkSuspend POST /auth/admin/users/suspend', async () => {
    vi.mocked(http.post).mockResolvedValue(env({ results: [{ user_id: 'u1', success: true, error: null }] }))
    const res = await penggunaApi.bulkSuspend({ user_ids: ['u1'], permanent: false, reason: 'r' })
    expect(http.post).toHaveBeenCalledWith('/auth/admin/users/suspend', expect.objectContaining({
      user_ids: ['u1'],
    }))
    expect(res.results[0].success).toBe(true)
  })

  it('review POST /users/admin/kyc/{id}/review', async () => {
    vi.mocked(http.post).mockResolvedValue(env(null))
    await penggunaApi.review('s1', { approved: true, review_note: null })
    expect(http.post).toHaveBeenCalledWith('/users/admin/kyc/s1/review', expect.any(Object))
  })
})

describe('api/reportApi', () => {
  it('endpoint & detail/review path', async () => {
    expect(reportApi.listEndpoint).toBe('/reports/admin')
    expect(reportApi.exportEndpoint).toBe('/reports/admin/export.csv')
    vi.mocked(http.get).mockResolvedValue(env({ id: '1', evidence_read_url: 'u' }))
    await reportApi.detail('1')
    expect(http.get).toHaveBeenCalledWith('/reports/admin/1')
    vi.mocked(http.post).mockResolvedValue(env(null))
    await reportApi.review('1', { approved: true, action_note: 'done' })
    expect(http.post).toHaveBeenCalledWith('/reports/admin/1/review', {
      approved: true,
      action_note: 'done',
    })
  })
})

describe('api/articleApi', () => {
  it('CRUD + photoUpload path benar', async () => {
    expect(articleApi.listEndpoint).toBe('/admin/articles')
    vi.mocked(http.post).mockResolvedValue(env({ id: '1', presigned_url: 'u', object_key: 'k' }))
    vi.mocked(http.patch).mockResolvedValue(env({ id: '1' }))
    vi.mocked(http.delete).mockResolvedValue(env(null))
    vi.mocked(http.get).mockResolvedValue(env({ id: '1' }))

    await articleApi.create({ title: 'T', body: 'B' })
    expect(http.post).toHaveBeenCalledWith('/admin/articles', expect.any(Object))
    await articleApi.update('1', { title: 'T', body: 'B', category: 'informasi' })
    expect(http.patch).toHaveBeenCalledWith('/admin/articles/1', expect.any(Object))
    await articleApi.remove('1')
    expect(http.delete).toHaveBeenCalledWith('/admin/articles/1')
    await articleApi.detail('1')
    expect(http.get).toHaveBeenCalledWith('/admin/articles/1')

    const file = new File(['x'], 'f.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 100 })
    await articleApi.photoUpload(file)
    expect(http.post).toHaveBeenCalledWith('/admin/articles/photo-upload', {
      mime: 'image/jpeg',
      size_bytes: 100,
    })
  })
})
