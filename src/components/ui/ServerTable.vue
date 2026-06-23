<script setup lang="ts" generic="T extends { id: string }">
// Tabel server-side reusable (Task 4.2).
// Fitur: search input, dropdown filter status, dropdown sort, skeleton, error/empty state,
// paginasi adaptif (mobile: Prev/Next; desktop: nomor halaman), slot kolom kustom,
// opsi kolom bulk-select (checkbox).
//
// Generic <T> mensyaratkan baris memiliki `id` (untuk key & bulk-select).
import { computed } from 'vue'
import type { TableColumn, FilterOption, SortOption } from '@/types/table'
import type { UseServerTable } from '@/composables/useServerTable'
import BaseIcon from './BaseIcon.vue'
import SkeletonTable from './SkeletonTable.vue'

const props = withDefaults(
  defineProps<{
    table: UseServerTable<T>
    columns: TableColumn[]
    searchPlaceholder?: string
    filterOptions?: FilterOption[]
    sortOptions?: SortOption[]
    /** Aktifkan kolom checkbox bulk-select. */
    selectable?: boolean
    /** Set id terpilih (v-model). */
    selected?: string[]
  }>(),
  { searchPlaceholder: 'Cari...', filterOptions: () => [], sortOptions: () => [], selectable: false, selected: () => [] },
)

const emit = defineEmits<{ 'update:selected': [string[]] }>()

const t = props.table

const allChecked = computed(
  () => t.data.value.length > 0 && props.selected.length === t.data.value.length,
)
const someChecked = computed(
  () => props.selected.length > 0 && props.selected.length < t.data.value.length,
)

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  emit('update:selected', checked ? t.data.value.map((r) => r.id) : [])
}

function toggleRow(id: string) {
  const set = new Set(props.selected)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  emit('update:selected', [...set])
}

function onSortChange(e: Event) {
  const idx = (e.target as HTMLSelectElement).value
  const opt = props.sortOptions?.[Number(idx)]
  if (opt) t.setSort(opt.sortBy, opt.sortDir)
}

const colCount = computed(() => props.columns.length + (props.selectable ? 1 : 0))

// Nomor halaman ringkas untuk desktop.
const pageNumbers = computed(() => {
  const { page, totalPages } = t.pagination
  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar: search + filter + sort + slot aksi (export, dll) -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-0 flex-1">
        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <BaseIcon name="search" :size="18" />
        </span>
        <input
          v-model="t.search.value"
          type="search"
          :placeholder="searchPlaceholder"
          class="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-brand-500"
        />
      </div>

      <select
        v-if="filterOptions?.length"
        :value="t.status.value"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
        aria-label="Filter status"
        @change="t.setStatus(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="f in filterOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>

      <select
        v-if="sortOptions?.length"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
        aria-label="Urutkan"
        @change="onSortChange"
      >
        <option v-for="(s, i) in sortOptions" :key="i" :value="i">{{ s.label }}</option>
      </select>

      <slot name="actions" />
    </div>

    <!-- Skeleton saat initial load -->
    <SkeletonTable v-if="t.initialLoading.value" :cols="colCount" />

    <!-- Error -->
    <div
      v-else-if="t.error.value"
      class="rounded-card border border-danger-500/30 bg-danger-50 p-6 text-center"
    >
      <p class="text-sm text-danger-500">{{ t.error.value.userMessage }}</p>
      <button
        type="button"
        class="mt-3 text-sm font-medium text-brand-700 underline"
        @click="t.refresh()"
      >
        Coba lagi
      </button>
    </div>

    <!-- Tabel -->
    <div v-else class="overflow-x-auto rounded-card border border-slate-200 bg-white">
      <table class="w-full min-w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th v-if="selectable" class="w-10 px-4 py-3">
              <input
                type="checkbox"
                :checked="allChecked"
                :indeterminate="someChecked"
                aria-label="Pilih semua"
                class="size-4 rounded border-slate-300 text-brand-700"
                @change="toggleAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 font-semibold"
              :class="[
                col.hideOnMobile ? 'hidden md:table-cell' : '',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : '',
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="t.isEmpty.value">
            <td :colspan="colCount" class="px-4 py-12 text-center text-slate-400">
              Tidak ada data.
            </td>
          </tr>
          <tr
            v-for="row in t.data.value"
            v-else
            :key="row.id"
            class="border-b border-slate-50 transition hover:bg-slate-50"
          >
            <td v-if="selectable" class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selected.includes(row.id)"
                :aria-label="`Pilih baris ${row.id}`"
                class="size-4 rounded border-slate-300 text-brand-700"
                @change="toggleRow(row.id)"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-slate-700"
              :class="[
                col.hideOnMobile ? 'hidden md:table-cell' : '',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : '',
              ]"
            >
              <slot v-if="col.slot" :name="`cell-${col.key}`" :row="row" />
              <span v-else>{{ (row as Record<string, unknown>)[col.key] ?? '-' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginasi adaptif (Task 14.2) -->
    <div
      v-if="!t.initialLoading.value && !t.error.value && t.pagination.total > 0"
      class="flex items-center justify-between gap-2"
    >
      <p class="text-xs text-slate-500">
        Total {{ t.pagination.total }} data · Halaman {{ t.pagination.page }} dari
        {{ t.pagination.totalPages }}
      </p>

      <!-- Mobile: Prev/Next sederhana -->
      <div class="flex items-center gap-1 sm:hidden">
        <button
          type="button"
          class="rounded-md border border-slate-300 p-2 disabled:opacity-40"
          :disabled="t.pagination.page <= 1"
          aria-label="Sebelumnya"
          @click="t.prevPage()"
        >
          <BaseIcon name="chevron-left" :size="16" />
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 p-2 disabled:opacity-40"
          :disabled="t.pagination.page >= t.pagination.totalPages"
          aria-label="Berikutnya"
          @click="t.nextPage()"
        >
          <BaseIcon name="chevron-right" :size="16" />
        </button>
      </div>

      <!-- Desktop: nomor halaman -->
      <div class="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          class="rounded-md border border-slate-300 p-2 disabled:opacity-40"
          :disabled="t.pagination.page <= 1"
          aria-label="Sebelumnya"
          @click="t.prevPage()"
        >
          <BaseIcon name="chevron-left" :size="16" />
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          type="button"
          class="min-w-9 rounded-md border px-3 py-1.5 text-sm"
          :class="
            p === t.pagination.page
              ? 'border-brand-700 bg-brand-700 text-white'
              : 'border-slate-300 text-slate-600 hover:bg-slate-100'
          "
          @click="t.setPage(p)"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 p-2 disabled:opacity-40"
          :disabled="t.pagination.page >= t.pagination.totalPages"
          aria-label="Berikutnya"
          @click="t.nextPage()"
        >
          <BaseIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>
