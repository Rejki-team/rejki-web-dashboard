<script setup lang="ts">
// Tombol reusable dengan varian warna (tema brand/accent) + state loading & disabled.
// Warna mengacu token tema (Zero Hardcoded hex).
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', loading: false, disabled: false, type: 'button' },
)

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-400',
  secondary: 'bg-accent-500 text-white hover:bg-accent-600 focus-visible:ring-accent-300',
  danger: 'bg-danger-500 text-white hover:opacity-90 focus-visible:ring-red-300',
  success: 'bg-success-500 text-white hover:opacity-90 focus-visible:ring-green-300',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50 border border-brand-200',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

const classes = computed(
  () =>
    `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ` +
    `disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[props.variant]} ${SIZES[props.size]}`,
)
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <svg
      v-if="loading"
      class="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
