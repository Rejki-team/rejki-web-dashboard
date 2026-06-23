// Definisi kolom untuk ServerTable (reusable).
export interface TableColumn {
  /** Kunci field pada baris data. */
  key: string
  /** Judul kolom. */
  label: string
  /** Nama slot kustom (`cell-<key>`) bila perlu render khusus. */
  slot?: boolean
  /** Sembunyikan di layar mobile (Task 14.1 — tabel adaptif). */
  hideOnMobile?: boolean
  /** Perataan teks. */
  align?: 'left' | 'center' | 'right'
}

export interface SortOption {
  label: string
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export interface FilterOption {
  label: string
  value: string
}
