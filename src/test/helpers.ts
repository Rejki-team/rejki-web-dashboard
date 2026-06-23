// Helper test: bangun JWT palsu (header.payload.signature) untuk menguji decode/expiry.
// Hanya payload yang di-decode oleh jwt-decode (signature diabaikan klien).

function base64url(obj: unknown): string {
  const json = JSON.stringify(obj)
  // btoa tersedia di jsdom.
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface FakeClaims {
  sub?: string
  email?: string
  status?: string
  role?: string
  iat?: number
  exp?: number
}

/** Bangun token JWT dengan klaim tertentu. `exp` relatif: default +1 jam dari now. */
export function makeJwt(claims: FakeClaims = {}): string {
  const nowSec = Math.floor(Date.now() / 1000)
  const payload = {
    sub: claims.sub ?? '00000000-0000-0000-0000-000000000001',
    email: claims.email ?? 'admin@rejki.id',
    status: claims.status ?? 'active',
    role: claims.role ?? 'admin',
    iat: claims.iat ?? nowSec,
    exp: claims.exp ?? nowSec + 3600,
  }
  const header = base64url({ alg: 'RS256', typ: 'JWT' })
  return `${header}.${base64url(payload)}.signature`
}
