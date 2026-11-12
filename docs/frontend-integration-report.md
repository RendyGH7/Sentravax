# SENTRAVAX — LAPORAN INTEGRASI FRONTEND & STABILISASI AUTENTIKASI (PHASE 1)

**Tanggal:** 12 November 2026  
**Status:** COMPLETE & VERIFIED (SECURITY HARDENED)  
**Arsitektur:** React 19 + TypeScript + Vite + Tailwind CSS v4 <-> Laravel 13 REST API + PostgreSQL 18 + PostGIS 3.7  
**Autentikasi:** Laravel Sanctum Stateful Session Cookie (HttpOnly) + Proteksi CSRF (Zero LocalStorage Tokens)  
**Dokumen Pendukung:** [Laporan Pengerasan Keamanan Autentikasi](file:///C:/Users/RENDY/OneDrive/Documents/Sentravax/docs/authentication-security-report.md)  

---

## 1. PENELUSURAN DAN PERBAIKAN MASALAH LOGIN (CSRF & ROLES)

### Masalah 1: "CSRF token mismatch" (HTTP 419)
- **Penyebab Utama:**
  1. Pada implementasi awal, middleware `EnsureFrontendRequestsAreStateful` pada Laravel 11/13 menerapkan verifikasi `ValidateCsrfToken` secara ketat pada domain lokal (`localhost:5173` dan `127.0.0.1:5173`).
  2. Adanya konflik antara rute bawaan sesi web Laravel (`/login`) dengan endpoint REST API Sanctum resmi SENTRAVAX (`/api/v1/auth/login`).
  3. Perbedaan origin antara `http://localhost:5173` (browser) dan `http://127.0.0.1:8000` (API) menyebabkan cookie `XSRF-TOKEN` tidak otomatis tersinkronisasi sebelum request POST dikirim.
- **Solusi yang Diterapkan (Hardened):**
  1. **Backend Middleware Pengecualian CSRF Minimal:**
     Pada `backend/bootstrap/app.php`, pengecualian CSRF dibatasi ketat hanya pada `sanctum/csrf-cookie` dan `api/v1/auth/token` (machine API). Rute mutasi browser (`login`, `register`, `logout`, `user/*`, `admin/*`, `intel/*`) tetap memiliki perlindungan CSRF aktif penuh.
  2. **Konfigurasi Environment Backend:**
     Menambahkan `SANCTUM_STATEFUL_DOMAINS` dan `FRONTEND_URL` pada `backend/.env`:
     ```env
     FRONTEND_URL=http://localhost:5173
     SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:5173,127.0.0.1:8000
     SESSION_DRIVER=database
     SESSION_DOMAIN=null
     SESSION_SECURE_COOKIE=false
     SESSION_SAME_SITE=lax
     SESSION_HTTP_ONLY=true
     ```
  3. **Konfigurasi Frontend Environment & Axios Dynamic Host:**
     `frontend/src/lib/axios.ts` secara otomatis menyelaraskan hostname dengan `window.location.hostname` (`localhost` vs `127.0.0.1`) dengan `withCredentials: true` dan `withXSRFToken: true`.
  4. **Modul Auth Service Terpusat (`src/lib/auth-service.ts`):**
     Autentikasi website SPA berjalan 100% menggunakan session cookie HttpOnly. Token identitas tidak pernah disimpan di `localStorage`, mencegah risiko kebocoran credential akibat serangan XSS.

---

### Masalah 2: Presets Akun Obsolete (`analyst@sentravax.go.id`)
- **Penyebab:**
  Tombol quick-fill preset pada formulir login sebelumnya masih mencantumkan peran lama `Analis` (`analyst@sentravax.go.id`), sedangkan basis data telah dikonsolidasikan hanya ke 3 role resmi.
- **Solusi yang Diterapkan:**
  Tombol quick-fill preset pada `src/pages/public/LoginPage.tsx` telah diperbarui 100% ke 3 akun resmi:
  1. **Warga**: `user@sentravax.id` (Password: `Sentravax2026!`) -> role: `user`
  2. **Intelijen**: `intelligence@sentravax.go.id` (Password: `Sentravax2026!`) -> role: `intelligence`
  3. **Admin**: `admin@sentravax.go.id` (Password: `Sentravax2026!`) -> role: `admin`

---

## 2. MATRIKS OTORISASI RESMI 3 ROLE (FINAL MATRIX)

Sesuai arahan arsitektur final, platform hanya mengakui 3 role resmi di database:

| Role | Ruang Publik (`/`, `/map`, dll) | Portal Warga (`/user/*`) | Admin Console (`/admin/*`) | Intelligence Center (`/intel/*`) |
|---|:---:|:---:|:---:|:---:|
| **`admin`** | ✓ Akses Penuh | ✓ Akses Penuh | ✓ **Akses Penuh** | ✗ Ditolak (403 / Area Dibatasi) |
| **`intelligence`** | ✓ Akses Penuh | ✓ Akses Penuh | ✗ Ditolak (403 / Area Dibatasi) | ✓ **Akses Penuh** |
| **`user`** | ✓ Akses Penuh | ✓ **Akses Penuh** | ✗ Ditolak (403 / Area Dibatasi) | ✗ Ditolak (403 / Area Dibatasi) |
| **`guest`** (Unauthenticated) | ✓ Akses Penuh | ✗ Diarahkan ke Login | ✗ Diarahkan ke Login | ✗ Diarahkan ke Login |

- Admin memiliki kewenangan penuh tata kelola pengguna, verifikasi pelaporan publik, dan konfigurasi integrasi data eksternal.
- Intelligence memiliki kewenangan analisis intelijen geospasial, proyeksi risiko AI, simulasi bahaya, dan rekomendasi proaktif.
- Warga (User) memiliki akses ke dasbor kesiapsiagaan mandiri, rencana evakuasi keluarga, tas siaga bencana, kalkulator risiko lokasi, dan pelaporan kejadian.

---

## 3. IMPLEMENTASI MODUL FOUNDATION FRONTEND

### A. Dedicated Auth Service (`frontend/src/lib/auth-service.ts`)
- **`login(credentials)`**: Memanggil `ensureCsrfCookie()`, lalu mengirim POST `/api/v1/auth/login`. Menerima cookie session HttpOnly secara otomatis tanpa menyentuh `localStorage`.
- **`register(data)`**: Memanggil `ensureCsrfCookie()`, lalu mengirim POST `/api/v1/auth/register`, memaksa role `user` di backend.
- **`getCurrentUser()`**: Mengirim GET `/api/v1/auth/me` untuk validasi sesi dan re-hidrasi profil pengguna langsung dari session cookie.
- **`logout()`**: Mengirim POST `/api/v1/auth/logout`, mengakhiri sesi di database backend.
- **`hasRole(user, roles)`**: Memeriksa kesesuaian role secara type-safe.

### B. Konteks Autentikasi (`frontend/src/app/context/AuthProvider.tsx`)
- Menggunakan session cookie HttpOnly sebagai sumber otentikasi.
- Saat aplikasi di-refresh, `AuthProvider` memanggil `authService.getCurrentUser()` untuk memvalidasi cookie browser secara otomatis tanpa jeda atau ketergantungan storage client.
- Menyediakan fungsi `hasRole` reaktif untuk komponen pelindung rute.

### C. Komponen Pelindung Akses (`src/components/shared/ProtectedRoute.tsx`)
- Menolak akses pengguna tanpa autentikasi dan mengarahkan ke halaman login (`/login`) dengan state `from` lokasi asal.
- Melindungi akses lintas role dengan banner visual bertema gelap (`#0C0C0C`, border `#2C2C2C`, aksen `#F59E0B`) yang informatif dan tombol navigasi kembali ke Portal Warga.

### D. Komponen Reusable UI Foundation
1. **`src/components/shared/LoadingSpinner.tsx`**:
   - Mendukung tema Light (`#047857` Forest Emerald) dan Dark (`#F59E0B` Amber Gold).
   - Mode `fullPage` dengan backdrop tema yang sesuai.
2. **`src/components/shared/ErrorMessage.tsx`**:
   - Menampilkan peringatan kegagalan operasi sistem dengan opsi retry.
   - Mendukung visual family Light (`#FEF2F2` / `#DC2626`) dan Dark (`#1C1113` / `#FCA5A5`).
3. **`src/lib/api-error.ts`**:
   - Ekstraksi pesan error HTTP 401, 403, 404, 422 (validasi formulir), dan 500+ secara manusiawi.

### E. Type Contracts Lengkap (`src/types/`)
- `auth.ts`: Kontrak login, register, profil user, dan enum role (`user`, `admin`, `intelligence`).
- `disaster.ts`: GeoJSON features, tipe ancaman bencana, wilayah administratif, event kejadian aktif, peringatan dini.
- `siaga.ts`: Kalkulasi risiko lokasi PostGIS, tas siaga bencana, kontak darurat, rencana aksi kesiapsiagaan, simulasi interaktif.
- `admin.ts`: Metrik ringkasan platform, telemetri infrastruktur PostGIS, status provider data eksternal (BMKG/BNPB/FIRMS).
- `intelligence.ts`: Analisis proyeksi skenario, status integrasi data stream, wawasan rekomendasi AI proaktif.
- `index.ts`: Re-export unifikasi `ApiResponse<T>` dan `PaginatedData<T>`.

---

## 4. PENELAAHAN ILUSTRASI & DESAIN REFERENSI (MOBILE & USER SPACE)

Berdasarkan referensi visual yang diberikan (Lampiran Gambar 4, 5, dan 6):
1. **Dasbor Warga & Pantau Sekitar (Gambar 4):**
   - Header personal: Salam hangat (*"Halo Slamet Riyadi"*), penunjuk lokasi aktif (*"Sleman, Yogyakarta"*).
   - Kartu kondisi bahaya sekitar (*"Kondisi di Sekitarmu"*): Indikator status risiko per tipe bencana (*Covid-19 Bahaya Tingkat Tinggi*, *Gempa Bumi Bahaya Tingkat Sedang*).
   - Kartu wawasan dan berita bencana terverifikasi.
   - Navigasi responsif (Beranda, Edukasi, Peta, Laporan, Akun).
2. **Kesiapsiagaan Darurat & Jalur Evakuasi (Gambar 5):**
   - Kartu status darurat: Indikator level siaga (*SIAGA 1 Peringatan Banjir*), target tempat evakuasi terdekat (*Posko Kebangsaan*), jarak real-time (*200 m*).
   - Tombol Panggilan Darurat / SOS melayang (*Floating Red SOS Button*).
   - Panduan evakuasi bertahap (*Langkah 1: Pergi ke posko*, *Langkah 2: Ikuti jalur evakuasi*, *Langkah 3: Prioritaskan kelompok rentan*).
3. **AI-Powered Smart Map (Gambar 6):**
   - Peta interaktif PostGIS dengan jalur evakuasi paling aman (*Safest Route*) dan estimasi durasi (*12 min (3.0 mi)*).
   - Fitur otomatis: *Send your safety status* ke kontak darurat terdaftar secara instan.

Desain referensi ini telah dicatat dan ditetapkan sebagai panduan desain utama untuk implementasi modul User Portal & Public Kesiapsiagaan pada fase berikutnya.
