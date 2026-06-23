<script setup lang="ts">
// Header atas (Task 2.5): hamburger (toggle sidebar) + profil (foto/nama/role) + dropdown logout.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const auth = useAuthStore()
const sidebar = useSidebarStore()
const router = useRouter()
const toast = useToast()

const loggingOut = ref(false)

const displayName = computed(
  () => auth.user?.full_name || auth.user?.username || 'Administrator',
)
const roleLabel = computed(() => (auth.role === 'admin' ? 'Administrator' : (auth.role ?? '-')))
const initials = computed(() =>
  displayName.value
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join(''),
)

async function onLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    toast.success('Berhasil keluar.')
    await router.replace({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-6"
  >
    <button
      type="button"
      class="rounded-md p-2 text-slate-600 hover:bg-slate-100"
      aria-label="Buka/tutup menu"
      @click="sidebar.toggle()"
    >
      <BaseIcon name="menu" :size="22" />
    </button>

    <Menu as="div" class="relative">
      <MenuButton
        class="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
      >
        <img
          v-if="auth.user?.avatar"
          :src="auth.user.avatar"
          alt="Foto profil"
          class="size-9 rounded-full object-cover"
        />
        <span
          v-else
          class="flex size-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white"
        >
          {{ initials }}
        </span>
        <span class="hidden text-left sm:block">
          <span class="block text-sm font-medium text-slate-800">{{ displayName }}</span>
          <span class="block text-xs text-slate-500">{{ roleLabel }}</span>
        </span>
        <BaseIcon name="chevron-down" :size="16" class="text-slate-400" />
      </MenuButton>

      <Transition
        enter-active-class="transition duration-100"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-75"
        leave-to-class="opacity-0 scale-95"
      >
        <MenuItems
          class="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div class="border-b border-slate-100 px-4 py-2 sm:hidden">
            <p class="text-sm font-medium text-slate-800">{{ displayName }}</p>
            <p class="text-xs text-slate-500">{{ roleLabel }}</p>
          </div>
          <MenuItem v-slot="{ active }">
            <button
              type="button"
              :disabled="loggingOut"
              :class="active ? 'bg-slate-100' : ''"
              class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger-500 disabled:opacity-50"
              @click="onLogout"
            >
              <BaseIcon name="logout" :size="18" />
              Keluar
            </button>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </header>
</template>
