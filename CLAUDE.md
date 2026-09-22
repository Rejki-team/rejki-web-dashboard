# CLAUDE.md — rejki-web-dashboard

Panduan kerja untuk Claude Code di repo `rejki-web-dashboard`.

> Bahasa kerja & komunikasi: **Bahasa Indonesia**.

---

## Git Flow — Aturan Ketat (WAJIB diikuti)

**Prinsip: Setiap pekerjaan = 1 branch → 1 PR → merge ke `develop`.**

Langkah-langkah WAJIB yang harus dilakukan agent untuk setiap tugas:

1. **Sync & Start:**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Buat branch baru** dari `develop`:
   ```bash
   git checkout -b feat/ws-<nama-fitur>
   ```
   - Nama branch: `feat/ws-<nama-fitur>` (kebab-case)
   - Contoh: `feat/ws-dashboard-analytics`, `feat/ws-dark-mode`

3. **Kerjakan tugas** → **Commit setelah 1 point pekerjaan selesai** (bukan bertahap per file):
   ```bash
   git add -A
   git commit -m "type: deskripsi singkat"
   ```

4. **Push + PR ke `develop`**:
   ```bash
   git push origin feat/ws-<nama-fitur>
   ```
   Kemudian buka GitHub → PR dari branch → `develop`.

5. **Setelah PR di-merge**, hapus branch lokal & remote:
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feat/ws-<nama-fitur>               # hapus lokal
   git push origin --delete feat/ws-<nama-fitur>     # hapus remote
   ```

**Aturan tambahan:**
- **Tidak menggabungkan multiple task dalam satu branch.**
- **Jangan merge sendiri** — selalu lewat PR.
- **Branch lokal & remote dihapus** setelah PR di-merge ke `develop`.

---

## Stack

| Area | Stack |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite |
| Build | Bun 1.x (lockfile: `bun.lock`) |
| Serve | nginx:alpine (multi-stage Docker) |
| API Proxy | Nginx → `rejki-app:8080` (internal) |

## Perintah Penting

```bash
bun install --frozen-lockfile   # Install dependencies
bun run dev                     # Dev server (proxy /api → VITE_API_TARGET, default localhost:8080)
bun run build                   # vue-tsc -b (type-check) && vite build
bun test                        # Semua unit/integration test (Vitest)
bunx vitest run src/path/to/File.spec.ts   # Satu file test
bun run test:coverage           # Test + laporan coverage
bun run lint                    # ESLint --fix
bun run lint:check              # ESLint tanpa fix (CI)
bun run format                  # Prettier --write src/
bun run typecheck               # vue-tsc -b --noEmit saja
```

## Arsitektur (`src/`)

```
api/          Axios service per-domain (authApi, iklanApi, pelatihanApi, penggunaApi,
              reportApi, articleApi) + http.ts (instance + interceptor refresh queue) +
              errors.ts (normalizeError → AppApiError)
components/   layout/ (AppHeader, AppSidebar) + ui/ (BaseButton, BaseModal, ServerTable,
              StatusBadge, MaskedValue, ModalConfirm, dll. — komponen reusable)
composables/  useServerTable (tabel server-side: pagination/search/sort/export),
              useSuspendIklan (upload bukti → suspend), useToast (notifikasi global)
config/       index.ts (env runtime, Zero Hardcoded), menu.ts (sidebar)
layouts/      DashboardLayout, PelatihanLayout (tab sub-menu)
router/       Vue Router + guard auth & role admin
stores/       Pinia — auth.ts (token/user/role/login/refresh/logout), sidebar.ts
types/        Kontrak tipe grounded pada DTO backend: api.ts (ApiResponse<T>), auth.ts,
              domain.ts, table.ts
utils/        jwt.ts, tokenStorage.ts, format.ts, debounce.ts, upload.ts, download.ts
views/        Satu view per halaman dashboard (LoginPage, IklanPekerjaPage, dll.)
test/         setup.ts (Vitest/jsdom global), helpers.ts (makeJwt())
```

**Alias `@` → `src/`** (jangan pakai `../../..`).

## Kontrak API Backend

Path endpoint digrounding ke kode backend nyata (`rejki-backend/rust-services/rejki-app/src/main.rs`
dan `*-service/src/interface/mod.rs`), **bukan** asumsi. Semua di bawah `/api/v1/…`.

**Tabel ini HANYA mencakup modul yang benar-benar dikonsumsi `rejki-web`** (dikonfirmasi lewat
`src/api/*.ts`) — bukan peta lengkap seluruh mount backend:

| Modul | Mount | Admin routes |
|---|---|---|
| Auth | `/auth` | `/admin/login`, `/refresh`, `/logout`, `/admin/users/suspend` |
| Pekerja/Pekerjaan/Barang | `/pekerja`, `/pekerjaan`, `/barang` | `/admin`, `/admin/export.csv`, `/admin/suspend` |
| Pelatihan | `/pelatihan` | `/admin/pelatihan`, `/admin/enrollments`, `/admin/badges` |
| Pengguna (KYC) | `/users` | `/admin/kyc`, `/admin/kyc/{id}/review`, `/admin/kyc/{id}/documents/{kind}` |
| Dukungan (Reports) | `/reports` | `/admin`, `/admin/{id}/review` |
| Corporate Comms | `/admin/articles` | CRUD + `/photo-upload` |

Envelope sukses `{ success, data, meta?, request_id }`; error `{ error: CODE, message }`.
Saat menambah/mengubah endpoint di backend, **verifikasi ulang tabel ini** dari kode nyata backend
(jangan asumsi dari dokumen ini yang bisa kedaluwarsa).

**Mount lain yang ada di backend (`rejki-app/src/main.rs`) tapi TIDAK dipakai `rejki-web` saat ini** —
dicantumkan agar tidak disangka hilang/lupa saat audit lintas-proyek:
- `/regions` (`region-service`: `/provinces`, `/regencies`, `/districts`, `/villages`) — dipakai `rejki` (mobile) untuk dropdown alamat.
- `/notif` (`notification-service`: `/`, `/send`, `/{id}/read`, dst.) — dipakai `rejki` (mobile) untuk daftar notifikasi pengguna.
- `/insights` (`insights-service`: `/users`, `/iklan`, `/geo`, `/engagement`, `/canvassing`, `/refresh`) — dipakai `rejki-ceo-mobile` untuk dashboard matriks analitik CEO, bukan `rejki-web`.

## Konvensi Kerja

1. **Halaman baru**: daftarkan di `config/menu.ts` + `router/index.ts`, buat view di `views/`.
2. **Kolom tabel**: definisikan di `types/table.ts` sebagai `TableColumn[]`; slot untuk render kustom.
3. **API baru**: modul baru di `api/`, pakai instance `http` (sudah ada interceptor auth — jangan
   buat instance axios baru).
4. **401/refresh**: `http.ts` sudah menangani refresh token dengan antrean atomik (Zero Race
   Condition) — jangan tambah logic refresh duplikat di layer lain.
5. **Warna**: pakai token tema Tailwind v4 di `assets/main.css` (`brand-*`, `accent-*`,
   `success-*`, `danger-*`). **Jangan hardcode hex.**
6. **Error**: selalu tangkap dengan `normalizeError(err)` dari `api/errors.ts`.
7. **Prinsip lintas-stack** (lihat [`../CLAUDE.md`](../CLAUDE.md)): Clean Architecture/SOLID
   konseptual, error handling aman, Zero Hardcoded, Zero Security Issue.

## Konfigurasi Env

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Prefix base URL API |
| `VITE_API_TARGET` | `http://localhost:8080` | Target backend untuk Vite dev proxy |
| `VITE_MAX_EVIDENCE_BYTES` | `5242880` (5 MiB) | Batas ukuran unggah bukti |
