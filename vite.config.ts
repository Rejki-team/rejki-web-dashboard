/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Konfigurasi Vite untuk Rejki Web Dashboard.
// - Plugin Vue 3 (`<script setup>`) + Tailwind CSS v4 (plugin Vite resmi, tanpa PostCSS terpisah).
// - Alias `@` → `src/` agar import absolut, menghindari `../../..` (Zero Hardcoded path relatif).
// - Dev proxy: `/api` → backend lokal (Task 1.4). Target di-override via env `VITE_API_TARGET`
//   sehingga TIDAK ada URL backend yang di-hardcode (Zero Hardcoded).
// - Blok `test` mengonfigurasi Vitest (jsdom) untuk unit/komponen test.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/test/**',
        'src/main.ts',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
      ],
    },
  },
})
