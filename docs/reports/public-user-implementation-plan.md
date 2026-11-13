# SENTRAVAX — PRE-IMPLEMENTATION AUDIT & IMPLEMENTATION PLAN
## PUBLIC WEBSITE & USER PORTAL (SIAGA PERSONAL)

**Tanggal:** 13 November 2026  
**Status:** PROPOSED & READY FOR APPROVAL  
**Fokus Area:** Area A (Public Website) & Area B (User Portal / Portal Warga)  
**Visual Family:** Light Theme (`#F9FAFB` Neutral Canvas, `#FFFFFF` Surface, `#047857` Forest Emerald, `#C2410C` Terracotta, Zero Blue, Zero Neon)  
**Autentikasi:** Laravel Sanctum Stateful SPA (HttpOnly Session Cookie + XSRF-TOKEN CSRF Protection)  
**Role Otorisasi:** `guest` (Public), `user` (Portal Warga), `admin`, `intelligence`  

---

## 1. KONDISI FRONTEND SAAT INI (EXISTING STATE AUDIT)

Berdasarkan audit mendalam terhadap seluruh struktur direktori `frontend/src/`, arsitektur dan fondasi teknis yang telah tersedia adalah sebagai berikut:

### 1.1 Stack Inti & Tooling
- **Framework & Runtime:** React 19.3.1, TypeScript 5.7 / 7.0, Vite 8.3.6.
- **Styling Engine:** Tailwind CSS v4.3.5 dengan token desain berbasis CSS Variables di `:root` (`src/index.css`).
- **Routing Engine:** React Router v7.18.5 (`createBrowserRouter`).
- **HTTP Client:** Axios v1.21.1 dikonfigurasi dengan `withCredentials: true` dan `withXSRFToken: true`.
- **Ikonografi & Notifikasi:** Lucide React v1.71.0 dan Sonner v2.0.8 (Toast notification).
- **Code Hygiene & Verification:** Oxlint (0 warning, 0 error) dan TypeScript strict build pass (`tsc -b && vite build`).

### 1.2 Struktur Routing & Layout
Telah dipisahkan ke dalam 4 domain routing independen di `src/app/router/index.tsx`:
1. **Public Website (`/`)**: Menggunakan `PublicLayout.tsx` (Light Theme). Terbuka untuk seluruh pengunjung (*guest*) tanpa login.
2. **User Portal (`/user`)**: Menggunakan `UserLayout.tsx` (Light Theme). Terproteksi ketat oleh `ProtectedRoute.tsx` (dapat diakses oleh role `user`, `admin`, `intelligence`).
3. **Admin Dashboard (`/admin`)**: Menggunakan `AdminLayout.tsx` (Dark Theme `#0C0C0C`). Terproteksi hanya untuk role `admin`.
4. **Intelligence Center (`/intelligence-center`)**: Menggunakan `IntelligenceLayout.tsx` (Dark Theme `#0C0C0C`). Terproteksi hanya untuk role `intelligence`.

### 1.3 Keamanan & Autentikasi (Telah Teruji E2E 100%)
- Menggunakan arsitektur **Laravel Sanctum Stateful SPA** berbasis session cookie `HttpOnly`.
- **Zero LocalStorage Tokens:** `window.localStorage.getItem('sentravax_auth_token') === null`. Tidak ada token, session ID, atau password yang disimpan di storage browser (kebal terhadap XSS).
- **CSRF Protection:** Mutasi stateful (`POST`, `PUT`, `DELETE`) dilindungi oleh cookie `XSRF-TOKEN` dan request header `X-XSRF-TOKEN`.
- **Re-hidrasi Sesi:** Dilakukan otomatis saat mount atau refresh aplikasi melalui pemanggilan `GET /api/v1/auth/me` di `AuthProvider.tsx`.
- **RBAC Guarding:** `ProtectedRoute.tsx` menolak akses tanpa sesi dan mengisolasi akses silang antar 3 role resmi. Pengujian browser E2E (Chrome) telah meluluskan 15/15 skenario (100% PASS).

### 1.4 Status Halaman Eksisting (Public & User)
- **Halaman yang Sudah Berfungsi Penuh:**
  - `src/pages/public/LoginPage.tsx` (Login stateful dengan tombol preset akun pengujian Warga, Admin, Intelijen, dan validasi rute asal).
  - `src/pages/public/RegisterPage.tsx` (Registrasi akun publik dengan role otomatis `user`).
  - `src/pages/public/ForgotPasswordPage.tsx` (Alur pemulihan sandi).
  - `src/pages/public/NotFoundPage.tsx` (Halaman error 404).
- **Halaman yang Masih Menggunakan Mockup / Placeholder:**
  - `src/pages/public/HomePage.tsx` (Hero dan copy sudah sesuai arah desain baru, namun metrik data masih statis).
  - `src/pages/public/PublicMapPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/public/PublicDisastersPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/public/PublicWarningsPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/public/PublicPreparednessPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/public/PublicEducationPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/public/PublicAboutPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/user/UserDashboardPage.tsx` (Sudah memiliki kerangka kartu metrik dan tabel laporan, namun data masih statis/hardcoded).
  - `src/pages/user/UserReportsPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/user/UserCreateReportPage.tsx` (Formulir input ada, tetapi fungsi simpan masih berupa mockup `setTimeout`).
  - `src/pages/user/UserRegionsPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/user/UserNotificationsPage.tsx` (Masih menggunakan `AreaPlaceholder`).
  - `src/pages/user/UserSettingsPage.tsx` (Masih menggunakan `AreaPlaceholder`).

---

## 2. KOMPONEN YANG DAPAT DIGUNAKAN KEMBALI & RENCANA PUSTAKA KOMPONEN

Untuk mencegah duplikasi kode (*anti-slop* dan prinsip DRY), seluruh komponen yang telah tersedia akan dipertahankan dan dimaksimalkan:

### 2.1 Komponen Eksisting yang Langsung Digunakan Kembali (Reused As-Is)
1. **`src/components/shared/LoadingSpinner.tsx`**:
   - Telah mendukung tema `light` (`#047857`) dan `dark` (`#F59E0B`), ukuran (`sm`, `md`, `lg`), serta mode `fullPage`.
   - Digunakan untuk loading overlay saat fetch data API public dan portal warga.
2. **`src/components/shared/ErrorMessage.tsx`**:
   - Menampilkan peringatan error API dengan opsi retry dan penyesuaian visual family Light/Dark.
   - Digunakan saat query API gagal atau server backend sedang mengalami gangguan.
3. **`src/components/shared/ProtectedRoute.tsx`**:
   - Guard otorisasi role terpusat.
4. **`src/lib/axios.ts` & `src/lib/auth-service.ts`**:
   - Axios client yang telah terkonfigurasi dinamis untuk Sanctum cookie dan header CSRF.
5. **`src/lib/api-error.ts`**:
   - Parser error HTTP (401, 403, 404, 422, 500) menjadi pesan berbahasa Indonesia yang ramah pengguna.
6. **`src/lib/utils.ts`**:
   - Helper `cn()` (`clsx` + `twMerge`) untuk penggabungan kelas styling Tailwind.
7. **`src/types/` (Type Definition Contracts)**:
   - `auth.ts`, `disaster.ts`, `siaga.ts`, `index.ts` sudah memuat seluruh interface data API yang valid dan siap diimpor langsung tanpa perlu membuat ulang type contract.

### 2.2 Komponen UI Foundation Baru yang Akan Dibangun (Light Family Dedicated)
Guna menjaga konsistensi visual di seluruh Public Website dan User Portal sesuai `DESIGN.md`, pustaka komponen bersama berikut akan dibangun di `src/components/ui/`:

| Nama Komponen | Lokasi File | Fungsi & Spesifikasi Desain |
|---|---|---|
| **`Badge`** | `src/components/ui/Badge.tsx` | Penanda status keparahan (`low`, `medium`, `high`, `critical`), status laporan (`pending`, `verified`, `rejected`), kelas peringatan (`advisory`, `watch`, `warning`), dan status data (`LIVE`, `STATIC`, `SIMULATED`). Menggunakan warna solid terdefinisi, zero neon. |
| **`Button`** | `src/components/ui/Button.tsx` | Tombol interaktif dengan variant: `primary` (Forest Emerald `#047857`), `secondary` (Neutral Outline), `danger` (Terracotta `#C2410C`), `ghost`. Mendukung status `isLoading`, disabled, dan ikon. |
| **`Card`** | `src/components/ui/Card.tsx` | Kontainer kartu putih (`#FFFFFF`) dengan border netral (`#E5E7EB`), padding adaptif (desktop 20px, mobile 16px), tanpa dekorasi gradient berlebihan. |
| **`Input`, `Select`, `Textarea`** | `src/components/ui/FormControls.tsx` | Kontrol form standar dengan label jelas, teks petunjuk, state error validasi, dan highlight fokus emerald halus. |
| **`Modal`** | `src/components/ui/Modal.tsx` | Dialog popup modal untuk konfirmasi aksi, pemilihan titik koordinat, dan detail popup cepat. Mendukung penutupan dengan tombol Escape dan klik backdrop. |
| **`Tabs`** | `src/components/ui/Tabs.tsx` | Navigasi tab horizontal (underline / pill) untuk berganti antar modul Siaga Personal (Tas Siaga, Rencana Keluarga, Simulasi Bencana). |
| **`Skeleton`** | `src/components/ui/Skeleton.tsx` | Placeholder shimmer netral memanfaatkan token `--skeleton-light-base` dan `--skeleton-light-highlight` untuk transisi pemuatan data yang halus (*zero jarring layout shift*). |
| **`EmptyState`** | `src/components/ui/EmptyState.tsx` | Tampilan informatif ketika data kosong (misal: belum ada laporan yang diajukan, tidak ada peringatan aktif, dsb). Dilengkapi ikon dan tombol CTA. |
| **`InteractiveMap`** | `src/components/ui/InteractiveMap.tsx` | Komponen pembungkus Leaflet interaktif untuk merender layer GeoJSON kejadian bencana, lingkaran radius risiko, dan titik evakuasi dengan pin marker SVG kustom. |

---

## 3. HALAMAN DAN FITUR YANG PERLU DIBANGUN

### 3.1 AREA A: PUBLIC WEBSITE (7 HALAMAN)

Semua halaman pada Public Website dapat diakses oleh siapapun tanpa syarat autentikasi.

#### 1. Beranda / Landing Page (`src/pages/public/HomePage.tsx`)
- **Fitur Utama:**
  - **Live Telemetry Bar:** Status operasional sistem, jumlah kejadian aktif, dan waktu sinkronisasi terakhir dari endpoint `/api/v1/public/overview`.
  - **Hero Kesiapsiagaan:** Judul dan call-to-action tegas (Buka Peta Risiko, Laporkan Kejadian).
  - **Widget Cek Risiko Cepat:** Formulir ringkas satu-klik untuk mendeteksi risiko lokasi pengunjung via koordinat browser atau pilihan wilayah.
  - **Feed Kejadian Terkini:** Menampilkan 3-5 bencana aktif terbaru dengan label sumber resmi (BMKG/BNPB).
  - **Banner Diseminasi Peringatan Dini:** Peringatan status Siaga/Awas darurat jika ada anomali cuaca atau gempa bumi signifikan.

#### 2. Peta Interaktif Risiko Publik (`src/pages/public/PublicMapPage.tsx`)
- **Fitur Utama:**
  - Peta digital interaktif Leaflet mengonsumsi endpoint GeoJSON RFC 7946 `/api/v1/public/map/features`.
  - Filter kategori bahaya: Gempa Bumi, Banjir, Cuaca Ekstrem, Gunung Api, Kebakaran Hutan.
  - Filter wilayah administratif: Pemilihan provinsi/kabupaten dari `/api/v1/public/regions` untuk *fly-to* otomatis.
  - Pin marker interaktif: Klik pin menampilkan drawer/popup detail kejadian (waktu, keparahan, sumber data, dan jarak).
  - Legenda risiko terukur: Menjelaskan kode warna status bahaya.
  - Status kesegaran data (*freshness indicator*): Menunjukkan kapan data terakhir ditarik dari sensor BMKG/BNPB.

#### 3. Katalog Kejadian Bencana (`src/pages/public/PublicDisastersPage.tsx`)
- **Fitur Utama:**
  - Daftar arsip kejadian bencana terpaginasi dari `/api/v1/public/events`.
  - Filter multi-kriteria: Jenis bahaya, status kejadian (`active`, `contained`, `resolved`), tingkat keparahan (`minor`, `moderate`, `severe`, `extreme`).
  - Pencarian berdasarkan judul kejadian atau nama wilayah.
  - Kartu ringkasan kejadian dengan indikator sumber resmi dan koordinat spasial.
  - Modal / Drawer detail kejadian (`/api/v1/public/events/{id}`) menampilkan riwayat peringatan terkait dan kronologi laporan.

#### 4. Diseminasi Peringatan Dini CAP (`src/pages/public/PublicWarningsPage.tsx`)
- **Fitur Utama:**
  - Feed peringatan darurat format *Common Alerting Protocol* (CAP) dari `/api/v1/public/alerts`.
  - Tab klasifikasi siaran: Nasional, Regional, dan Lokal.
  - Kartu peringatan dengan hierarki urgensi:
    - **Awas (Warning / Critical):** Merah terracotta solid, instruksi evakuasi segera.
    - **Siaga (Watch / High):** Amber gold solid, instruksi persiapan darurat.
    - **Waspada (Advisory / Moderate):** Abu-abu/kuning netral, instruksi pemantauan siaran cuaca.
  - Protokol tindak lanjut masyarakat standar BNPB untuk setiap jenis bencana.

#### 5. Cek Risiko Lokasi Mandiri (`src/pages/public/PublicPreparednessPage.tsx`)
- **Fitur Utama:**
  - **Core Flagship Engine:** Mengonsumsi `/api/v1/public/check-location`.
  - Input lokasi fleksibel: Tombol "Deteksi Lokasi GPS Saya" (`navigator.geolocation`) atau input manual koordinat lintang/bujur atau pemilihan wilayah.
  - **Speedometer / Skor Risiko Terukur (5.0 – 98.0)**: Menampilkan kategori `Kondisi Aman`, `Bahaya Sedang`, `Bahaya Tinggi`, atau `Bahaya Kritis`.
  - **Transparansi Faktor Risiko:** Menampilkan grafik bobot matematis:
    - Kontribusi kejadian aktif di sekitar (radius PostGIS hingga 25 km).
    - Kontribusi peringatan dini resmi CAP aktif.
    - Kerentanan dasar geologis wilayah.
  - **Rekomendasi Aksi Nyata:** Tindakan proteksi terstruktur dan rekomendasi perlengkapan tas siaga bencana BNPB.

#### 6. Katalog Edukasi & Panduan Mitigasi (`src/pages/public/PublicEducationPage.tsx`)
- **Fitur Utama:**
  - Katalog artikel panduan mitigasi bencana dari `/api/v1/public/education`.
  - Filter berdasarkan kategori bahaya (Gempa, Tsunami, Banjir, Cuaca Ekstrem).
  - Tampilan baca artikel mendalam (`/api/v1/public/education/{slug}`) yang memuat langkah-langkah praktis:
    - *Sebelum Bencana* (Kesiapsiagaan & Pencegahan).
    - *Saat Bencana* (Evakuasi & Penyelamatan Diri).
    - *Setelah Bencana* (Pertolongan Pertama & Pemulihan).

#### 7. Profil Platform & Transparansi Data (`src/pages/public/PublicAboutPage.tsx`)
- **Fitur Utama:**
  - Visi dan metodologi *Citizen-First Resilience* SENTRAVAX.
  - **Registry Status Sumber Data Eksternal:** Menampilkan tabel operasional langsung dari `/api/v1/public/data-sources` (BMKG, BNPB, PVMBG, Copernicus) dengan label transparansi (`LIVE`, `STATIC`, `SIMULATED`).
  - Pernyataan privasi geospasial dan kepatuhan etika data bencana.

---

### 3.2 AREA B: USER PORTAL & SIAGA PERSONAL (6 HALAMAN + SUITE SIAGA)

Area ini khusus untuk pengguna terautentikasi (warga), berorientasi pada kesiapsiagaan mandiri keluarga dan pelaporan partisipatif.

#### 1. Dashboard Portal Warga (`src/pages/user/UserDashboardPage.tsx`)
- **Fitur Utama:**
  - Ringkasan telemetri personal dari `/api/v1/user/dashboard`.
  - **Indeks Kesiapsiagaan Personal:** Persentase kesiapan keluarga (dihitung otomatis dari kelengkapan tas siaga, penyimpanan titik kumpul, dan keikutsertaan simulasi).
  - **Status Peringatan Wilayah Pantauan:** Kartu indikator kondisi darurat pada rumah utama atau lokasi keluarga yang disimpan.
  - **Statistik Laporan Warga:** Jumlah laporan diajukan, laporan terverifikasi BPBD, dan laporan dalam antrean moderasi.
  - **Aksi Cepat:** Pintasan menuju "Buat Laporan Baru", "Cek Tas Siaga", dan "Simulasi Bencana".

#### 2. Pelaporan Kejadian Bencana (`src/pages/user/UserCreateReportPage.tsx`)
- **Fitur Utama:**
  - Formulir pelaporan partisipatif masyarakat mengonsumsi endpoint `POST /api/v1/user/reports` (Multipart Form-Data).
  - Pemilihan tipe bahaya dari `/api/v1/public/hazard-types`.
  - Pemilihan wilayah dari `/api/v1/public/regions`.
  - **Penyematan Titik Geospasial:** Deteksi instan koordinat GPS via peramban (`navigator.geolocation`) atau geser pin peta Leaflet.
  - **Unggah Bukti Foto Lapangan:** Pratinjau gambar client-side, validasi ukuran berkas (maks 5MB), dan validasi tipe MIME (JPEG/PNG/WebP).
  - **Umpan Balik Spatiotemporal Duplikasi:** Jika ada laporan serupa dalam radius 1.5 km dan kurun 6 jam, sistem memberi informasi bahwa laporan digabungkan dalam kluster verifikasi yang sama.

#### 3. Riwayat & Pelacakan Laporan Saya (`src/pages/user/UserReportsPage.tsx`)
- **Fitur Utama:**
  - Daftar seluruh laporan yang telah diajukan pengguna dari `/api/v1/user/reports`.
  - Indikator status moderasi jelas:
    - `pending` (Menunggu Verifikasi Operator Posko).
    - `verified` (Terverifikasi & Ditampilkan di Peta Publik).
    - `rejected` (Ditolak / Informasi Tidak Cukup).
  - Detail laporan modal/halaman (`/api/v1/user/reports/{id}`) yang menampilkan foto yang diunggah, koordinat akurat, catatan verifikator, dan waktu verifikasi.

#### 4. Manajemen Wilayah Pantauan (`src/pages/user/UserRegionsPage.tsx`)
- **Fitur Utama:**
  - Pengelolaan titik lokasi pantauan mandiri dari `/api/v1/user/saved-regions`.
  - Modal "Tambah Wilayah Pantauan": Memilih wilayah administratif, memberi label nama (contoh: *Rumah*, *Sekolah Anak*, *Kantor*, *Rumah Orang Tua*), dan menandai status wilayah primer.
  - Kartu status wilayah: Menampilkan peringatan dini CAP yang sedang aktif khusus pada wilayah tersebut.
  - Hapus wilayah pantauan via `DELETE /api/v1/user/saved-regions/{id}` dengan dialog konfirmasi.

#### 5. Kotak Masuk Notifikasi Siaga (`src/pages/user/UserNotificationsPage.tsx`)
- **Fitur Utama:**
  - Daftar notifikasi peringatan bencana terpaginasi dari `/api/v1/user/notifications`.
  - Indikator visual notifikasi belum dibaca (`unread`) vs sudah dibaca (`read`).
  - Aksi "Tandai Dibaca" per item (`POST /api/v1/user/notifications/{id}/read`) dan tombol "Tandai Semua Sudah Dibaca" (`POST /api/v1/user/notifications/read-all`).
  - Notifikasi otomatis terhubung ke kejadian bencana atau peringatan terkait.

#### 6. Pengaturan Profil Akun (`src/pages/user/UserSettingsPage.tsx`)
- **Fitur Utama:**
  - Tampilan profil pengguna dari `/api/v1/user/profile`.
  - Formulir pembaruan nama profil pengguna (`PUT /api/v1/user/profile`).
  - Status keamanan sesi aktif: Menampilkan status otentikasi session cookie HttpOnly, role terdaftar (`user`), dan tombol logout sesi aman.

---

### 3.3 SUITE SIAGA PERSONAL WARGA (FLAGSHIP COMMUNITY RESILIENCE)

Fitur unggulan ini diintegrasikan langsung pada **User Portal** (dapat diakses melalui tab di Dashboard atau menu navigasi siaga) untuk mewujudkan pilar ketangguhan keluarga:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUITE SIAGA PERSONAL WARGA                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Tas Siaga Bencana (Interactive 5-Category Go-Bag Checklist)              │
│    - 13 master item standar BNPB                                            │
│    - Toggle centang tersimpan real-time ke database backend                 │
│    - Progress bar interaktif & kalkulator kelengkapan                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Rencana Siaga Keluarga (Family Preparedness Plan)                        │
│    - Penyimpanan Titik Kumpul Utama & Alternatif                            │
│    - Catatan rute evakuasi mandiri                                          │
│    - Buku kontak darurat keluarga & nomor prioritas evakuasi                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Simulasi Kesiapsiagaan Interaktif (Gamified Disaster Scenarios)          │
│    - Skenario gempa bumi, banjir luapan, & cuaca ekstrem                    │
│    - Evaluasi keputusan cepat pengguna (Passing score: >= 70%)              │
│    - Ulasan edukasi mengapa tindakan tersebut tepat/keliru                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Checklist Tas Siaga Bencana (Go-Bag):**
   - Mengonsumsi `GET /api/v1/user/preparedness/checklist` (mengembalikan 13 item terstandarisasi BNPB dalam 5 kategori: Dokumen, Medis, Logistik, Peralatan, Proteksi).
   - Aksi toggle interaktif via `POST /api/v1/user/preparedness/checklist/{itemId}/toggle` yang langsung menyimpan status centang ke basis data.
   - Perhitungan otomatis persentase kelengkapan yang mempengaruhi Indeks Kesiapsiagaan di Dashboard.
2. **Rencana Kesiapsiagaan Keluarga:**
   - Mengonsumsi `GET /api/v1/user/preparedness/plan` dan pembaruan via `PUT /api/v1/user/preparedness/plan`.
   - Mengatur titik kumpul rumah/keluarga (*assembly point*) dan rute evakuasi.
   - Manajemen kontak darurat prioritas keluarga via `POST /api/v1/user/preparedness/contacts` dan `DELETE /api/v1/user/preparedness/contacts/{id}`.
3. **Simulasi Bencana Interaktif:**
   - Mengonsumsi daftar skenario simulasi dari `GET /api/v1/user/preparedness/scenarios` dan detail pertanyaan `GET /api/v1/user/preparedness/scenarios/{id}`.
   - Pengguna memilih jawaban pada setiap langkah skenario kondisi darurat, lalu mengirimkan jawaban via `POST /api/v1/user/preparedness/scenarios/{id}/attempt`.
   - Sistem backend menghitung skor secara objektif, menyatakan lulus jika skor $\ge 70\%$, dan memberikan ulasan mendalam per pertanyaan untuk meningkatkan kapasitas tanggap bencana warga.

---

## 4. PEMETAAN API ENDPOINT & STATUS KETERSEDIAANNYA

Seluruh endpoint yang dibutuhkan oleh Public Website dan User Portal **TIDAK MENGGUNAKAN DATA MOCKUP / PALSU**, melainkan 100% telah terimplementasi dan terverifikasi di backend (`backend/routes/api.php`):

### 4.1 Pemetaan Endpoint Public Website (11 Endpoint Aktif)

| Endpoint Backend | HTTP Method | Halaman Frontend Terkait | Fungsi Data | Status Backend |
|---|:---:|---|---|:---:|
| `/api/v1/public/overview` | `GET` | `HomePage.tsx` | Ringkasan telemetri, counter bencana & peringatan aktif | **READY** |
| `/api/v1/public/check-location` | `GET` | `PublicPreparednessPage.tsx`, `HomePage.tsx` | Kalkulator risiko lokasi mandiri PostGIS & rekomendasi | **READY** |
| `/api/v1/public/events` | `GET` | `PublicDisastersPage.tsx` | Daftar arsip kejadian bencana terpaginasi & filter | **READY** |
| `/api/v1/public/events/{id}` | `GET` | `PublicDisastersPage.tsx` | Detail lengkap satu kejadian bencana | **READY** |
| `/api/v1/public/map/features` | `GET` | `PublicMapPage.tsx` | GeoJSON FeatureCollection untuk layer peta Leaflet | **READY** |
| `/api/v1/public/alerts` | `GET` | `PublicWarningsPage.tsx`, `HomePage.tsx` | Feed peringatan dini darurat CAP aktif | **READY** |
| `/api/v1/public/hazard-types` | `GET` | `PublicMapPage.tsx`, `PublicDisastersPage.tsx` | Master kategori bahaya (Gempa, Banjir, Cuaca, dll) | **READY** |
| `/api/v1/public/regions` | `GET` | `PublicMapPage.tsx`, `PublicPreparednessPage.tsx` | Master wilayah administratif provinsi/kabupaten | **READY** |
| `/api/v1/public/education` | `GET` | `PublicEducationPage.tsx` | Katalog artikel panduan mitigasi bencana | **READY** |
| `/api/v1/public/education/{slug}` | `GET` | `PublicEducationPage.tsx` | Isi lengkap panduan mitigasi bencana | **READY** |
| `/api/v1/public/data-sources` | `GET` | `PublicAboutPage.tsx` | Status operasional sumber data (BMKG, BNPB, dsb) | **READY** |

### 4.2 Pemetaan Endpoint User Portal (17 Endpoint Aktif)

| Endpoint Backend | HTTP Method | Halaman Frontend Terkait | Fungsi Data | Status Backend |
|---|:---:|---|---|:---:|
| `/api/v1/user/dashboard` | `GET` | `UserDashboardPage.tsx` | Indeks kesiapsiagaan, counter laporan, peringatan wilayah | **READY** |
| `/api/v1/user/profile` | `GET` | `UserSettingsPage.tsx` | Ambil detail profil pengguna | **READY** |
| `/api/v1/user/profile` | `PUT` | `UserSettingsPage.tsx` | Perbarui nama pengguna terdaftar | **READY** |
| `/api/v1/user/saved-regions` | `GET` | `UserRegionsPage.tsx` | Daftar wilayah pantauan mandiri warga | **READY** |
| `/api/v1/user/saved-regions` | `POST` | `UserRegionsPage.tsx` | Simpan wilayah pantauan baru | **READY** |
| `/api/v1/user/saved-regions/{id}` | `DELETE` | `UserRegionsPage.tsx` | Hapus wilayah pantauan | **READY** |
| `/api/v1/user/notifications` | `GET` | `UserNotificationsPage.tsx` | Kotak masuk notifikasi siaga personal terpaginasi | **READY** |
| `/api/v1/user/notifications/{id}/read` | `POST` | `UserNotificationsPage.tsx` | Tandai satu notifikasi telah dibaca | **READY** |
| `/api/v1/user/notifications/read-all` | `POST` | `UserNotificationsPage.tsx` | Tandai seluruh notifikasi telah dibaca | **READY** |
| `/api/v1/user/reports` | `GET` | `UserReportsPage.tsx`, `UserDashboardPage.tsx` | Riwayat laporan bencana yang diajukan user | **READY** |
| `/api/v1/user/reports` | `POST` | `UserCreateReportPage.tsx` | Submit laporan warga baru (Multipart + GPS) | **READY** |
| `/api/v1/user/reports/{id}` | `GET` | `UserReportsPage.tsx` | Detail status & catatan verifikasi posko pada laporan | **READY** |
| `/api/v1/user/preparedness/plan` | `GET`, `PUT` | `UserDashboardPage.tsx` (Suite Siaga) | Rencana titik kumpul & evakuasi keluarga | **READY** |
| `/api/v1/user/preparedness/contacts` | `POST` | `UserDashboardPage.tsx` (Suite Siaga) | Tambah kontak darurat prioritas keluarga | **READY** |
| `/api/v1/user/preparedness/contacts/{id}` | `DELETE` | `UserDashboardPage.tsx` (Suite Siaga) | Hapus kontak darurat | **READY** |
| `/api/v1/user/preparedness/checklist` | `GET` | `UserDashboardPage.tsx` (Suite Siaga) | 13 item tas siaga bencana 5 kategori BNPB | **READY** |
| `/api/v1/user/preparedness/checklist/{id}/toggle` | `POST` | `UserDashboardPage.tsx` (Suite Siaga) | Centang / batalkan centang item tas siaga | **READY** |
| `/api/v1/user/preparedness/scenarios` | `GET` | `UserDashboardPage.tsx` (Suite Siaga) | Daftar skenario simulasi bencana interaktif | **READY** |
| `/api/v1/user/preparedness/scenarios/{id}` | `GET` | `UserDashboardPage.tsx` (Suite Siaga) | Pertanyaan & pilihan keputusan simulasi | **READY** |
| `/api/v1/user/preparedness/scenarios/{id}/attempt` | `POST` | `UserDashboardPage.tsx` (Suite Siaga) | Submit jawaban & peroleh evaluasi skor edukatif | **READY** |

---

## 5. URUTAN IMPLEMENTASI BERDASARKAN PRIORITAS (PHASED ROADMAP)

Pekerjaan implementasi akan dilakukan secara bertahap dan teratur untuk menjamin stabilitas setiap modul sebelum melangkah ke tahap berikutnya:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: API SERVICES & SHARED UI LIBRARY                              │
│ • Buat public-service.ts & user-service.ts                             │
│ • Buat pustaka komponen UI: Badge, Button, Card, Form, Modal, Tabs     │
│ • Setup Leaflet & InteractiveMap component                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TAHAP 2: PUBLIC WEBSITE CORE & MAP                                     │
│ • HomePage.tsx (Integrasi telemetri overview & active alerts)          │
│ • PublicMapPage.tsx (Peta interaktif Leaflet GeoJSON & filter bahaya)  │
│ • PublicDisastersPage.tsx (Katalog kejadian bencana & detail)          │
│ • PublicWarningsPage.tsx (Feed peringatan dini CAP)                    │
│ • PublicEducationPage.tsx & PublicAboutPage.tsx (Mitigasi & Registry)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TAHAP 3: PUBLIC SIAGA PERSONAL (CEK RISIKO MANDIRI)                    │
│ • PublicPreparednessPage.tsx (Kalkulator risiko lokasi PostGIS)        │
│ • Deteksi koordinat GPS peramban & transparansi bobot skor             │
│ • Rekomendasi aksi tanggap & panduan BNPB                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TAHAP 4: USER PORTAL CORE (LAPORAN, WILAYAH, NOTIFIKASI)               │
│ • UserDashboardPage.tsx (Telemetri personal & metrik kesiapsiagaan)    │
│ • UserCreateReportPage.tsx (Form pelaporan warga + foto + GPS)         │
│ • UserReportsPage.tsx (Pelacakan status verifikasi posko)              │
│ • UserRegionsPage.tsx (CRUD wilayah pantauan mandiri)                  │
│ • UserNotificationsPage.tsx & UserSettingsPage.tsx                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TAHAP 5: USER SIAGA PERSONAL SUITE                                     │
│ • Checklist Tas Siaga Bencana 5 Kategori (Toggle real-time)            │
│ • Rencana Siaga Keluarga (Titik kumpul & kontak darurat)               │
│ • Simulasi Bencana Interaktif (Attempt & evaluasi edukatif)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TAHAP 6: VERIFIKASI AKHIR & QUALITY ASSURANCE                          │
│ • Pengujian Browser E2E (Responsivitas Mobile & Desktop)               │
│ • Audit Kepatuhan Anti-Slop (Zero Blue Generik, Zero Neon)             │
│ • PHPUnit (90 test), Oxlint (0 error), Vite Build (0 error)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. RISIKO TEKNIS DAN MITIGASI

| No | Risiko Teknis | Dampak | Rencana Mitigasi |
|---|---|---|---|
| **1** | **Kompatibilitas Leaflet dengan React 19** | Pustaka pembungkus seperti `react-leaflet` sering mengalami kendala *peer dependencies* atau *Strict Mode double-mount* di React 19. | Gunakan pola pembungkus kustom (*native Leaflet wrapper*) menggunakan React `useRef` dan `useEffect`. Hindari library pembungkus pihak ketiga yang belum stabil di React 19. |
| **2** | **Izin Akses Geolocation Browser** | Browser mungkin memblokir permintaan lokasi pengguna (*denied permission*) atau pengguna tidak mengizinkan akses GPS. | Sediakan penanganan fallback yang elegan: jika GPS ditolak, pengguna tetap dapat memilih provinsi/kabupaten secara manual melalui dropdown wilayah administratif `/api/v1/public/regions`. |
| **3** | **Unggah Foto Pelaporan (Multipart/Form-Data)** | Kesalahan format header pada request POST yang berpotensi memutus session cookie atau token CSRF. | Axios instance akan menangani `Content-Type: multipart/form-data` secara transparan dengan tetap menyertakan `withCredentials: true` dan `withXSRFToken: true`. Validasi ukuran berkas (maks 5MB) dilakukan di client sebelum dikirim ke server. |
| **4** | **Koneksi Internet Lambat / Backend Offline** | Tampilan antarmuka mengalami *freeze* atau pesan error teknis membingungkan muncul ke warga. | Gunakan komponen `Skeleton` saat proses fetching data dan `ErrorMessage` dengan tombol coba lagi (*retry*). Komponen tidak boleh crash jika data bernilai `null` atau `empty array`. |
| **5** | **Performa Render GeoJSON di Layar Mobile** | Banyaknya marker pada peta dapat menyebabkan penurunan FPS (*lag*) pada peramban ponsel. | Terapkan batas zoom dinamis dan pengelompokan marker (*clustering*) sederhana pada tampilan mobile, serta batasi jumlah rendering titik awal berdasarkan area pandang (*viewport*). |

---

## 7. KRITERIA PENERIMAAN (ACCEPTANCE CRITERIA / DEFINITION OF DONE)

Setiap tahapan dinyatakan selesai apabila memenuhi seluruh kriteria berikut:

### Kriteria Kualitas Kode & Teknis:
1. `npm run lint` menghasilkan **0 warnings, 0 errors**.
2. `npm run build` sukses melakukan kompilasi TypeScript (`tsc -b`) dan menghasilkan berkas produksi Vite tanpa galat.
3. `php artisan test` di backend tetap mempertahankan status **90/90 tests passed** (437 assertions).
4. Tidak ada pemanggilan endpoint palsu, hardcoded mock data yang menyamar sebagai live data, atau bypass autentikasi.

### Kriteria Pengalaman Pengguna & Desain (Anti-Slop):
1. **Palet Warna Terjaga:** 100% halaman Public Website dan User Portal menggunakan visual family **Light** (`#F9FAFB` canvas, `#047857` Forest Emerald, `#C2410C` Terracotta). Tidak ada warna biru generik atau neon berpendar.
2. **Kerapian Tata Letak:** Setiap elemen memiliki ruang bernapas (*spacing 4px scale*), tidak ada elemen saling bertabrakan atau terpotong pada layar mobile (375px), tablet (768px), maupun desktop (1280px+).
3. **Kontrol Interaktif Berfungsi:** Setiap tombol, link navigasi, filter, tab, dan formulir memiliki aksi nyata yang dapat diverifikasi.
4. **Keamanan Tetap Utuh:** Tidak ada token autentikasi yang tersimpan di `window.localStorage`. Akses area User Portal tetap terlindungi secara stateful.

---

## 8. KESIMPULAN & LANGKAH SELANJUTNYA

Audit prapelaksanaan menunjukkan bahwa fondasi backend, basis data PostGIS, kontrak API, dan keamanan autentikasi telah mencapai status **100% SIAP DAN TERKUNCI**. Struktur frontend telah memiliki fondasi layout dan perutean yang rapi, sehingga implementasi Public Website dan User Portal dapat dilakukan secara modular dan terarah tanpa risiko merusak pekerjaan sebelumnya.

**Rencana implementasi ini siap dijalankan segera setelah mendapatkan persetujuan dari Anda.**

