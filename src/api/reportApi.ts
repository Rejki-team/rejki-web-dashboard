// API admin content reports (Pengelolaan Dukungan) — GROUNDED route nyata:
//   GET  /reports/admin              (list aduan)
//   GET  /reports/admin/{id}         (detail + evidence_read_url)
//   POST /reports/admin/{id}/review  (tindak lanjut; action_note WAJIB)
//   GET  /reports/admin/export.csv   (export)
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { AdminReportDetail } from '@/types/domain'

const BASE = '/reports/admin'

export interface ReviewReportPayload {
  approved: boolean
  action_note: string
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
}
