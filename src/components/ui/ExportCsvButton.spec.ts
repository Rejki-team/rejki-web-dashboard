import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
vi.mock('@/composables/useToast', () => ({ useToast: () => toastMock }))

import ExportCsvButton from './ExportCsvButton.vue'

describe('ExportCsvButton', () => {
  it('memanggil onExport & toast success bila berhasil', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined)
    const w = mount(ExportCsvButton, { props: { onExport } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(onExport).toHaveBeenCalled()
    expect(toastMock.success).toHaveBeenCalled()
  })

  it('menampilkan toast error bila onExport gagal', async () => {
    const onExport = vi.fn().mockRejectedValue(new Error('boom'))
    const w = mount(ExportCsvButton, { props: { onExport } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(toastMock.error).toHaveBeenCalled()
  })
})
