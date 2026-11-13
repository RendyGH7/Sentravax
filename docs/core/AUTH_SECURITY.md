# SENTRAVAX — AUTHENTICATION & SECURITY ARCHITECTURE

**Status:** ACTIVE & LOCKED (SINGLE SOURCE OF TRUTH)  
**Versi Arsitektur:** 2.0 (Security Hardened)  
**Frontend Stack:** React 19 + TypeScript + Axios (`withCredentials` & `withXSRFToken`)  
**Backend Stack:** Laravel 13 REST API + PostgreSQL 18 + PostGIS 3.7 + Sanctum  
**Laporan Audit Pengujian:** [`reports/authentication-security-report.md`](../reports/authentication-security-report.md)  

---

## 1. Prinsip Utama Keamanan Autentikasi

Arsitektur autentikasi SENTRAVAX memprioritaskan keamanan setara sistem perbankan / enterprise (*bank-grade security*) sesuai rekomendasi OWASP:

```
[Browser React SPA]
       │
       ├── 1. GET /sanctum/csrf-cookie  ──► [Set-Cookie: XSRF-TOKEN; laravel-session (HttpOnly)]
       │
       ├── 2. POST /api/v1/auth/login   ──► [Verifikasi CSRF via header X-XSRF-TOKEN]
       │      (withCredentials: true)       [Regenerasi Session ID & Cookie HttpOnly]
       │
       ├── 3. GET /api/v1/auth/me       ──► [Otorisasi otomatis via Cookie Session HttpOnly]
       │                                    [ZERO localStorage Token Storage!]
       │
       └── 4. POST /api/v1/auth/logout  ──► [Invalidasi Session di DB & Destruksi Cookie]

[Machine / CLI / IoT Clients]
       │
       └── POST /api/v1/auth/token      ──► [Diterbitkan Bearer Token 30-hari (Stateless)]
```

### Aturan Non-Negosiasi:
1. **Zero Browser `localStorage` Tokens:**
   Website React SPA SENTRAVAX **tidak pernah** menyimpan bearer token, session identifier, atau kredensial di dalam `localStorage`. Seluruh sesi browser dikelola eksklusif melalui cookie `HttpOnly` yang tidak dapat diakses oleh skrip JavaScript, sehingga kebal dari pencurian token akibat kerentanan XSS (*Cross-Site Scripting*).
2. **Perlindungan CSRF Utuh (No Blanket Bypasses):**
   Tidak ada pengecualian CSRF blanket (`api/*` atau `api/v1/*`). Seluruh rute mutasi stateful browser (`POST`, `PUT`, `DELETE`) wajib menyertakan token `X-XSRF-TOKEN` yang dicocokkan dengan session aktif.
3. **Pemisahan Jalur Machine API:**
   Integrasi non-browser (CLI admin, cron daemon, mobile IoT agent) dipisahkan secara tegas ke endpoint: `POST /api/v1/auth/token` yang menerbitkan Sanctum Personal Access Token (Bearer).
4. **Verifikasi Otorisasi Sisi Server:**
   Hak akses ketiga role (`admin`, `intelligence`, `user`) divalidasi langsung di kernel backend via middleware `EnsureUserHasRole` (`role:...`), bukan sekadar pembatasan rute frontend React.

---

## 2. Matriks Hak Akses Resmi 3 Role

| Role | Ruang Publik (`/`, `/map`) | Portal Warga (`/user/*`) | Admin Console (`/admin/*`) | Intelligence Center (`/intel/*`) |
|---|:---:|:---:|:---:|:---:|
| **`admin`** | ✓ Akses Penuh | ✓ Akses Penuh | ✓ **Akses Penuh** | ✗ Ditolak (403 Forbidden) |
| **`intelligence`** | ✓ Akses Penuh | ✓ Akses Penuh | ✗ Ditolak (403 Forbidden) | ✓ **Akses Penuh** |
| **`user`** | ✓ Akses Penuh | ✓ **Akses Penuh** | ✗ Ditolak (403 Forbidden) | ✗ Ditolak (403 Forbidden) |
| **`guest`** (Unauthenticated) | ✓ Akses Penuh | ✗ Diarahkan ke Login (401) | ✗ Diarahkan ke Login (401) | ✗ Diarahkan ke Login (401) |

> **PERINGATAN KEAMANAN:** Akses silang antara `admin` dan `intelligence` diblokir total oleh backend middleware (`403 Forbidden`).

---

## 3. Konfigurasi Backend (Laravel Sanctum)

### A. Middleware Pipeline (`backend/bootstrap/app.php`)
```php
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->validateCsrfTokens(except: [
            'sanctum/csrf-cookie',
            'api/v1/auth/token', // Non-browser machine token exchange (stateless)
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
```

### B. Konfigurasi Session & Cookie (`backend/.env`)
```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false    # Ubah menjadi true pada HTTPS produksi
SESSION_SAME_SITE=lax          # Ubah menjadi none pada produksi jika subdomain berbeda
SESSION_HTTP_ONLY=true
```

### C. CORS (`backend/config/cors.php`)
```php
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'supports_credentials' => true,
```

---

## 4. Konfigurasi Frontend (React 19 / Axios)

### A. Axios Client (`frontend/src/lib/axios.ts`)
```ts
export const apiClient = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});
```

### B. Urutan Autentikasi Stateful
1. **Pre-flight CSRF:** Panggil `ensureCsrfCookie()` (`GET /sanctum/csrf-cookie`).
2. **Submit Kredensial:** Kirim `POST /api/v1/auth/login`. Browser otomatis menyimpan cookie `laravel-session` (HttpOnly).
3. **Re-hidrasi Sesi:** Saat halaman di-refresh, `AuthProvider` memanggil `GET /api/v1/auth/me`. Backend mengenali session cookie HttpOnly dan mengembalikan profil pengguna tanpa membaca `localStorage`.
4. **Logout:** Kirim `POST /api/v1/auth/logout`. Backend menghapus record sesi di database (`sessions` table) dan meregenerasi token CSRF.

---

## 5. Konfigurasi Lingkungan Produksi (HTTPS Deployment)

| Parameter | Development (HTTP) | Produksi (HTTPS) | Penjelasan |
|---|---|---|---|
| `APP_URL` | `http://localhost:8000` | `https://api.sentravax.id` | URL backend resmi |
| `FRONTEND_URL` | `http://localhost:5173` | `https://sentravax.id` | Domain frontend SPA |
| `SESSION_DOMAIN` | `null` | `.sentravax.id` | Memungkinkan sharing cookie antar subdomain |
| `SESSION_SECURE_COOKIE` | `false` | `true` | Cookie hanya ditransmisikan via HTTPS |
| `SESSION_SAME_SITE` | `lax` | `none` | Mengizinkan transmisi lintas origin aman |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost,127.0.0.1` | `sentravax.id,www.sentravax.id` | Domain frontend resmi yang diakui |

