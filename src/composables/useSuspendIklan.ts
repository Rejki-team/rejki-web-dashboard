// Composable alur suspend iklan (pekerja/pekerjaan/barang).
// Mengenkapsulasi: unggah bukti (presigned) → POST suspend → ringkas hasil partial-success.
// Dipakai 3 halaman vertikal iklan agar logika tidak diduplikasi (DRY, Zero God Function).
import { ref } from 'vue'
import { iklanApi, type IklanVertical } from '@/api/iklanApi'
import { uploadEvidence } from '@/utils/upload'
import { normalizeError } from '@/api/errors'
import { useToast } from '@/composables/useToast'

export function useSuspendIklan(vertical: IklanVertical) {
  const toast = useToast()
  const submitting = ref(false)

  /**
   * Jalankan suspend untuk daftar id.
   * @returns true bila seluruh item sukses; false bila ada kegagalan/parsial.
   */
  async function suspend(
    iklanIds: string[],
    args: { reason: string; permanent: boolean; file: File | null },
  ): Promise<boolean> {
    if (iklanIds.length === 0) return false
    submitting.value = true
    try {
      if (!args.file) {
        toast.error('Bukti wajib diunggah.')
        return false
      }
      const evidenceKey = await uploadEvidence(iklanApi.evidenceEndpoint(vertical), args.file)
      const res = await iklanApi.suspend(vertical, {
        iklan_ids: iklanIds,
        is_permanent: args.permanent,
        reason: args.reason,
        evidence_object_key: evidenceKey,
      })
      const ok = res.results.filter((r) => r.success).length
      const fail = res.results.length - ok
      if (fail === 0) {
        toast.success(`${ok} iklan berhasil disuspensi.`)
        return true
      }
      toast.warning(`${ok} berhasil, ${fail} gagal disuspensi.`)
      return false
    } catch (err) {
      toast.error(normalizeError(err).userMessage)
      return false
    } finally {
      submitting.value = false
    }
  }

  return { submitting, suspend }
}
