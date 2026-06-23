import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ModalConfirm from './ModalConfirm.vue'

// Stub BaseModal (yang membungkus Headless UI Dialog — bermasalah di jsdom) dengan
// wrapper sederhana yang merender slot default + footer. Ini mengisolasi LOGIKA VALIDASI
// ModalConfirm dari mesin Dialog, sesuai praktik unit test komponen.
const BaseModalStub = defineComponent({
  props: { open: Boolean, title: String, size: String },
  emits: ['update:open'],
  setup(_, { slots }) {
    return () =>
      h('div', { class: 'modal-stub' }, [
        slots.default?.(),
        slots.footer ? h('div', { class: 'footer' }, slots.footer()) : null,
      ])
  },
})

function mountModal(props: Record<string, unknown>) {
  return mount(ModalConfirm, {
    props: { open: true, title: 'Konfirmasi', ...props },
    global: { stubs: { BaseModal: BaseModalStub } },
  })
}

function clickConfirm(w: ReturnType<typeof mountModal>, label: string) {
  const btn = w.findAll('button').find((b) => b.text().includes(label))
  return btn?.trigger('click')
}

describe('ModalConfirm', () => {
  it('emit confirm tanpa syarat saat tidak ada validasi', async () => {
    const w = mountModal({ confirmLabel: 'Konfirmasi' })
    await clickConfirm(w, 'Konfirmasi')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('tidak emit confirm bila alasan wajib kosong', async () => {
    const w = mountModal({ requireReason: true, reasonMinLength: 10, confirmLabel: 'Suspend' })
    await clickConfirm(w, 'Suspend')
    expect(w.emitted('confirm')).toBeFalsy()
    expect(w.text()).toContain('wajib diisi')
  })

  it('tidak emit confirm bila alasan lebih pendek dari minimum', async () => {
    const w = mountModal({ requireReason: true, reasonMinLength: 10, confirmLabel: 'Suspend' })
    await w.find('textarea').setValue('pendek')
    await clickConfirm(w, 'Suspend')
    expect(w.emitted('confirm')).toBeFalsy()
    expect(w.text()).toContain('minimal 10')
  })

  it('emit confirm dengan payload saat alasan valid', async () => {
    const w = mountModal({ requireReason: true, reasonMinLength: 3, confirmLabel: 'Kirim' })
    await w.find('textarea').setValue('alasan cukup panjang')
    await clickConfirm(w, 'Kirim')
    const events = w.emitted('confirm')
    expect(events).toBeTruthy()
    expect((events![0][0] as { reason: string }).reason).toBe('alasan cukup panjang')
  })

  it('menolak confirm bila bukti wajib tapi belum diunggah', async () => {
    const w = mountModal({ requireEvidence: true, confirmLabel: 'Lanjut' })
    await clickConfirm(w, 'Lanjut')
    expect(w.emitted('confirm')).toBeFalsy()
  })

  it('payload menyertakan permanent dari radio', async () => {
    const w = mountModal({ showPermanent: true, confirmLabel: 'OK' })
    const radios = w.findAll('input[type="radio"]')
    await radios[1].setValue() // pilih "Permanen" (value true)
    await clickConfirm(w, 'OK')
    const events = w.emitted('confirm')
    expect((events![0][0] as { permanent: boolean }).permanent).toBe(true)
  })

  it('emit update:open(false) saat Batalkan ditekan', async () => {
    const w = mountModal({ confirmLabel: 'OK' })
    await clickConfirm(w, 'Batalkan')
    expect(w.emitted('update:open')).toBeTruthy()
    expect(w.emitted('update:open')![0]).toEqual([false])
  })
})
