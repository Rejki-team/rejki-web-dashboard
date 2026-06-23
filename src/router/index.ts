// Vue Router 4 — nested routes + guard (Task 2.4, 3.4).
// Struktur grounded pada design D6.
//
// Guard global `beforeEach`:
//  - rute publik (login) selalu boleh.
//  - rute dashboard butuh auth: tanpa token valid → coba refresh → bila gagal /login.
//  - butuh role admin: non-admin → toast + redirect /login.

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: { name: 'pekerja' } },
      { path: 'pekerja', name: 'pekerja', component: () => import('@/views/IklanPekerjaPage.vue') },
      {
        path: 'pekerjaan',
        name: 'pekerjaan',
        component: () => import('@/views/IklanPekerjaanPage.vue'),
      },
      {
        path: 'pelatihan',
        component: () => import('@/layouts/PelatihanLayout.vue'),
        children: [
          { path: '', redirect: { name: 'pelatihan-daftar' } },
          {
            path: 'daftar',
            name: 'pelatihan-daftar',
            component: () => import('@/views/DaftarPelatihanPage.vue'),
          },
          {
            path: 'konfirmasi',
            name: 'pelatihan-konfirmasi',
            component: () => import('@/views/KonfirmasiPelatihanPage.vue'),
          },
          {
            path: 'badge',
            name: 'pelatihan-badge',
            component: () => import('@/views/BadgePelatihanPage.vue'),
          },
        ],
      },
      {
        path: 'barang-bekas',
        name: 'barang-bekas',
        component: () => import('@/views/BarangBekasPage.vue'),
      },
      {
        path: 'pengguna',
        name: 'pengguna',
        component: () => import('@/views/PengelolaanPenggunaPage.vue'),
      },
      {
        path: 'dukungan',
        name: 'dukungan',
        component: () => import('@/views/PengelolaanDukunganPage.vue'),
      },
      {
        path: 'corporate-communication',
        name: 'corporate-communication',
        component: () => import('@/views/CorporateCommunicationPage.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const toast = useToast()

  if (to.meta.public) {
    // Sudah login & buka /login → arahkan ke dashboard.
    if (to.name === 'login' && auth.isAuthenticated && auth.isAdmin) {
      return { name: 'pekerja' }
    }
    return true
  }

  if (to.meta.requiresAuth) {
    // Tanpa access token valid → coba refresh dulu (token expired → refresh → retry).
    if (!auth.isAuthenticated) {
      const refreshed = auth.refreshToken ? await auth.refresh() : null
      if (!refreshed) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    }
    // Pastikan profil termuat (untuk header) — non-fatal bila gagal.
    if (!auth.user) {
      try {
        await auth.fetchProfile()
      } catch {
        /* diabaikan; guard role di bawah tetap berjalan dari klaim token */
      }
    }
    if (to.meta.requiresAdmin && !auth.isAdmin) {
      toast.error('Akses ditolak: memerlukan peran admin.')
      auth.clearSession()
      return { name: 'login' }
    }
  }

  return true
})
