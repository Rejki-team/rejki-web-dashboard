// Utilitas format tampilan (terpusat — Zero Hardcoded format tersebar).

/** Format angka sebagai Rupiah. Null/undefined → '-'. */
export function formatRupiah(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Rentang tarif/gaji (min–max). */
export function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return '-'
  if (min != null && max != null) return `${formatRupiah(min)} – ${formatRupiah(max)}`
  return formatRupiah(min ?? max)
}

/** Format tanggal ISO → dd MMM yyyy (id-ID). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Format tanggal+waktu ISO. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Potong teks panjang dengan elipsis. */
export function truncate(text: string | null | undefined, max = 60): string {
  if (!text) return '-'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** Potong ID UUID menjadi 8 karakter pertama untuk tampilan ringkas. */
export function shortId(id: string): string {
  return id.slice(0, 8)
}
