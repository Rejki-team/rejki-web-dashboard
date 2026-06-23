// API pengelolaan pengguna (KYC + suspend) — GROUNDED route nyata:
//   GET  /users/admin/kyc                         (list pengajuan KYC)
//   GET  /users/admin/kyc/export.csv              (export)
//   GET  /users/admin/kyc/{id}                    (detail; NIK ter-mask)
//   POST /users/admin/kyc/{id}/review             (approve/reject)
//   GET  /users/admin/kyc/{id}/documents/{kind}   (presigned read; TERAUDIT)
//   POST /auth/admin/users/suspend                (bulk suspend; partial-success)
//   POST /auth/admin/users/{id}/suspend/evidence  (presigned bukti)
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { AdminKycDetail, UploadPermission, BulkSuspendResponse } from '@/types/domain'

const KYC_BASE = '/users/admin/kyc'
const SUSPEND_BASE = '/auth/admin/users'

export interface ReviewKycPayload {
  approved: boolean
  review_note?: string | null
}

export interface BulkSuspendPayload {
  user_ids: string[]
  permanent: boolean
  reason: string
  expires_at?: string | null
  evidence_object_key?: string | null
}

export const penggunaApi = {
  listEndpoint: KYC_BASE,
  exportEndpoint: `${KYC_BASE}/export.csv`,

  async detail(id: string): Promise<AdminKycDetail> {
    const { data } = await http.get<ApiResponse<AdminKycDetail>>(`${KYC_BASE}/${id}`)
    return data.data
  },

  async review(id: string, payload: ReviewKycPayload): Promise<void> {
    await http.post(`${KYC_BASE}/${id}/review`, payload)
  },

  /** Minta presigned read URL dokumen (kind: 'ktp' | 'selfie'). Memicu audit di backend. */
  async documentUrl(id: string, kind: 'ktp' | 'selfie'): Promise<string> {
    const { data } = await http.get<ApiResponse<UploadPermission>>(
      `${KYC_BASE}/${id}/documents/${kind}`,
    )
    return data.data.presigned_url
  },

  /** Minta presigned URL untuk unggah bukti suspend (per user). */
  evidenceEndpoint: (userId: string) => `${SUSPEND_BASE}/${userId}/suspend/evidence`,

  async bulkSuspend(payload: BulkSuspendPayload): Promise<BulkSuspendResponse> {
    const { data } = await http.post<ApiResponse<BulkSuspendResponse>>(
      `${SUSPEND_BASE}/suspend`,
      payload,
    )
    return data.data
  },
}
