# SENTRAVAX — LAPORAN PENGERASAN KEAMANAN AUTENTIKASI (AUTHENTICATION SECURITY HARDENING)

**Tanggal:** 12 November 2026  
**Status:** IMPLEMENTED & 100% VERIFIED  
**Arsitektur Autentikasi:** Laravel Sanctum Stateful SPA Session Cookie (HttpOnly) + Proteksi Penuh CSRF  
**Arsitektur Machine API:** Dedicated Personal Access Token (Bearer) via `/api/v1/auth/token`  
**Frontend Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Axios (`withCredentials` & `withXSRFToken`)  
**Backend Stack:** Laravel 13 REST API + PostgreSQL 18 + PostGIS 3.7 + Sanctum  

---

## 1. TARGET & RINGKASAN ARSITEKTUR FINAL

Berdasarkan audit keamanan lanjutan, sistem autentikasi SENTRAVAX telah distandarisasi mengikuti kaidah keamanan web modern OWASP dan arsitektur resmi Laravel Sanctum Stateful SPA:

```
[Browser React SPA] 
       │
       ├── 1. GET /sanctum/csrf-cookie  ──► [Set-Cookie: XSRF-TOKEN; laravel-session (HttpOnly)]
       │
       ├── 2. POST /api/v1/auth/login   ──► [Verifikasi CSRF via header X-XSRF-TOKEN]
       │      (withCredentials: true)       [Regenerasi Session ID & Cookie HttpOnly]
       │
       ├── 3. GET /api/v1/auth/me       ──► [Otorisasi otomatis via Cookie Session HttpOnly]
       │                                    [Zero localStorage Token Storage!]
       │
       └── 4. POST /api/v1/auth/logout  ──► [Invalidasi Session di DB & Destruksi Cookie]

[Machine / CLI / IoT Clients]
       │
       └── POST /api/v1/auth/token      ──► [Diterbitkan Bearer Token 30-hari (Stateless)]
```

### Prinsip Keamanan Non-Negosiasi:
1. **Zero Browser LocalStorage Tokens:**
   Website React SPA SENTRAVAX tidak lagi menyimpan bearer token, session identifier, atau kredensial pengguna di dalam `localStorage`. Seluruh sesi browser dikelola eksklusif melalui cookie `HttpOnly` yang tidak dapat diakses oleh skrip JavaScript, sehingga kebal dari pencurian token akibat kerentanan XSS (Cross-Site Scripting).
2. **Perlindungan CSRF Utuh (No Blanket Bypasses):**
   Pengecualian CSRF blanket (`api/*` dan `api/v1/*`) telah dicabut secara permanen. Seluruh rute mutasi stateful browser (`POST`, `PUT`, `DELETE`) wajib lolos verifikasi token `XSRF-TOKEN` yang dicocokkan dengan session aktif.
3. **Pemisahan Jalur Machine Integration:**
   Kebutuhan integrasi non-browser (CLI admin, cron daemon, mobile agent) dipisahkan secara tegas ke endpoint khusus: `POST /api/v1/auth/token` yang menerbitkan Sanctum Personal Access Token (Bearer).
4. **Verifikasi Otorisasi Sisi Server:**
   Hak akses ketiga role (`admin`, `intelligence`, `user`) divalidasi langsung di kernel backend via middleware `EnsureUserHasRole` (`role:...`), bukan sekadar pembatasan rute frontend React.

---

## 2. AUDIT IMPLEMENTASI & PERBAIKAN RINCI

### A. Frontend (React 19 / TypeScript / Axios)

| Komponen | Status Sebelum Hardening | Status Sesudah Hardening |
|---|---|---|
| **`src/lib/axios.ts`** | Menyimpan & membaca bearer token dari `localStorage.getItem('sentravax_auth_token')` via request interceptor. | **Dihapus total.** Interceptor membaca `withCredentials: true` dan `withXSRFToken: true`. Host backend diselaraskan dinamis dengan `window.location.hostname` (`localhost` vs `127.0.0.1`) agar cookie tidak terisolasi. |
| **`src/lib/auth-service.ts`** | Menyimpan `sentravax_auth_token` dan `sentravax_user` di localStorage. | **Dihapus total.** Menggunakan session cookie backend, fungsi `ensureCsrfCookie()` diawali sebelum setiap mutasi, dan `getCurrentUser()` merefleksikan `/api/v1/auth/me`. |
| **`src/app/context/AuthProvider.tsx`** | Re-hidrasi awal membaca cache JSON dari `localStorage`. | State awal diinisialisasi `null` dan langsung memanggil `authService.getCurrentUser()` saat mount untuk re-hidrasi aman langsung dari cookie HttpOnly. |
| **`src/components/shared/ProtectedRoute.tsx`** | Menilai otorisasi role di sisi client. | Tetap mempertahankan guard visual responsif dengan fallback loading spinner bertema Light/Dark saat validasi sesi berlangsung. |

### B. Backend (Laravel 13 / Sanctum / Middleware)

| File Konfigurasi | Pengaturan Keamanan Diterapkan |
|---|---|
| **`backend/bootstrap/app.php`** | Pengecualian CSRF hanya dibatasi pada `sanctum/csrf-cookie` dan `api/v1/auth/token`. Seluruh endpoint SPA (`/api/v1/auth/login`, `/register`, `/logout`, `/user/*`, `/admin/*`, `/intel/*`) diwajibkan melewati proteksi CSRF. |
| **`backend/config/cors.php`** | `allowed_origins` dibatasi tanpa wildcard (`http://localhost:5173`, `http://127.0.0.1:5173`). `supports_credentials: true`. |
| **`backend/config/sanctum.php`** | Domain stateful mencakup `localhost`, `localhost:5173`, `localhost:8000`, `127.0.0.1`, `127.0.0.1:5173`, `127.0.0.1:8000`. |
| **`backend/.env`** | `SESSION_DRIVER=database`<br>`SESSION_LIFETIME=120`<br>`SESSION_DOMAIN=null`<br>`SESSION_SECURE_COOKIE=false` *(local dev; diset true pada HTTPS produksi)*<br>`SESSION_SAME_SITE=lax`<br>`SESSION_HTTP_ONLY=true` |
| **`AuthController.php`** | 1. Memperbaiki bug fatal `TransientToken::delete()` pada saat logout sesi cookie.<br>2. Menambahkan `issueToken()` khusus machine client non-browser. |

---

## 3. HASIL VERIFIKASI 12 ALUR PENGUJIAN WAJIB

Pengujian komprehensif 12 alur dijalankan melalui script pengujian siklus hidup autentikasi terisolasi (`test_12_flows.php`):

| No | Skenario Pengujian | Endpoint & Aksi | Respon yang Diharapkan | Respon Aktual | Status |
|:---:|---|---|:---:|:---:|:---:|
| **1** | Guest membuka Public Website | `GET /api/v1/public/overview` | **HTTP 200 OK** | **HTTP 200 OK** | **PASS** |
| **2** | Guest mencoba mengakses User Portal | `GET /api/v1/user/dashboard` | **HTTP 401 Unauthorized** | **HTTP 401 Unauthorized** | **PASS** |
| **3** | Inisialisasi CSRF dan Login User | `GET /sanctum/csrf-cookie`<br>`POST /api/v1/auth/login` (`user@sentravax.id`) | **HTTP 200 OK**<br>Set Cookie HttpOnly | **HTTP 200 OK**<br>Cookie `laravel-session` & `XSRF-TOKEN` | **PASS** |
| **4** | Refresh browser setelah login | `GET /api/v1/auth/me` (Request baru hanya membawa cookie) | **HTTP 200 OK**<br>Sesi pulih tanpa localStorage | **HTTP 200 OK** | **PASS** |
| **5** | Validasi endpoint identitas | `GET /api/v1/auth/me` | **HTTP 200 OK**<br>Profil User terkonfirmasi | **HTTP 200 OK**<br>ID: 3, Role: user | **PASS** |
| **6** | Akses User Portal sebagai User | `GET /api/v1/user/dashboard` (via Cookie) | **HTTP 200 OK** | **HTTP 200 OK** | **PASS** |
| **7** | User mencoba Admin Console (Akses Silang) | `GET /api/v1/admin/overview` (via Cookie User) | **HTTP 403 Forbidden** | **HTTP 403 Forbidden** | **PASS** |
| **8** | Login sebagai Admin | `POST /api/v1/auth/login` (`admin@sentravax.go.id`) | **HTTP 200 OK**<br>Role: admin | **HTTP 200 OK** | **PASS** |
| **9** | Admin mencoba Intelligence Center (Akses Silang) | `GET /api/v1/intel/overview` (via Cookie Admin) | **HTTP 403 Forbidden** | **HTTP 403 Forbidden** | **PASS** |
| **10** | Logout Sesi Pengguna | `POST /api/v1/auth/logout` | **HTTP 200 OK**<br>Sesi di database dihapus | **HTTP 200 OK** | **PASS** |
| **11** | Akses kembali endpoint terlindungi setelah logout | `GET /api/v1/auth/me` (dengan cookie lama) | **HTTP 401 Unauthorized** | **HTTP 401 Unauthorized** | **PASS** |
| **12** | Request POST tanpa header CSRF token | `POST /api/v1/auth/login` dari origin SPA tanpa token | **HTTP 419 CSRF token mismatch** | **HTTP 419 CSRF token mismatch** | **PASS** |

**Tingkat Kelulusan:** 12 / 12 Alur Lulus Sempurna (100%).

---

## 4. PENGUJIAN REGRESI DAN KUALITAS KODE

1. **Backend Automated Tests (PHPUnit):**
   ```
   Tests:    90 passed (90 total)
   Assertions: 437 passed
   Duration: 39.8s
   Status:   100% GREEN (Zero Backend Regression)
   ```
2. **Frontend Linter (Oxlint):**
   ```
   Found 0 warnings and 0 errors.
   Finished in 25ms on 59 files with 116 rules.
   ```
3. **Frontend Production Build (TypeScript + Vite):**
   ```
   ✓ 2197 modules transformed.
   dist/index.html                   0.67 kB
   dist/assets/index-B6YBDEWv.css   42.44 kB
   dist/assets/index-BliGVFXD.js   530.80 kB
   ✓ built in 784ms (0 errors)
   ```

---

## 5. DOKUMENTASI KONFIGURASI PRODUKSI HTTPS

Pada lingkungan produksi (Production Deployment) dengan domain kustom (misal: `https://sentravax.id` dan `https://api.sentravax.id`):

1. **Variabel Environment Backend (`.env`):**
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.sentravax.id
   FRONTEND_URL=https://sentravax.id

   # Domain cookies lintas subdomain
   SESSION_DOMAIN=.sentravax.id
   SESSION_SECURE_COOKIE=true
   SESSION_SAME_SITE=none
   SESSION_HTTP_ONLY=true

   SANCTUM_STATEFUL_DOMAINS=sentravax.id,www.sentravax.id
   ```
2. **Variabel Environment Frontend (`.env`):**
   ```env
   VITE_BACKEND_URL=https://api.sentravax.id
   VITE_API_BASE_URL=https://api.sentravax.id/api/v1
   ```
3. **Catatan Keamanan Transport Layer:**
   Atribut `Secure` pada cookie mewajibkan seluruh komunikasi berjalan di atas protokol TLS/HTTPS. Nilai `SameSite=none` dipadukan dengan `Secure: true` memungkinkan pengiriman cookie lintas subdomain (`sentravax.id` ke `api.sentravax.id`) tanpa memicu pemblokiran cookie pihak ketiga oleh browser modern.

