// Helper mount halaman: stub HANYA Headless UI (BaseModal → render slot inline) +
// RouterLink. Sisanya (BaseButton, BaseIcon, StatusBadge, ServerTable) tetap asli
// agar logika halaman teruji penuh. Ini memberi coverage nyata pada template + logic.
import { h, defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

/** BaseModal stub: render slot default + footer SELALU (abaikan open/Dialog). */
const BaseModalStub = defineComponent({
  props: { open: Boolean, title: String, size: String },
  emits: ['update:open'],
  setup(props, { slots }) {
    if (!props.open) return () => null
    return () =>
      h('div', { class: 'modal-open' }, [
        h('div', { class: 'modal-title' }, slots.title?.() ?? props.title),
        h('div', { class: 'modal-body' }, slots.default?.()),
        slots.footer ? h('div', { class: 'modal-footer' }, slots.footer()) : null,
      ])
  },
})

/** PopupFoto stub: render bila open. */
const PopupFotoStub = defineComponent({
  props: { open: Boolean, urls: Array, title: String },
  emits: ['update:open'],
  setup(props) {
    if (!props.open) return () => null
    return () =>
      h(
        'div',
        { class: 'popup-open' },
        (props.urls as string[])?.map((u) => h('img', { src: u, key: u })),
      )
  },
})

export const pageStubs = {
  BaseModal: BaseModalStub,
  PopupFoto: PopupFotoStub,
  RouterLink,
}
