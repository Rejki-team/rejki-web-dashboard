// Definisi menu sidebar (Task 3.2) — terpusat (Zero Hardcoded tersebar).
// Selaras User Story: Iklan Pelatihan punya 3 sub-menu.
import type { IconName } from '@/components/ui/BaseIcon.vue'

export interface MenuChild {
  label: string
  routeName: string
}

export interface MenuItem {
  label: string
  /** Deskripsi singkat sesuai User Story (ditampilkan sebagai tooltip/subteks). */
  description: string
  icon: IconName
  /** Rute langsung (item daun) atau undefined bila punya children. */
  routeName?: string
  children?: MenuChild[]
}

export const MENU: MenuItem[] = [
  {
    label: 'Iklan Pekerja',
    description: 'Moderasi iklan pencari kerja',
    icon: 'user',
    routeName: 'pekerja',
  },
  {
    label: 'Iklan Pekerjaan',
    description: 'Moderasi iklan lowongan pekerjaan',
    icon: 'briefcase',
    routeName: 'pekerjaan',
  },
  {
    label: 'Iklan Pelatihan',
    description: 'Kelola pelatihan, konfirmasi, & badge',
    icon: 'academic',
    children: [
      { label: 'Daftar Pelatihan', routeName: 'pelatihan-daftar' },
      { label: 'Konfirmasi Pelatihan', routeName: 'pelatihan-konfirmasi' },
      { label: 'Badge Pelatihan', routeName: 'pelatihan-badge' },
    ],
  },
  {
    label: 'Iklan Barang Bekas Gratis',
    description: 'Moderasi iklan barang gratis',
    icon: 'gift',
    routeName: 'barang-bekas',
  },
  {
    label: 'Pengelolaan Pengguna',
    description: 'Verifikasi KYC & suspend pengguna',
    icon: 'users',
    routeName: 'pengguna',
  },
  {
    label: 'Pengelolaan Dukungan',
    description: 'Tindak lanjut aduan pengguna',
    icon: 'support',
    routeName: 'dukungan',
  },
  {
    label: 'Corporate Communication',
    description: 'Kelola artikel & broadcast',
    icon: 'megaphone',
    routeName: 'corporate-communication',
  },
]
