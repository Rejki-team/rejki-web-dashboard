// API admin Corporate Communication (artikel) — GROUNDED route nyata:
//   GET    /admin/articles               (list; q, category, sort_dir, limit, offset)
//   POST   /admin/articles               (create → broadcast)
//   GET    /admin/articles/{id}          (detail)
//   PATCH  /admin/articles/{id}          (update → broadcast)
//   DELETE /admin/articles/{id}          (soft-delete)
//   POST   /admin/articles/photo-upload  (presigned foto)
import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { AdminArticle, UploadPermission } from '@/types/domain'

const BASE = '/admin/articles'

export interface CreateArticlePayload {
  title: string
  body: string
  category?: string
}

export interface UpdateArticlePayload {
  title: string
  body: string
  category: string
  photo_object_key?: string | null
}

export const articleApi = {
  listEndpoint: BASE,

  async detail(id: string): Promise<AdminArticle> {
    const { data } = await http.get<ApiResponse<AdminArticle>>(`${BASE}/${id}`)
    return data.data
  },

  async create(payload: CreateArticlePayload): Promise<AdminArticle> {
    const { data } = await http.post<ApiResponse<AdminArticle>>(BASE, payload)
    return data.data
  },

  async update(id: string, payload: UpdateArticlePayload): Promise<AdminArticle> {
    const { data } = await http.patch<ApiResponse<AdminArticle>>(`${BASE}/${id}`, payload)
    return data.data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`${BASE}/${id}`)
  },

  async photoUpload(file: File): Promise<UploadPermission> {
    const { data } = await http.post<ApiResponse<UploadPermission>>(`${BASE}/photo-upload`, {
      mime: file.type,
      size_bytes: file.size,
    })
    return data.data
  },
}
