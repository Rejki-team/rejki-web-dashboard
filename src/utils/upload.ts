// Helper unggah bukti via presigned URL.
// Alur (grounded backend): minta presigned (POST .../evidence) → PUT file ke presigned_url
// (langsung ke object storage, TANPA Bearer) → pakai object_key pada payload aksi.
import axios from 'axios'
import { http } from '@/api/http'
import { config } from '@/config'
import type { ApiResponse } from '@/types/api'
import type { UploadPermission } from '@/types/domain'

export const ALLOWED_EVIDENCE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export interface UploadValidationError {
  ok: false
  message: string
}
export interface UploadValidationOk {
  ok: true
}

/** Validasi MIME & ukuran berkas bukti (≤ batas, jenis diizinkan). */
export function validateEvidenceFile(file: File): UploadValidationOk | UploadValidationError {
  if (!ALLOWED_EVIDENCE_MIME.includes(file.type)) {
    return { ok: false, message: 'Jenis berkas harus PDF atau gambar (JPG/PNG/WebP).' }
  }
  if (file.size > config.maxEvidenceBytes) {
    const mb = Math.round(config.maxEvidenceBytes / (1024 * 1024))
    return { ok: false, message: `Ukuran berkas melebihi ${mb} MB.` }
  }
  return { ok: true }
}

/**
 * Unggah bukti: minta presigned ke `evidenceEndpoint`, PUT file, kembalikan object_key.
 * @returns object_key untuk disertakan pada payload aksi (suspend/report).
 */
export async function uploadEvidence(evidenceEndpoint: string, file: File): Promise<string> {
  const { data } = await http.post<ApiResponse<UploadPermission>>(evidenceEndpoint, {
    mime: file.type,
    size_bytes: file.size,
  })
  const { presigned_url, object_key } = data.data

  // PUT langsung ke storage (presigned) — instance axios terpisah tanpa interceptor auth.
  await axios.put(presigned_url, file, { headers: { 'Content-Type': file.type } })

  return object_key
}
