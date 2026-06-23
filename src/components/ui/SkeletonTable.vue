<script setup lang="ts">
// Skeleton loader tabel (Task 4.9) — ditampilkan saat initial load.
withDefaults(defineProps<{ rows?: number; cols?: number }>(), { rows: 6, cols: 5 })
</script>

<template>
  <div class="overflow-hidden rounded-card border border-slate-200 bg-white">
    <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div class="h-4 w-32 animate-pulse rounded bg-slate-200" />
    </div>
    <div v-for="r in rows" :key="r" class="flex gap-4 border-b border-slate-50 px-4 py-3">
      <div
        v-for="c in cols"
        :key="c"
        class="h-4 flex-1 animate-pulse rounded bg-slate-100"
        :style="{ animationDelay: `${(r + c) * 30}ms` }"
      />
    </div>
  </div>
</template>
