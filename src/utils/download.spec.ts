import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/http', () => ({ http: { get: vi.fn() } }))

import { http } from '@/api/http'
import { downloadCsv } from './download'

describe('utils/download', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET dengan responseType blob & memicu unduhan anchor', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: new Blob(['a,b']) } as never)
    const clickSpy = vi.fn()
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement
      if (tag === 'a') el.click = clickSpy
      return el
    })

    await downloadCsv('/x/admin/export.csv', { q: 'cari', status: undefined }, 'x.csv')

    expect(http.get).toHaveBeenCalledWith(
      '/x/admin/export.csv',
      expect.objectContaining({ responseType: 'blob', params: { q: 'cari', status: undefined } }),
    )
    expect(clickSpy).toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
