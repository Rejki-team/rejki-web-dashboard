# Rejki Web Dashboard

Panel administrasi **Rejki** — SPA Vue 3 + TypeScript + Tailwind CSS v4 untuk moderasi iklan,
verifikasi pengguna, pengelolaan pelatihan, aduan, dan corporate communication.

## Tech Stack

| Teknologi   | Versi           | Keterangan                                 |
|-------------|-----------------|---------------------------------------------|
| Vue 3       | ^3.5            | Composition API + `<script setup lang="ts">` |
| TypeScript  | ~6.0            | strict mode                                 |
| Vite        | ^8.0            | dev/bundler                                  |
| Bun         | >=1.3.0         | runtime & package manager                    |
| Tailwind    | ^4.3            | CSS utility-first (plugin Vite)             |
| Pinia       | ^3.0            | state management                             |
| Vue Router  | ^4.6            | nested routes + guard                        |
| Axios       | ^1.18           | HTTP client + interceptor                    |
| Headless UI | ^1.7            | dialog, menu aksesibel                       |
| Vitest      | ^4.1            | unit test (jsdom)                             |

## Prasyarat

- **Bun** ≥1.3.0 ([bun.sh](https://bun.sh))
- **Backend Rejki** berjalan di `http://localhost:8080` (lihat [rejki-backend](../../rejki-backend/))

## Mulai Cepat

```bash
# 1. Install dependensi
bun install

# 2. Salin env development (opsional — default sudah benar)
cp .env.example .env.local

# 3. Jalankan dev server (Vite proxy ke backend lokal)
bun run dev

# 4. Buka http://localhost:5173 → login dengan akun admin
```

## Script

| Perintah               | Deskripsi                                    |
|------------------------|----------------------------------------------|
| `bun run dev`          | Dev server Vite (hot-reload)                  |
| `bun run build`        | Type-check + build produksi ke `dist/`        |
| `bun run preview`      | Lihat hasil build lokal                       |
| `bun test`             | Jalankan 117 unit/integration test (Vitest)   |
| `bun run test:coverage`| Test + laporan coverage                       |
| `bun run lint`         | ESLint auto-fix                               |
| `bun run format`       | Prettier format `src/`                        |
| `bun run typecheck`    | vue-tsc type-check saja                       |

## Arsitektur

```
src/
├── api/                # Modul HTTP + interceptor + service per-domain
│   ├── http.ts         # Axios instance + auth bridge + refresh queue
│   ├── errors.ts       # Normalisasi error backend → AppApiError
│   ├── authApi.ts      # POST /auth/admin/login, refresh, logout, GET /users/me
│   ├── iklanApi.ts     # GET/POST /pekerja|pekerjaan|barang/admin/*
│   ├── pelatihanApi.ts # GET/POST/PATCH/DELETE /pelatihan/admin/*
│   ├── penggunaApi.ts  # GET/POST /users/admin/kyc/*, /auth/admin/users/*
│   ├── reportApi.ts    # GET/POST /reports/admin/*
│   └── articleApi.ts   # CRUD /admin/articles + photo-upload
├── assets/
│   └── main.css        # Tailwind v4 + @theme (brand dark blue + accent cerah)
├── components/
│   ├── layout/         # AppHeader, AppSidebar
│   └── ui/             # BaseButton, BaseModal, ServerTable, StatusBadge, MaskedValue,
│                       # PopupFoto, ModalConfirm, BulkSelectActionBar, ExportCsvButton,
│                       # SkeletonTable, ToastContainer, PageHeader, BaseIcon
├── composables/
│   ├── useServerTable.ts # Abstraksi tabel server-side (pagination/search/sort/export)
│   ├── useSuspendIklan.ts# Alur suspend + unggah bukti (dipakai 3 vertikal iklan)
│   └── useToast.ts       # Notifikasi transient global
├── config/
│   ├── index.ts         # Konfigurasi runtime dari env (Zero Hardcoded)
│   └── menu.ts          # Definisi menu sidebar (7 item + 3 sub-menu pelatihan)
├── layouts/
│   ├── DashboardLayout.vue  # Sidebar + Header + <RouterView>
│   └── PelatihanLayout.vue  # Tab sub-menu pelatihan
├── router/
│   └── index.ts         # Vue Router + guard auth & role admin
├── stores/
│   ├── auth.ts          # Pinia auth (token, user, role, login, refresh, logout)
│   └── sidebar.ts       # State sidebar (open/close)
├── types/               # Kontrak tipe grounded pada DTO backend & OpenAPI
│   ├── api.ts           # ApiResponse<T>, PaginatedMeta, error
│   ├── auth.ts          # LoginResponse, JwtClaims, UserProfile
│   ├── domain.ts        # AdminIklanPekerja, AdminPelatihan, AdminArticle, dll.
│   └── table.ts         # TableColumn, FilterOption, SortOption
├── utils/
│   ├── jwt.ts           # Decode JWT klien (role, exp), isTokenExpired
│   ├── tokenStorage.ts  # Abstraksi localStorage token
│   ├── format.ts        # Rupiah, tanggal, truncate, shortId
│   ├── debounce.ts      # Debounce dengan cancel
│   ├── upload.ts        # Validasi + unggah bukti via presigned URL
│   └── download.ts      # Unggah CSV via blob
├── views/               # Satu view per halaman dashboard
│   ├── LoginPage.vue
│   ├── IklanPekerjaPage.vue
│   ├── IklanPekerjaanPage.vue
│   ├── DaftarPelatihanPage.vue
│   ├── KonfirmasiPelatihanPage.vue
│   ├── BadgePelatihanPage.vue
│   ├── BarangBekasPage.vue
│   ├── PengelolaanPenggunaPage.vue
│   ├── PengelolaanDukunganPage.vue
│   └── CorporateCommunicationPage.vue
├── test/
│   ├── setup.ts         # Vitest global setup (jsdom stubs)
│   └── helpers.ts       # makeJwt() builder
├── App.vue              # Root: <RouterView> + <ToastContainer>
└── main.ts              # Entry: Pinia → auth bootstrap → Router → mount
```

## Kontrak API (Backend)

Seluruh path endpoint dig Round pada kode backend nyata (`rejki-app/src/main.rs` dan
`*-service/src/interface/mod.rs`), **bukan** asumsi proposal. Ringkasan:

| Modul               | Mount Point                   | Admin Routes                                          |
|---------------------|-------------------------------|-------------------------------------------------------|
| Auth                | `/api/v1/auth`                | `/admin/login`, `/refresh`, `/logout`, `/admin/users/suspend` |
| Pekerja             | `/api/v1/pekerja`             | `/admin`, `/admin/export.csv`, `/admin/suspend`       |
| Pekerjaan           | `/api/v1/pekerjaan`           | `/admin`, `/admin/export.csv`, `/admin/suspend`       |
| Barang Bekas        | `/api/v1/barang`              | `/admin`, `/admin/export.csv`, `/admin/suspend`       |
| Pelatihan           | `/api/v1/pelatihan`           | `/admin/pelatihan`, `/admin/enrollments`, `/admin/badges` |
| Pengguna (KYC)      | `/api/v1/users`               | `/admin/kyc`, `/admin/kyc/{id}/review`, `/admin/kyc/{id}/documents/{kind}` |
| Dukungan (Reports)  | `/api/v1/reports`             | `/admin`, `/admin/{id}/review`                        |
| Corporate Comms     | `/api/v1/admin/articles`      | CRUD + `/photo-upload`                                |

Envelope sukses: `{ success, data, meta?, request_id }`.  
Envelope error: `{ error: CODE, message }`.

## Testing

117 unit test mencakup:

- **Utils**: jwt decode/expiry, format, debounce, tokenStorage, download, upload validation
- **API**: error normalization, auth HTTP interceptor (refresh queue), semua API service module endpoint & payload
- **Store**: auth (login/refresh/logout/clear), sidebar
- **Composables**: useServerTable (pagination/search/sort/error/export), useSuspendIklan (upload→suspend), useToast
- **Components**: BaseButton, BaseIcon, StatusBadge, PageHeader, MaskedValue (text/image audit click-to-view), ModalConfirm (validation logic), ServerTable (skeleton/error/empty/selection), BulkSelectActionBar, ExportCsvButton
- **Views**: LoginPage (auth flow, anti-bypass admin, error messages)

## Development Guide

1. **Tambahkan halaman baru**: daftarkan di `config/menu.ts` + `router/index.ts`, buat view di `views/`.
2. **Kolom tabel**: definisikan di `types/table.ts` sebagai `TableColumn[]`. Gunakan slot untuk render kustom.
3. **API baru**: buat modul di `api/`, gunakan `http` instance (sudah ada interceptor auth).
4. **Warna**: pakai utility Tailwind v4 dengan token tema di `assets/main.css` (`brand-*`, `accent-*`, `success-*`, `danger-*`). Jangan hardcode hex.
5. **Error**: selalu tangkap dengan `normalizeError(err)` dari `api/errors.ts` untuk pesan ramah pengguna.

## Konfigurasi Env

| Variabel               | Default               | Keterangan                                  |
|------------------------|-----------------------|---------------------------------------------|
| `VITE_API_BASE_URL`    | `/api/v1`             | Prefix base URL API yang dipanggil klien     |
| `VITE_API_TARGET`      | `http://localhost:8080`| Target backend untuk Vite dev proxy         |
| `VITE_MAX_EVIDENCE_BYTES`| `5242880` (5 MiB)   | Batas ukuran unggah bukti                   |
