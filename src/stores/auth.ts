// Pinia store auth (Task 2.1).
// State: accessToken, refreshToken, user, role.
// Actions: login, logout, refresh, fetchProfile, bootstrap.
// Getters: isAuthenticated, isAdmin.
//
// Store memasang AuthBridge ke http client agar interceptor dapat mengambil token &
// melakukan refresh tanpa import siklik (Dependency Inversion).

import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'
import { installAuthBridge } from '@/api/http'
import { tokenStorage } from '@/utils/tokenStorage'
import { isTokenExpired, roleFromToken } from '@/utils/jwt'
import { normalizeError } from '@/api/errors'
import type { UserProfile } from '@/types/auth'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserProfile | null
  /** Role dari klaim token (sumber cepat untuk guard sebelum profil dimuat). */
  role: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: tokenStorage.getAccess(),
    refreshToken: tokenStorage.getRefresh(),
    user: null,
    role: null,
  }),

  getters: {
    isAuthenticated: (s): boolean =>
      !!s.accessToken && !isTokenExpired(s.accessToken, 0),
    isAdmin(): boolean {
      return this.role === 'admin'
    },
  },

  actions: {
    /** Inisialisasi awal: pasang bridge & pulihkan role dari token tersimpan. */
    bootstrap(): void {
      installAuthBridge({
        getAccessToken: () => this.accessToken,
        refresh: () => this.refresh(),
        onSessionExpired: () => this.clearSession(),
      })
      if (this.accessToken) {
        this.role = roleFromToken(this.accessToken)
      }
    },

    setTokens(access: string, refresh: string): void {
      this.accessToken = access
      this.refreshToken = refresh
      this.role = roleFromToken(access)
      tokenStorage.set(access, refresh)
    },

    clearSession(): void {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      this.role = null
      tokenStorage.clear()
    },

    /** Login admin: simpan token lalu muat profil. */
    async login(email: string, password: string): Promise<void> {
      try {
        const res = await authApi.adminLogin(email, password)
        this.setTokens(res.access_token, res.refresh_token)
        await this.fetchProfile()
      } catch (err) {
        this.clearSession()
        throw normalizeError(err)
      }
    },

    /** Refresh access token. Kembalikan token baru atau null bila gagal. */
    async refresh(): Promise<string | null> {
      if (!this.refreshToken) return null
      try {
        const res = await authApi.refresh(this.refreshToken)
        this.setTokens(res.access_token, res.refresh_token)
        return res.access_token
      } catch {
        this.clearSession()
        return null
      }
    },

    /** Muat profil admin (GET /users/me). */
    async fetchProfile(): Promise<void> {
      const profile = await authApi.me()
      this.user = profile
      // role dari profil lebih otoritatif bila tersedia.
      if (profile.role) this.role = profile.role
    },

    /** Logout: cabut refresh token di server lalu bersihkan sesi lokal. */
    async logout(): Promise<void> {
      try {
        await authApi.logout()
      } catch {
        // Abaikan galat server saat logout — tetap bersihkan sesi lokal.
      } finally {
        this.clearSession()
      }
    },
  },
})
