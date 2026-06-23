<script setup lang="ts">
// Layout dashboard (Task 3.1): sidebar kiri + header atas + konten (router-view).
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebar = useSidebarStore()

// Default: tertutup di mobile, terbuka di desktop.
onMounted(() => {
  sidebar.setOpen(window.matchMedia('(min-width: 1024px)').matches)
})
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <AppSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />
      <main class="flex-1 p-4 lg:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
