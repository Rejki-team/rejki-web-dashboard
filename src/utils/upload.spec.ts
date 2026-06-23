import { describe, it, expect, vi } from 'vitest'
import { validateEvidenceFile, uploadEvidence, ALLOWED_EVIDENCE_MIME } from './upload'

// Mock http client & axios untuk uploadEvidence.
vi.mock('@/api/http', () => ({
  http: { post: vi.fn() },
}))
vi.mock('axios', () => ({ default: { put: vi.fn().mockResolvedValue({}) } }))

import { http } from '@/api/http'
import axios from 'axios'

function fakeFile(type: string, size: number): File {
  const f = new File(['x'], 'bukti', { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('utils/upload', () => {
  describe('validateEvidenceFile', () => {
    it('menerima MIME yang diizinkan dalam batas ukuran', () => {
      for (const mime of ALLOWED_EVIDENCE_MIME) {
        expect(validateEvidenceFile(fakeFile(mime, 1024)).ok).toBe(true)
      }
    })

    it('menolak MIME tidak diizinkan', () => {
      const r = validateEvidenceFile(fakeFile('text/plain', 1024))
      expect(r.ok).toBe(false)
    })

    it('menolak ukuran melebihi batas', () => {
      const r = validateEvidenceFile(fakeFile('image/jpeg', 999_999_999))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.message).toMatch(/melebihi/)
    })
  })

  describe('uploadEvidence', () => {
    it('minta presigned lalu PUT file & kembalikan object_key', async () => {
      vi.mocked(http.post).mockResolvedValueOnce({
        data: { success: true, data: { presigned_url: 'https://s3/put', object_key: 'k/1' }, request_id: 'r' },
      })
      const key = await uploadEvidence('/pekerja/admin/suspend/evidence', fakeFile('image/jpeg', 1024))
      expect(key).toBe('k/1')
      expect(http.post).toHaveBeenCalledWith('/pekerja/admin/suspend/evidence', {
        mime: 'image/jpeg',
        size_bytes: 1024,
      })
      expect(axios.put).toHaveBeenCalledWith(
        'https://s3/put',
        expect.any(File),
        expect.objectContaining({ headers: { 'Content-Type': 'image/jpeg' } }),
      )
    })
  })
})
