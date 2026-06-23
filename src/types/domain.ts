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
  foto_urls: string[]
  is_active: boolean
  moderation_status: ModerationStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ── Iklan Pekerjaan (AdminIklanDocResponse) ─────────────────────────────────────
export interface AdminIklanPekerjaan {
  id: string
  poster_id: string
  judul: string
  perusahaan: string
  deskripsi: string
  lokasi: string | null
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

export interface AdminReport {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  keterangan: string
  evidence_object_key: string | null
  status: ReportStatus
  action_note: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface AdminReportDetail extends AdminReport {
  evidence_read_url: string | null
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
