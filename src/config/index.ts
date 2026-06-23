// Konfigurasi runtime terpusat (Zero Hardcoded).
// Semua nilai berasal dari env Vite; modul ini satu-satunya tempat membaca `import.meta.env`
// agar mudah diuji dan tidak ada string tersebar di seluruh basis kode.

function readNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const config = {
  /** Prefix base URL API (mis. `/api/v1`). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  /** Batas ukuran bukti unggah (byte). Default 5 MiB selaras backend. */
  maxEvidenceBytes: readNumber(import.meta.env.VITE_MAX_EVIDENCE_BYTES, 5 * 1024 * 1024),
} as const

export type AppConfig = typeof config
