// Layanan API auth — GROUNDED pada endpoint backend nyata:
//   POST /auth/admin/login   (AdminLoginDocRequest → LoginDocResponse)
//   POST /auth/refresh        (RefreshDocRequest → LoginDocResponse)
//   POST /auth/logout         (204)
//   GET  /users/me            (UserProfileDocResponse)

import { http } from './http'
import type { ApiResponse } from '@/types/api'
import type { LoginResponse, UserProfile } from '@/types/auth'

export const authApi = {
  async adminLogin(email: string, password: string): Promise<LoginResponse> {
    const { data } = await http.post<ApiResponse<LoginResponse>>('/auth/admin/login', {
      email,
      password,
    })
    return data.data
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const { data } = await http.post<ApiResponse<LoginResponse>>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data.data
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout')
  },

  async me(): Promise<UserProfile> {
    const { data } = await http.get<ApiResponse<UserProfile>>('/users/me')
    return data.data
  },
}
