import { describe, it, expect } from 'vitest'
import { decodeClaims, isTokenExpired, roleFromToken } from './jwt'
import { makeJwt } from '@/test/helpers'

describe('utils/jwt', () => {
  describe('decodeClaims', () => {
    it('mendekode klaim dari token valid', () => {
      const token = makeJwt({ role: 'admin', email: 'a@b.id' })
      const claims = decodeClaims(token)
      expect(claims?.role).toBe('admin')
      expect(claims?.email).toBe('a@b.id')
    })

    it('mengembalikan null untuk token tidak valid', () => {
      expect(decodeClaims('bukan.token')).toBeNull()
      expect(decodeClaims('')).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('false untuk token yang masih berlaku', () => {
      expect(isTokenExpired(makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }))).toBe(false)
    })

    it('true untuk token yang sudah kedaluwarsa', () => {
      expect(isTokenExpired(makeJwt({ exp: Math.floor(Date.now() / 1000) - 10 }))).toBe(true)
    })

    it('true (fail-safe) untuk token tidak valid', () => {
      expect(isTokenExpired('invalid')).toBe(true)
    })

    it('menghormati skew: token yang berakhir dalam skew dianggap expired', () => {
      const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 10 })
      expect(isTokenExpired(token, 30)).toBe(true)
      expect(isTokenExpired(token, 0)).toBe(false)
    })
  })

  describe('roleFromToken', () => {
    it('mengembalikan role dari token', () => {
      expect(roleFromToken(makeJwt({ role: 'user' }))).toBe('user')
    })
    it('mengembalikan null untuk token invalid', () => {
      expect(roleFromToken('x')).toBeNull()
    })
  })
})
