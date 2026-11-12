# SENTRAVAX — COMPREHENSIVE BACKEND & DATABASE AUDIT

**Tanggal Audit:** 12 November 2026  
**Dokumen:** `docs/backend-audit.md`  
**Sistem:** Laravel 13.40.0, PHP 8.4+, PostgreSQL 18.3 + PostGIS  
**Tujuan:** Audit baseline teknis menyeluruh sebelum implementasi penuh REST API dan Database Engine SENTRAVAX.

---

## 1. Status Implementasi Eksisting

### A. Database & PostGIS
1. **Migration State**: 18 migration telah tereksekusi pada database PostgreSQL `sentravax_db`:
   - `0001_01_01_000000_create_users_table`
   - `0001_01_01_000001_create_cache_table`
   - `0001_01_01_000002_create_jobs_table`
   - `2024_01_01_000000_create_passkeys_table`
   - `2025_08_14_170933_add_two_factor_columns_to_users_table`
   - `2026_11_09_033651_add_role_to_users_table`
   - `2026_11_09_033652_create_regions_table`
   - `2026_11_09_033653_create_hazard_types_table`
   - `2026_11_09_033654_create_data_sources_table`
   - `2026_11_09_033655_create_hazard_events_table`
   - `2026_11_09_033656_create_risk_assessments_table`
   - `2026_11_09_033657_create_ai_insights_table`
   - `2026_11_09_033658_create_community_reports_table`
   - `2026_11_09_033659_create_alerts_table`
   - `2026_11_09_033700_create_notifications_table` (menghasilkan tabel `user_notifications`)
   - `2026_11_09_033701_create_education_contents_table`
   - `2026_11_10_093430_create_personal_access_tokens_table` (Laravel Sanctum)
   - `2026_11_11_113200_consolidate_user_roles` (Konsolidasi role canonical)
2. **PostGIS Geometries & Spatial Indexes**:
   - `regions.center_point` (POINT, SRID 4326) dengan GiST index `regions_center_point_gist_idx`.
   - `regions.boundary` (MULTIPOLYGON, SRID 4326) dengan GiST index `regions_boundary_gist_idx`.
   - `hazard_events.location` (POINT, SRID 4326) dengan GiST index `hazard_events_location_gist_idx`.
   - `community_reports.location` (POINT, SRID 4326) dengan GiST index `community_reports_location_gist_idx`.
3. **Data Eksisting Terdaftar**:
   - 4 Akun pengguna: `admin@sentravax.go.id` (`admin`), `intelligence@sentravax.go.id` (`intelligence`), `user@sentravax.id` (`user`), dan 1 akun pengujian registrasi (`user`).
   - 5 Wilayah uji coba (`regions`): DKI Jakarta, Jawa Barat, Kota Bekasi, Kota Tangerang, Kabupaten Sleman.
   - 5 Kategori bahaya (`hazard_types`): Banjir, Gempa Bumi, Cuaca Ekstrem, Longsor, Kebakaran Hutan/Lahan.
   - 3 Sumber data eksternal (`data_sources`): BMKG, BNPB, NASA FIRMS.
   - 3 Kejadian bencana awal (`hazard_events`).

### B. Routing & Autentikasi
1. Autentikasi Sanctum hybrid (Session cookie + Personal Access Bearer Token) telah bekerja dengan proteksi CSRF API yang tepat di `bootstrap/app.php`.
2. Controller autentikasi aktif: [`AuthController.php`](file:///C:/Users/RENDY/OneDrive/Documents/Sentravax/backend/app/Http/Controllers/Api/V1/AuthController.php) (`login`, `register`, `me`, `logout`).
3. Endpoint otorisasi saat ini hanya berisi rute pengujian awal (`/admin/ping`, `/intel/ping`, `/user/ping`).
4. Test PHPUnit: 57 test assertions berjalan 100% lulus (termasuk 16 test otorisasi mutual-eksklusif di `AuthApiTest`).

---

## 2. Bagian yang Belum Diimplementasikan (Gaps)

Berdasarkan Master Task dan kebutuhan Community-First Intelligence, berikut adalah komponen yang belum tersedia dan harus dibangun:

### A. Kebutuhan Skema Database Tambahan (Additive Migrations)
1. **Fitur Siaga Personal & Kesiapsiagaan Keluarga**:
   - `user_saved_regions`: Menyimpan wilayah/lokasi yang dipantau oleh pengguna terdaftar.
   - `preparedness_plans`: Menyimpan data rencana siaga (titik kumpul, catatan evakuasi keluarga, tanggal pembaruan).
   - `preparedness_contacts`: Kontak darurat keluarga / lokal.
   - `preparedness_checklist_items`: Master item tas siaga bencana (dokumen, medis, logistik, senter/alat).
   - `preparedness_checklist_progress`: Status centang pemenuhan item per pengguna.
   - `emergency_scenarios`, `scenario_questions`, `scenario_attempts`: Bank skenario dan riwayat simulasi latihan kesiapsiagaan warga.
2. **Kebutuhan Audit Operasional & Pipeline Data**:
   - `data_source_sync_runs`: Riwayat log sinkronisasi data eksternal (durasi, jumlah data, error, stempel freshness).
   - `report_verifications`: Jejak audit verifikasi laporan warga oleh petugas Intelligence (catatan internal, status sebelum dan sesudah).
   - `user_hazard_preferences`: Pengaturan notifikasi preferensi kategori bahaya dan batas keparahan.
3. **Penyempurnaan Tabel Eksisting**:
   - Tambah kolom `photo_path` dan `cluster_id` pada `community_reports` untuk dukungan foto dan kluster deteksi duplikasi.

### B. Kebutuhan Business Logic & Services Layer
Saat ini belum ada direktori `app/Services/`. Seluruh logika harus dipusatkan ke dalam service domain:
1. `App\Services\RiskEngine\RiskEngineService`: Perhitungan skor risiko multi-bahaya berdasarkan poligon PostGIS, kedekatan spasial (`ST_DWithin`), tingkat keparahan, riwayat frekuensi, dan status kesegaran data.
2. `App\Services\Intelligence\IntelligenceService`: Generator insight proaktif deterministik berbasis aturan dan bukti riil, penganalisis korelasi kejadian, serta detektor duplikasi laporan warga.
3. `App\Services\ExternalData\BmkgAdapter`: Konektor data gempa, cuaca, dan peringatan BMKG.
4. `App\Services\ExternalData\BnpbAdapter`: Konektor data kejadian bencana BNPB.
5. `App\Services\ExternalData\NasaFirmsAdapter`: Konektor anomali termal satelit NASA FIRMS.
6. `App\Services\ExternalData\DataSyncService`: Orkestrator sinkronisasi, retry, penandaan status freshness (`LIVE`, `SIMULATED`, `STATIC`, `STALE`, `UNAVAILABLE`).
7. `App\Services\Preparedness\PreparednessService`: Engine evaluasi Siaga Personal, generator rekomendasi aksi berbasis konteks risiko wilayah, dan manajemen rencana keluarga.
8. `App\Services\Notification\NotificationService`: Pengiriman notifikasi tertarget dengan mekanisme deduplikasi dan cooldown.

### C. Kebutuhan REST API Endpoints Lengkap (`/api/v1`)
1. **Area A: Public Website API** (`/api/v1/public/*`):
   - `GET /api/v1/public/overview`: Ringkasan statistik bencana nasional & kondisi sistem.
   - `GET /api/v1/public/siaga/check-location`: Fitur unggulan Cek Risiko Lokasi mandiri tanpa login.
   - `GET /api/v1/public/events`: Daftar katalog kejadian bencana (filter kategori, status, region).
   - `GET /api/v1/public/events/{id}`: Detail kejadian bencana lengkap dengan sumber & stempel waktu.
   - `GET /api/v1/public/map/features`: GeoJSON/vektor fitur peta untuk interaksi visual.
   - `GET /api/v1/public/alerts`: Peringatan dini resmi aktif (BMKG/BNPB).
   - `GET /api/v1/public/education`: Artikel panduan mitigasi bencana.
   - `GET /api/v1/public/data-sources`: Status kesehatan konektor data eksternal.
2. **Area B: User Portal API** (`/api/v1/user/*`):
   - `GET /api/v1/user/dashboard`: Ringkasan personal (wilayah terpantau, status risiko rumah, checklist).
   - `GET /api/v1/user/preparedness/plan` & `POST / PUT`: Manajemen rencana siaga keluarga & kontak darurat.
   - `GET /api/v1/user/preparedness/checklist` & `POST`: Checklist tas siaga dan progres centang.
   - `GET /api/v1/user/regions` & `POST / DELETE`: Wilayah pantauan tersimpan.
   - `GET /api/v1/user/reports` & `POST / GET {id}`: Pengajuan laporan warga (koordinat GPS + foto) & pelacakan status.
   - `GET /api/v1/user/notifications` & `PATCH {id}/read`: Notifikasi personal dan preferensi peringatan.
   - `GET /api/v1/user/simulation/scenarios` & `POST attempt`: Latihan simulasi tanggap darurat interaktif.
3. **Area C: Admin Dashboard API** (`/api/v1/admin/*`):
   - `GET /api/v1/admin/overview`: Ringkasan kesehatan sistem, metrik pengguna, dan audit log.
   - `GET /api/v1/admin/users` & `PATCH {id}/role`: Tata kelola pengguna (terbatas pada 3 role resmi).
   - `GET /api/v1/admin/reports`: Moderasi pengawasan laporan masyarakat.
   - `GET /api/v1/admin/disasters`: Manajemen kejadian bencana resmi.
   - `GET /api/v1/admin/alerts`: Manajemen diseminasi peringatan dini.
   - `GET /api/v1/admin/education`: Manajemen konten edukasi publik.
   - `GET /api/v1/admin/data-sources` & `POST {id}/sync`: Pengawasan konektor API dan pemicu sinkronisasi manual.
   - `GET /api/v1/admin/audit-logs`: Log audit keamanan dan aksi administratif.
4. **Area D: Intelligence Center API** (`/api/v1/intel/*`):
   - `GET /api/v1/intel/overview`: Dashboard intelijen spasial, telemetri aktif, dan anomali.
   - `GET /api/v1/intel/map`: Layer analitik multi-hazard geospasial mendalam.
   - `POST /api/v1/intel/risk/evaluate`: Pemicu perhitungan ulang risk engine wilayah.
   - `GET /api/v1/intel/insights` & `POST`: Manajemen AI Proactive Insights & rekomendasi taktis.
   - `GET /api/v1/intel/reports/queue`: Antrean laporan warga untuk verifikasi lapangan.
   - `POST /api/v1/intel/reports/{id}/verify`: Aksi verifikasi/penolakan laporan dengan jejak audit.
   - `POST /api/v1/intel/alerts/dispatch`: Operasi peringatan dini format CAP (Common Alerting Protocol).

---

## 3. Inkonsistensi Database & Analisis Keamanan

1. **Inkonsistensi Nama Tabel**:
   - Migration `2026_11_09_033700_create_notifications_table.php` membuat tabel `user_notifications`, bukan `notifications`. Ini konsisten dengan model `UserNotification.php`, namun relasi pada model `User.php` harus dipastikan merujuk ke tabel `user_notifications`.
2. **Pemisahan Otoritas Mutlak (Strict Mutual Exclusion)**:
   - Admin tidak boleh memiliki akses ke `/api/v1/intel/*`.
   - Intelligence tidak boleh memiliki akses ke `/api/v1/admin/*`.
   - Middleware `role:admin` dan `role:intelligence` harus ditegakkan pada masing-masing rute grup.
3. **Pencegahan Eskalasi Hak Akses**:
   - `AuthController@register` telah memblokir injeksi role dan selalu memaksakan role `'user'`.
   - Endpoint pengelolaan role di Admin Controller harus memvalidasi bahwa hanya role `user`, `admin`, dan `intelligence` yang dapat ditetapkan.

---

## 4. Fitur Eksisting yang Wajib Dipertahankan

1. Tiga role resmi kanonikal (`admin`, `intelligence`, `user`) dan akun pengujian development di seeder.
2. Seluruh tabel PostGIS eksisting dan indeks GiST spasial SRID 4326.
3. Pengaturan middleware CSRF & stateful Sanctum di `bootstrap/app.php`.
4. 57 tes otomatis PHPUnit eksisting yang sudah 100% lulus.

---

## 5. Rencana Urutan Implementasi Bertahap

* **Fase 1**: Database Completion (Additive migrations untuk Siaga Personal, Rencana Keluarga, Log Sinkronisasi, Audit Verifikasi, dan Indeks Spasial).
* **Fase 2**: Backend Domain Architecture (Models, FormRequests, Resources, dan Domain Services).
* **Fase 3**: Implementasi Core API (Public, User, Admin, Intelligence) secara tuntas dan fungsional.
* **Fase 4**: Integrasi Sumber Data Eksternal (Adapter BMKG, BNPB, NASA FIRMS dengan fallback aman).
* **Fase 5**: Multi-Hazard Risk Engine (Perhitungan transparan berbasis faktor spasial PostGIS).
* **Fase 6**: AI Proactive Intelligence (Generator insight kontekstual berbasis aturan dan bukti riil).
* **Fase 7**: Sistem Peringatan, Notifikasi & Edukasi Kesiapsiagaan.
* **Fase 8**: Audit Keamanan & Keandalan (CORS, Rate Limiting, Input Sanitization, Otorisasi Ketat).
* **Fase 9**: Pengujian Otomatis Menyeluruh (PHPUnit test suite komprehensif untuk semua modul).
* **Fase 10**: Dokumentasi API & Deployment Guide (`docs/backend-api-documentation.md`, `docs/backend-deployment-guide.md`, `docs/community-first-features.md`).

