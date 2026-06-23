// Utilitas unduh blob (CSV export). Endpoint backend butuh Bearer token, sehingga
// unduhan dilakukan via http client (bukan <a href> langsung) lalu di-trigger sebagai blob.
import { http } from '@/api/http'

/**
 * Unduh CSV dari endpoint admin dengan query filter aktif.
 * @param path  path relatif terhadap baseURL (mis. `/pekerja/admin/export.csv`)
 * @param params query (q, status, ...)
 * @param filename nama berkas hasil unduhan
 */
export async function downloadCsv(
  path: string,
  params: Record<string, string | undefined>,
  filename: string,
): Promise<void> {
  const res = await http.get(path, {
    params,
    responseType: 'blob',
    headers: { Accept: 'text/csv' },
  })
  const blob = new Blob([res.data as BlobPart], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
