<script setup lang="ts">
// Layout sub-halaman Iklan Pelatihan: tab navigasi (Daftar/Konfirmasi/Badge) + router-view.
import { RouterView } from 'vue-router'

const TABS = [
  { label: 'Daftar Pelatihan', routeName: 'pelatihan-daftar' },
  { label: 'Konfirmasi Pelatihan', routeName: 'pelatihan-konfirmasi' },
  { label: 'Badge Pelatihan', routeName: 'pelatihan-badge' },
]
</script>

<template>
  <div class="space-y-4">
    <nav class="flex gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-sm">
      <RouterLink
        v-for="tab in TABS"
        :key="tab.routeName"
        :to="{ name: tab.routeName }"
        class="whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        active-class="bg-brand-700 text-white hover:bg-brand-700"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>
