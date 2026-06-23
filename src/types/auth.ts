// Tipe autentikasi — GROUNDED pada auth-service & openapi.rs.

/** Respons token login/refresh (LoginDocResponse). */
export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

/** Klaim JWT access token (auth-service/infrastructure/jwt.rs JwtClaims). */
export interface JwtClaims {
  sub: string
  email: string
  status: string
  role?: string
  iat: number
  exp: number
}

/** Profil pengguna (UserProfileDocResponse — GET /users/me). */
export interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar: string | null
  bio: string | null
  phone: string | null
  role: string | null
  nik_masked: string | null
  kyc_status: string | null
}

export type UserRole = 'admin' | 'user'
