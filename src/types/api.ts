// Tipe envelope API — GROUNDED pada backend (common/errors/src/lib.rs).
//
// Sukses:  { success: true, data: T, meta?: PaginatedMeta, request_id: string }
// Error:   { error: "CODE", message: string }            (ErrorBody)
//
// CATATAN: backend TIDAK memakai RFC 9457; bentuk error nyata adalah { error, message }.

/** Meta paginasi dari `common_errors::PaginatedMeta`. */
export interface PaginatedMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Envelope sukses standar. */
export interface ApiResponse<T> {
  success: true
  data: T
  meta?: PaginatedMeta
  request_id: string
}

/** Bentuk body error dari backend (ErrorBody). */
export interface ApiErrorBody {
  error: string
  message: string
}

/** Kode error mesin yang dipakai backend (AppError → kode). */
export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'GONE'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'PARSE_ERROR'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'ACCOUNT_NOT_ADMIN'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
