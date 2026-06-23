<script setup lang="ts">
// Halaman login admin (Task 2.3).
// Form email+password → authStore.login → redirect ke tujuan (query.redirect) atau dashboard.
// Error handling: pesan generik (tidak membocorkan detail akun — spec dashboard-auth).
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { AppApiError } from '@/api/errors'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    if (!auth.isAdmin) {
      // Token valid tapi bukan admin → tolak (anti bypass).
      auth.clearSession()
      errorMsg.value = 'Akun ini tidak memiliki akses admin.'
      return
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    // Pesan generik untuk kredensial; pakai userMessage untuk error lain (jaringan dll).
    if (err instanceof AppApiError && (err.status === 401 || err.code === 'VALIDATION_ERROR')) {
      errorMsg.value = 'Email atau kata sandi salah.'
    } else if (err instanceof AppApiError) {
      errorMsg.value = err.userMessage
    } else {
      errorMsg.value = 'Gagal masuk. Coba lagi.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4"
  >
    <div class="w-full max-w-md rounded-card bg-white p-8 shadow-2xl">
      <div class="mb-6 text-center">
        <div
          class="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-700 text-white"
        >
          <BaseIcon name="briefcase" :size="28" />
        </div>
        <h1 class="text-2xl font-bold text-brand-900">Rejki Dashboard</h1>
        <p class="mt-1 text-sm text-slate-500">Masuk sebagai administrator</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500"
            placeholder="admin@rejki.id"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-slate-700">
            Kata Sandi
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-brand-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              @click="showPassword = !showPassword"
            >
              <BaseIcon :name="showPassword ? 'lock' : 'eye'" :size="18" />
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {{ errorMsg }}
        </p>

        <BaseButton type="submit" variant="primary" :loading="loading" class="w-full">
          Masuk
        </BaseButton>
      </form>
    </div>
  </div>
</template>
