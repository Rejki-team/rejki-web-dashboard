<script setup lang="ts">
// Sidebar navigasi (Task 3.2, 3.3).
// - Menu vertikal + deskripsi (User Story); sub-menu Iklan Pelatihan dapat di-expand.
// - Responsif: overlay penuh di mobile (z tinggi + backdrop), sticky di desktop.
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MENU } from '@/config/menu'
import { useSidebarStore } from '@/stores/sidebar'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const sidebar = useSidebarStore()
const route = useRoute()

// Lacak menu induk yang sedang di-expand (sub-menu pelatihan).
const expanded = ref<Record<string, boolean>>({})

function toggleExpand(label: string) {
  expanded.value[label] = !expanded.value[label]
}

// Auto-expand induk bila salah satu child aktif (mis. buka /pelatihan/badge).
watch(
  () => route.name,
  () => {
    for (const item of MENU) {
      if (item.children?.some((c) => c.routeName === route.name)) {
        expanded.value[item.label] = true
      }
    }
  },
  { immediate: true },
)

function onNavigate() {
  // Di mobile, tutup sidebar setelah memilih menu.
  if (window.matchMedia('(max-width: 1023px)').matches) {
    sidebar.close()
  }
}
</script>

<template>
  <!-- Backdrop mobile -->
  <div
    v-if="sidebar.open"
    class="fixed inset-0 z-30 bg-brand-900/40 lg:hidden"
    aria-hidden="true"
    @click="sidebar.close()"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-900 text-slate-200 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
    :class="sidebar.open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
      <div class="flex size-9 items-center justify-center rounded-lg bg-accent-500 text-white">
        <BaseIcon name="briefcase" :size="20" />
      </div>
      <div>
        <p class="text-sm font-bold text-white">Rejki Dashboard</p>
        <p class="text-xs text-slate-400">Panel Administrator</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <template v-for="item in MENU" :key="item.label">
        <!-- Item dengan sub-menu -->
        <div v-if="item.children">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-white/10"
            @click="toggleExpand(item.label)"
          >
            <BaseIcon :name="item.icon" :size="20" class="shrink-0 text-accent-300" />
            <span class="flex-1">{{ item.label }}</span>
            <BaseIcon
              name="chevron-down"
              :size="16"
              class="transition-transform"
              :class="{ 'rotate-180': expanded[item.label] }"
            />
          </button>
          <div v-show="expanded[item.label]" class="ml-9 mt-1 space-y-1">
            <RouterLink
              v-for="child in item.children"
              :key="child.routeName"
              :to="{ name: child.routeName }"
              class="block rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              active-class="bg-accent-500/20 text-accent-200 font-medium"
              @click="onNavigate"
            >
              {{ child.label }}
            </RouterLink>
          </div>
        </div>

        <!-- Item daun -->
        <RouterLink
          v-else
          :to="{ name: item.routeName }"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-white/10"
          active-class="bg-accent-500/20 text-accent-200"
          :title="item.description"
          @click="onNavigate"
        >
          <BaseIcon :name="item.icon" :size="20" class="shrink-0 text-accent-300" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <p class="border-t border-white/10 px-5 py-3 text-xs text-slate-500">Rejki © 2026</p>
  </aside>
</template>
