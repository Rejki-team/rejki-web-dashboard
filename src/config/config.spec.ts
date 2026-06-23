import { describe, it, expect } from 'vitest'
import { config } from './index'

describe('config', () => {
  it('mengembalikan nilai default saat env tidak diset', () => {
    expect(config.apiBaseUrl).toBe('/api/v1')
    expect(config.maxEvidenceBytes).toBe(5 * 1024 * 1024)
  })
})
