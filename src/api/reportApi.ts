// API admin content reports (Pengelolaan Dukungan) — GROUNDED route nyata:
//   GET  /reports/admin                       (list aduan)
//   GET  /reports/admin/{id}                  (detail + evidence_read_url)
//   POST /reports/admin/{id}/review            (tindak lanjut; action_note WAJIB)
//   POST /reports/admin/{id}/approve-and-suspend (Terima & Suspend, Kelompok 6 P9.1/P10)
//   GET  /reports/admin/export.csv             (export)
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { AdminReportDetail } from '@/types/domain'

const BASE = '/reports/admin'

export interface ReviewReportPayload {
  approved: boolean
  action_note: string
}

/** Payload sama persis pola `SuspendIklanPayload`/`SuspendPenggunaPayload` existing
 * (`is_permanent` + `expires_at` opsional terpisah — UI tidak pernah mengirim
 * tanggal spesifik, backend fallback ke durasi default bila kosong). */
export interface ApproveAndSuspendPayload {
  reason: string
  is_permanent: boolean
  expires_at?: string | null
}

export const reportApi = {
  listEndpoint: BASE,
  exportEndpoint: `${BASE}/export.csv`,

  async detail(id: string): Promise<AdminReportDetail> {
    const { data } = await http.get<ApiResponse<AdminReportDetail>>(`${BASE}/${id}`)
    return data.data
  },

  async review(id: string, payload: ReviewReportPayload): Promise<void> {
    await http.post(`${BASE}/${id}/review`, payload)
  },

  async approveAndSuspend(id: string, payload: ApproveAndSuspendPayload): Promise<void> {
    await http.post(`${BASE}/${id}/approve-and-suspend`, payload)
  },
}
