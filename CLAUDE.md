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
bun run dev                     # Dev server
bun run build                   # Production build
bun test                        # Run tests (Vitest)
bun run lint                    # ESLint
```
