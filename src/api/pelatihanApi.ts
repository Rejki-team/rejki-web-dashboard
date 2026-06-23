// API admin pelatihan — GROUNDED route nyata (mount /pelatihan/admin):
//   /pelatihan/admin/pelatihan            GET(list) POST(create)
//   /pelatihan/admin/pelatihan/{id}       PATCH(update) DELETE(cancel)
//   /pelatihan/admin/pelatihan/{id}/review POST
//   /pelatihan/admin/pelatihan/export.csv GET
//   /pelatihan/admin/enrollments[...]     list/detail/review/export
//   /pelatihan/admin/badges[...]          list/detail/review/export
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { AdminPelatihan, AdminEnrollment, AdminBadge } from '@/types/domain'

const BASE = '/pelatihan/admin'

export interface CreatePelatihanPayload {
  judul: string
  penyelenggara: string
  deskripsi: string
  lokasi?: string | null
  harga?: number | null
  tanggal_mulai?: string | null
  tanggal_selesai?: string | null
  foto_urls?: string[]
  jumlah_peserta?: number | null
}

export type UpdatePelatihanPayload = Omit<CreatePelatihanPayload, 'foto_urls'>

export interface ReviewPayload {
  approved: boolean
  review_note?: string | null
}

export const pelatihanApi = {
  // Endpoint untuk useServerTable.
  listEndpoint: `${BASE}/pelatihan`,
  exportEndpoint: `${BASE}/pelatihan/export.csv`,
  enrollmentListEndpoint: `${BASE}/enrollments`,
  enrollmentExportEndpoint: `${BASE}/enrollments/export.csv`,
  badgeListEndpoint: `${BASE}/badges`,
  badgeExportEndpoint: `${BASE}/badges/export.csv`,

  // ── Pelatihan ──
  async create(payload: CreatePelatihanPayload): Promise<AdminPelatihan> {
    const { data } = await http.post<ApiResponse<AdminPelatihan>>(`${BASE}/pelatihan`, payload)
    return data.data
  },
  async update(id: string, payload: UpdatePelatihanPayload): Promise<AdminPelatihan> {
    const { data } = await http.patch<ApiResponse<AdminPelatihan>>(
      `${BASE}/pelatihan/${id}`,
      payload,
    )
    return data.data
  },
  async cancel(id: string): Promise<void> {
    await http.delete(`${BASE}/pelatihan/${id}`)
  },
  async review(id: string, payload: ReviewPayload): Promise<AdminPelatihan> {
    const { data } = await http.post<ApiResponse<AdminPelatihan>>(
      `${BASE}/pelatihan/${id}/review`,
      payload,
    )
    return data.data
  },

  // ── Enrollment ──
  async enrollmentDetail(id: string): Promise<AdminEnrollment> {
    const { data } = await http.get<ApiResponse<AdminEnrollment>>(`${BASE}/enrollments/${id}`)
    return data.data
  },
  async enrollmentReview(id: string, payload: ReviewPayload): Promise<AdminEnrollment> {
    const { data } = await http.post<ApiResponse<AdminEnrollment>>(
      `${BASE}/enrollments/${id}/review`,
      payload,
    )
    return data.data
  },

  // ── Badge ──
  async badgeDetail(id: string): Promise<AdminBadge> {
    const { data } = await http.get<ApiResponse<AdminBadge>>(`${BASE}/badges/${id}`)
    return data.data
  },
  async badgeReview(id: string, payload: ReviewPayload): Promise<AdminBadge> {
    const { data } = await http.post<ApiResponse<AdminBadge>>(
      `${BASE}/badges/${id}/review`,
      payload,
    )
    return data.data
  },
}
