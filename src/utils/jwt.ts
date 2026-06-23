// Utilitas decode JWT di sisi klien.
// CATATAN KEAMANAN: decode di klien HANYA untuk membaca klaim (role/exp) demi UX
// (route guard, auto-refresh). Validasi tanda tangan TETAP di server (RS256).

import { jwtDecode } from 'jwt-decode'
import type { JwtClaims } from '@/types/auth'

/** Decode klaim access token. Mengembalikan null bila token tidak valid. */
export function decodeClaims(token: string): JwtClaims | null {
  try {
    return jwtDecode<JwtClaims>(token)
  } catch {
    return null
  }
}

/**
 * Apakah token sudah/akan kedaluwarsa dalam `skewSeconds` detik ke depan.
 * Token tanpa `exp` atau tidak valid dianggap kedaluwarsa (fail-safe).
 */
export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const claims = decodeClaims(token)
  if (!claims?.exp) return true
  const nowSec = Date.now() / 1000
  return claims.exp <= nowSec + skewSeconds
}

/** Ambil role dari token (mis. "admin"). */
export function roleFromToken(token: string): string | null {
  return decodeClaims(token)?.role ?? null
}
