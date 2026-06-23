import { describe, it, expect } from 'vitest'
import { formatRupiah, formatRange, formatDate, formatDateTime, truncate, shortId } from './format'

describe('utils/format', () => {
  it('formatRupiah menampilkan Rp & memisah ribuan', () => {
    expect(formatRupiah(1500000)).toContain('1.500.000')
    expect(formatRupiah(null)).toBe('-')
    expect(formatRupiah(undefined)).toBe('-')
  })

  it('formatRange menangani min/max/keduanya/null', () => {
    expect(formatRange(null, null)).toBe('-')
    expect(formatRange(1000, null)).toContain('1.000')
    expect(formatRange(null, 2000)).toContain('2.000')
    const both = formatRange(1000, 2000)
    expect(both).toContain('1.000')
    expect(both).toContain('2.000')
    expect(both).toContain('–')
  })

  it('formatDate memformat ISO & menangani invalid', () => {
    expect(formatDate('2026-06-15T00:00:00Z')).toMatch(/2026/)
    expect(formatDate(null)).toBe('-')
    expect(formatDate('bukan-tanggal')).toBe('-')
  })

  it('formatDateTime menyertakan jam', () => {
    const s = formatDateTime('2026-06-15T13:45:00Z')
    expect(s).toMatch(/2026/)
    expect(formatDateTime(null)).toBe('-')
  })

  it('truncate memotong teks panjang', () => {
    expect(truncate('halo dunia', 4)).toBe('halo…')
    expect(truncate('pendek', 20)).toBe('pendek')
    expect(truncate(null)).toBe('-')
  })

  it('shortId memotong 8 karakter pertama', () => {
    expect(shortId('abcdefgh-1234-5678')).toBe('abcdefgh')
  })
})
