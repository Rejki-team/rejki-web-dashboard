// Nama ikon yang tersedia di BaseIcon.vue — dipisah ke file .ts polos (bukan
// named type export dari SFC .vue) karena resolusi tipe lintas-SFC itu terbukti
// rapuh lintas-platform (lolos di Windows, gagal TS2614 di container Linux
// meski versi dependency identik — lihat Kelompok 5 Phase 5 P5.3).
export type IconName =
  | 'eye'
  | 'pencil'
  | 'trash'
  | 'menu'
  | 'close'
  | 'search'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'download'
  | 'logout'
  | 'check'
  | 'x-mark'
  | 'plus'
  | 'lock'
  | 'photo'
  | 'user'
  | 'briefcase'
  | 'academic'
  | 'gift'
  | 'users'
  | 'support'
  | 'megaphone'
