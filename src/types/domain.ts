// Tipe domain admin — GROUNDED pada DTO backend (openapi.rs + *-service/application/dto.rs).
// Semua field selaras nama JSON yang dikirim backend (snake_case via serde default).

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

// ── Iklan Pekerja (iklan-pekerja-service AdminIklanPekerjaResponse) ─────────────
export interface AdminIklanPekerja {
  id: string
  poster_id: string
  nama: string
  keahlian: string[]
  deskripsi: string
  lokasi: string | null
  tarif_min: number | null
  tarif_max: number | null
  /** Jam kerja (F-7, Kelompok 6 P7.2). */
  jam_kerja: string | null
  /** Nomor kontak pekerja (F-7, Kelompok 6 P7.3) — kolom "Cara Hubungi" merender
   * field ini, BUKAN `lokasi` (label lama salah kaprah). */
  phone_number: string | null
  foto_urls: string[]
  is_active: boolean
  moderation_status: ModerationStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

/** Detail iklan pekerja untuk pop-up admin (F-27b) — sama seperti `AdminIklanPekerja`
 * ditambah indikator dokumen sensitif poster (NIK/KTP/Selfie), di-resolve backend
 * lewat `UserClient` ke user-service. Endpoint ini KHUSUS vertikal Iklan Pekerja. */
export interface AdminIklanPekerjaDetail extends AdminIklanPekerja {
  has_nik: boolean
  has_ktp: boolean
  has_selfie: boolean
}

// ── Iklan Pekerjaan (AdminIklanDocResponse) ─────────────────────────────────────
export interface AdminIklanPekerjaan {
  id: string
  poster_id: string
  judul: string
  perusahaan: string
  deskripsi: string
  lokasi: string | null
  gaji_min: number | null
  gaji_max: number | null
  tipe: string
  /** Jam kerja (F-5, Kelompok 6 P7.1). */
  jam_kerja: string | null
  foto_urls: string[]
  is_active: boolean
  moderation_status: ModerationStatus
  deleted_at: string | null
  created_at: string
}

// ── Iklan Barang Bekas Gratis (AdminIklanBarangBekasResponse) ────────────────────
export type AvailabilityStatus = 'available' | 'reserved' | 'taken'

export interface AdminBarangBekas {
  id: string
  seller_id: string
  judul: string
  deskripsi: string
  /** "bekas" | "baru" */
  jenis_barang: string
  jumlah: number
  lokasi_pengambilan: string
  lokasi: string | null
  foto_urls: string[]
  availability_status: AvailabilityStatus
  moderation_status: ModerationStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ── Pelatihan (AdminPelatihanDocResponse) ───────────────────────────────────────
export type PelatihanStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type CreatedByRole = 'admin' | 'user'

export interface AdminPelatihan {
  id: string
  poster_id: string
  judul: string
  penyelenggara: string
  deskripsi: string
  lokasi: string | null
  harga: number | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  foto_urls: string[]
  is_active: boolean
  status: PelatihanStatus
  created_by_role: CreatedByRole
  jumlah_peserta: number | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  bank_name: string | null
  bank_account_number: string | null
  bank_account_holder_name: string | null
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected'

export interface AdminEnrollment {
  id: string
  pelatihan_id: string
  user_id: string
  bukti_transfer_object_key: string | null
  status: EnrollmentStatus
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  updated_at: string
  // Presigned URL untuk melihat bukti transfer (F-10) — hanya terisi dari
  // endpoint admin detail (`enrollmentDetail`), null di endpoint lain.
  bukti_transfer_read_url: string | null
}

export type BadgeStatus = 'pending' | 'approved' | 'rejected'

export interface AdminBadge {
  id: string
  pelatihan_id: string
  user_id: string
  sertifikat_object_key: string | null
  approved_at: string | null
  status: BadgeStatus
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  updated_at: string
  // Presigned URL untuk melihat sertifikat (F-10) — hanya terisi dari
  // endpoint admin detail (`badgeDetail`), null di endpoint lain.
  sertifikat_read_url: string | null
}

// ── KYC (AdminKycListItemDocResponse / AdminKycDetailDocResponse) ────────────────
export type KycStatus = 'pending' | 'approved' | 'rejected'

export interface AdminKycListItem {
  id: string
  full_name: string | null
  education_level: string | null
  gender: string | null
  birth_date: string | null
  address_line: string | null
  country_code: string
  province_id: string | null
  regency_id: string | null
  district_id: string | null
  village_id: string | null
  nik_masked: string | null
  status: KycStatus
  created_at: string
}

export interface AdminKycDetail extends AdminKycListItem {
  profile_id: string
  has_ktp: boolean
  has_selfie: boolean
}

// ── Content Reports (ReportDocResponse / ReportDetailDocResponse) ────────────────
export type ReportStatus = 'pending' | 'in_review' | 'rejected' | 'resolved'
// Jenis Laporan — jalur pembuatan aduan (PRD §6.10, keputusan final B-8). Kelompok 4 Phase 1.
export type ReportType = 'laporkan_iklan' | 'pelaporan_masalah'

// Data demografis pelapor (Kelompok 4 P1.3/P2.2) — semua field bisa null (profil pelapor
// tidak lengkap/tidak ditemukan, degradasi anggun dari backend, BUKAN error).
export interface ReporterDemographics {
  education_level: string | null
  gender: string | null
  birth_date: string | null
  address_line: string | null
  village_name: string | null
  district_name: string | null
  regency_name: string | null
  province_name: string | null
  country: string | null
}

export interface AdminReport {
  id: string
  reporter_id: string
  report_type: ReportType
  // Nullable sejak Kelompok 4 Phase 1 — jalur "Pelaporan Masalah" boleh tanpa target (PRD §6.10).
  target_type: string | null
  target_id: string | null
  keterangan: string
  evidence_object_key: string | null
  status: ReportStatus
  action_note: string | null
  reviewed_by: string | null
  due_date: string
  is_overdue: boolean
  created_at: string
  updated_at: string
  // Hanya terisi di listing bila backend berhasil enrich (batch, Hazard #5) — absen (bukan
  // null) bila gagal/tidak tersedia, lihat `#[serde(skip_serializing_if)]` di backend.
  reporter_demographics?: ReporterDemographics
}

export interface AdminReportDetail extends AdminReport {
  evidence_read_url: string | null
  // Selalu ada di detail (berbeda dari listing) — isinya bisa semua null (degradasi anggun).
  reporter_demographics: ReporterDemographics
}

// ── Corporate Communication (AdminArticleDocResponse) ────────────────────────────
export interface AdminArticle {
  id: string
  author_id: string
  category: string
  title: string
  body: string
  photo_object_key: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ── Upload permission (UploadPermissionDocResponse) ──────────────────────────────
export interface UploadPermission {
  presigned_url: string
  object_key: string
}

// ── Hasil suspend per-item (SuspendIklanDocResponse) ─────────────────────────────
export interface SuspendResultItem {
  iklan_id: string
  success: boolean
  error: string | null
}

export interface SuspendResponse {
  results: SuspendResultItem[]
}

// ── Hasil bulk suspend user (BulkSuspendDocResponse) ─────────────────────────────
export interface BulkSuspendItem {
  user_id: string
  success: boolean
  error: string | null
}

export interface BulkSuspendResponse {
  results: BulkSuspendItem[]
}
