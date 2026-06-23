<script setup lang="ts">
// Badge status reusable. Memetakan kode status backend → label ID + warna semantik.
// Zero Hardcoded: pemetaan terpusat di sini, dipakai semua halaman.
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

interface Style {
  label: string
  cls: string
}

const MAP: Record<string, Style> = {
  pending: { label: 'Menunggu', cls: 'bg-warning-50 text-warning-500' },
  in_review: { label: 'Ditinjau', cls: 'bg-info-50 text-info-500' },
  approved: { label: 'Disetujui', cls: 'bg-success-50 text-success-500' },
  resolved: { label: 'Selesai', cls: 'bg-success-50 text-success-500' },
  rejected: { label: 'Ditolak', cls: 'bg-danger-50 text-danger-500' },
  suspended: { label: 'Disuspensi', cls: 'bg-danger-50 text-danger-500' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-slate-100 text-slate-500' },
  available: { label: 'Tersedia', cls: 'bg-success-50 text-success-500' },
  reserved: { label: 'Dipesan', cls: 'bg-warning-50 text-warning-500' },
  taken: { label: 'Diambil', cls: 'bg-slate-100 text-slate-500' },
}

const style = computed<Style>(
  () => MAP[props.status] ?? { label: props.status, cls: 'bg-slate-100 text-slate-600' },
)
</script>

<template>
  <span
    :class="style.cls"
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  >
    {{ style.label }}
  </span>
</template>
