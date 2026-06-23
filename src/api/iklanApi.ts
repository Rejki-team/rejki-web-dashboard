// API moderasi iklan (pekerja / pekerjaan / barang) — GROUNDED route nyata:
//   /pekerja/admin, /pekerjaan/admin, /barang/admin  (list, export.csv, suspend, suspend/evidence)
//
// Ketiganya berbagi pola admin yang sama (lihat *-service/interface/mod.rs):
//   GET    {base}/admin               (admin_list)
//   GET    {base}/admin/export.csv    (admin_export_csv)
//   POST   {base}/admin/suspend/evidence (presigned)
//   POST   {base}/admin/suspend       (suspend single/bulk)
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { SuspendResponse } from '@/types/domain'

/** Basis path per vertikal iklan (mount point backend). */
export type IklanVertical = 'pekerja' | 'pekerjaan' | 'barang'

export interface SuspendIklanPayload {
  iklan_ids: string[]
  is_permanent: boolean
  reason: string
  evidence_object_key: string
  expires_at?: string | null
}

function adminBase(v: IklanVertical): string {
  return `/${v}/admin`
}

export const iklanApi = {
  listEndpoint: (v: IklanVertical) => adminBase(v),
  exportEndpoint: (v: IklanVertical) => `${adminBase(v)}/export.csv`,
  evidenceEndpoint: (v: IklanVertical) => `${adminBase(v)}/suspend/evidence`,

  async suspend(v: IklanVertical, payload: SuspendIklanPayload): Promise<SuspendResponse> {
    const { data } = await http.post<ApiResponse<SuspendResponse>>(
      `${adminBase(v)}/suspend`,
      payload,
    )
    return data.data
  },
}
