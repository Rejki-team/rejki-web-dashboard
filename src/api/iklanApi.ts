// API moderasi iklan (pekerja / pekerjaan / barang) — GROUNDED route nyata:
//   /pekerja/admin, /pekerjaan/admin, /barang/admin  (list, export.csv, suspend, suspend/evidence)
//
// Ketiganya berbagi pola admin yang sama (lihat *-service/interface/mod.rs):
//   GET    {base}/admin               (admin_list)
//   GET    {base}/admin/export.csv    (admin_export_csv)
//   POST   {base}/admin/suspend/evidence (presigned)
//   POST   {base}/admin/suspend       (suspend single/bulk)
//
// Khusus Iklan Pekerja (F-27b — TIDAK ada di pekerjaan/barang, hanya profil pekerja
// yang membawa dokumen KYC poster):
//   GET    /pekerja/admin/{id}                    (detail + indikator dokumen sensitif)
//   GET    /pekerja/admin/{id}/sensitive/{kind}    (proxy reveal NIK/KTP/Selfie, TERAUDIT di user-service)
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { AdminIklanPekerjaDetail, SuspendResponse } from '@/types/domain'

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

  /** Detail iklan pekerja untuk pop-up admin, termasuk indikator dokumen sensitif
   * poster (F-27b). KHUSUS vertikal Iklan Pekerja — belum ada di pekerjaan/barang. */
  async pekerjaDetail(id: string): Promise<AdminIklanPekerjaDetail> {
    const { data } = await http.get<ApiResponse<AdminIklanPekerjaDetail>>(
      `${adminBase('pekerja')}/${id}`,
    )
    return data.data
  },

  /** Proxy reveal NIK/KTP/Selfie poster (F-27b). Audit tercatat tunggal di
   * user-service — iklan-pekerja-service tidak menyimpan/mencatat ulang. */
  async pekerjaRevealSensitive(id: string, kind: 'nik' | 'ktp' | 'selfie'): Promise<string> {
    const { data } = await http.get<ApiResponse<Record<string, string>>>(
      `${adminBase('pekerja')}/${id}/sensitive/${kind}`,
    )
    return kind === 'nik' ? data.data.nik : data.data.url
  },
}
