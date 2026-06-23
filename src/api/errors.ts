// Normalisasi error API menjadi bentuk yang konsisten untuk UI (best-practice error handling).
// GROUNDED: backend mengirim ErrorBody { error: CODE, message } (lihat common/errors).

import { AxiosError } from 'axios'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'

/** Error aplikasi yang sudah dinormalisasi — dipakai di seluruh UI. */
export class AppApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  /** Pesan ramah pengguna (bahasa Indonesia). */
  readonly userMessage: string

  constructor(code: ApiErrorCode, status: number, message: string, userMessage: string) {
    super(message)
    this.name = 'AppApiError'
    this.code = code
    this.status = status
    this.userMessage = userMessage
  }
}

const USER_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  NOT_FOUND: 'Data tidak ditemukan.',
  GONE: 'Data sudah tidak tersedia.',
  UNAUTHORIZED: 'Sesi Anda berakhir. Silakan masuk kembali.',
  VALIDATION_ERROR: 'Data yang dikirim tidak valid.',
  PARSE_ERROR: 'Format data tidak dapat diproses.',
  CONFLICT: 'Aksi tidak dapat dilakukan karena status sudah berubah.',
  FORBIDDEN: 'Anda tidak memiliki izin untuk aksi ini.',
  ACCOUNT_NOT_ACTIVE: 'Akun belum aktif.',
  ACCOUNT_NOT_ADMIN: 'Akses admin diperlukan.',
  INTERNAL_ERROR: 'Terjadi kesalahan pada server. Coba lagi nanti.',
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
  UNKNOWN: 'Terjadi kesalahan tak terduga.',
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ApiErrorBody).error === 'string' &&
    typeof (data as ApiErrorBody).message === 'string'
  )
}

/** Ubah error apa pun (Axios/biasa) menjadi `AppApiError` yang konsisten. */
export function normalizeError(err: unknown): AppApiError {
  if (err instanceof AppApiError) return err

  if (err instanceof AxiosError) {
    // Tidak ada respons → masalah jaringan/timeout.
    if (!err.response) {
      return new AppApiError('NETWORK_ERROR', 0, err.message, USER_MESSAGES.NETWORK_ERROR!)
    }
    const status = err.response.status
    const body = err.response.data
    if (isApiErrorBody(body)) {
      const code = (body.error as ApiErrorCode) ?? 'UNKNOWN'
      return new AppApiError(code, status, body.message, USER_MESSAGES[code] ?? body.message)
    }
    return new AppApiError('UNKNOWN', status, err.message, USER_MESSAGES.UNKNOWN!)
  }

  const message = err instanceof Error ? err.message : String(err)
  return new AppApiError('UNKNOWN', 0, message, USER_MESSAGES.UNKNOWN!)
}
