# SENTRAVAX — INDEKS & TATA KELOLA DOKUMENTASI (MASTER DOCUMENTATION INDEX)

**Status Proyek:** Backend Verified & Locked (90 tests) | Frontend Phase 1 Hardened (Cookie Auth)  
**Terakhir Diperbarui:** 12 November 2026  
**Standar Arsitektur:** React 19 + TypeScript (Frontend) <-> Laravel 13 + PostgreSQL 18 + PostGIS 3.7 (Backend)  

Selamat datang di repositori dokumentasi resmi **SENTRAVAX**. Dokumen ini berfungsi sebagai **Master Index** dan panduan navigasi bagi developer serta AI Engineering Agent agar terhindar dari disinformasi (*context drift*) maupun penggunaan referensi usang (*stale references*).

---

## 1. PANDUAN CEPAT AI AGENT (TASK-TO-DOC ROUTING)

Ketika Anda ditugaskan untuk mengerjakan modul tertentu, **HANYA BACA** dokumen primer yang relevan di bawah ini:

| Fokus Tugas yang Dikerjakan | Dokumen Wajib Dibaca | Keterangan / Scope Dokumen |
|---|---|---|
| **Membuat / Mengubah UI & Komponen Frontend** | [`core/DESIGN.md`](./core/DESIGN.md) | **SSOT Desain**: Token warna Light vs Dark, typography, visual family, Anti-Slop rules. |
| **Integrasi Endpoint & Kontrak Data API** | [`core/API_CONTRACT.md`](./core/API_CONTRACT.md) | **SSOT API**: Kontrak 73 rute terkunci, schema request/response, parameter, error codes. |
| **Alur & Fitur Siaga Warga (User Portal)** | [`core/COMMUNITY_FEATURES.md`](./core/COMMUNITY_FEATURES.md) | **SSOT Fitur Warga**: Kalkulator risiko PostGIS, Tas Siaga 5 kategori, simulasi bencana. |
| **Autentikasi, Session, & Keamanan Akses** | [`core/AUTH_SECURITY.md`](./core/AUTH_SECURITY.md) | **SSOT Keamanan**: Sanctum Stateful Session Cookie (HttpOnly), CSRF, 0 localStorage tokens. |
| **Kebutuhan Produk, Visi & Aturan Bisnis** | [`core/PRD.md`](./core/PRD.md) | **SSOT Produk**: Visi platform, alur multi-hazard, arsitektur data & pelaporan warga. |
| **Jadwal, Milestone, & Persiapan Lomba** | [`core/EXECUTION_PLAN.md`](./core/EXECUTION_PLAN.md) | **SSOT Roadmap**: Milestone pengerjaan, checklist deliverables TRASPAC 2027. |
| **Deployment Server, PostGIS, & Operasional** | [`core/DEPLOYMENT.md`](./core/DEPLOYMENT.md) | **SSOT Deployment**: Setup PostgreSQL 18, PostGIS 3.7, Supervisor, Cron, Environment. |
| **Kriteria Pitch Deck & Video Demo Lomba** | [`core/COMPETITION_GUIDE.md`](./core/COMPETITION_GUIDE.md) | Panduan presentasi, video walkthrough, dan standar penilaian juri. |
| **Audit Teknis & Bukti Pengujian Sebelumnya** | Folder [`reports/`](./reports/) | Bukti verifikasi historis test suite, BMKG live integration, dan 12 alur keamanan. |

---

## 2. STRUKTUR DIREKTORI DOKUMENTASI

```text
docs/
├── README.md                             # [Indeks Utama & Routing AI Agent]
│
├── core/                                 # [LIVING SINGLE SOURCES OF TRUTH - SSOT]
│   ├── PRD.md                            # Spesifikasi Kebutuhan Produk (PRD Baseline)
│   ├── DESIGN.md                         # Design System & UX Guidelines (Light & Dark)
│   ├── API_CONTRACT.md                   # Kontrak Terkunci 73 Rute REST API v1
│   ├── COMMUNITY_FEATURES.md             # Citizen-First Resilience & Siaga Personal
│   ├── AUTH_SECURITY.md                  # Arsitektur Keamanan Autentikasi (Cookie & CSRF)
│   ├── DEPLOYMENT.md                     # Panduan Setup PostgreSQL, PostGIS & Server
│   ├── EXECUTION_PLAN.md                 # Master Execution Roadmap TRASPAC 2027
│   └── COMPETITION_GUIDE.md              # Panduan Pitch Deck, Video Demo & Kriteria Juri
│
└── reports/                              # [HISTORICAL AUDIT & VERIFICATION REPORTS]
    ├── backend-audit.md                  # Audit Baseline Teknis Awal (SUPERSEDED)
    ├── backend-verification-report.md    # Laporan Verifikasi Final Backend (90 Tests / 437 Assert)
    ├── frontend-integration-report.md    # Laporan Integrasi Fondasi Frontend Phase 1
    ├── authentication-security-report.md # Laporan Pengerasan Keamanan & Uji 12 Alur
    ├── browser-authentication-e2e-report.md # Laporan Verifikasi Real Browser E2E (15/15 Skenario Lulus)
    ├── public-user-implementation-plan.md   # Rencana Implementasi Public Website & User Portal
    └── phase-1a-api-services-report.md      # Laporan Implementasi Phase 1A: Typed API Services Foundation
```

---

## 3. SINGLE SOURCE OF TRUTH (SSOT) BERDASARKAN KATEGORI

Setiap aspek teknis dalam SENTRAVAX memiliki **SATU sumber kebenaran mutlak**. Jika ditemukan perbedaan pernyataan antar dokumen lama, acuan tertinggi mengikuti dokumen SSOT aktif di bawah ini:

### A. Kategori Spesifikasi Produk & Roadmap
- **[`core/PRD.md`](./core/PRD.md)** — **[SSOT Produk]**  
  *Peran:* Mendefinisikan visi, masalah, target pengguna, dan kapabilitas platform.  
  *Konsolidasi Role:* Telah disederhanakan menjadi **3 role resmi**: `admin`, `intelligence`, dan `user`.
- **[`core/EXECUTION_PLAN.md`](./core/EXECUTION_PLAN.md)** — **[SSOT Roadmap]**  
  *Peran:* Rencana kerja utama penyelesaian sistem dari persiapan hingga deadline 30 Desember 2026.
- **[`core/COMMUNITY_FEATURES.md`](./core/COMMUNITY_FEATURES.md)** — **[SSOT Fitur Warga]**  
  *Peran:* Spesifikasi fungsional fitur unggulan Siaga Personal (cek risiko lokasi, rencana keluarga, tas siaga, simulasi interaktif).

### B. Kategori Desain & Antarmuka Pengguna
- **[`core/DESIGN.md`](./core/DESIGN.md)** — **[SSOT Desain & UX]**  
  *Peran:* Mengatur dua keluarga visual:
  - **Light Family** (`#F9FAFB` / `#047857` Forest Emerald): Public Website & User Portal.
  - **Dark Family** (`#0C0C0C` Deep Black / `#F59E0B` Amber Gold): Admin Dashboard & Intelligence Center.
  - Aturan Anti-Slop: Zero blue generik, zero decorative gradient yang berlebihan.

### C. Kategori Arsitektur API & Database
- **[`core/API_CONTRACT.md`](./core/API_CONTRACT.md)** — **[SSOT Kontrak API]**  
  *Peran:* Kontrak 73 endpoint REST API v1 terkunci, payload JSON, parameter query, status code, dan validasi request.
- **[`core/DEPLOYMENT.md`](./core/DEPLOYMENT.md)** — **[SSOT Operasional Server]**  
  *Peran:* Setup PostgreSQL 18 + PostGIS 3.7, instalasi dependency Composer, konfigurasi queue & cron task.

### D. Kategori Keamanan & Autentikasi
- **[`core/AUTH_SECURITY.md`](./core/AUTH_SECURITY.md)** — **[SSOT Keamanan Autentikasi]**  
  *Peran:* Mengatur arsitektur Laravel Sanctum Stateful Session Cookie (HttpOnly), perlindungan CSRF penuh, larangan penyimpanan token di browser `localStorage`, dan pemisahan jalur machine token via `/api/v1/auth/token`.

### E. Kategori Panduan Kompetisi
- **[`core/COMPETITION_GUIDE.md`](./core/COMPETITION_GUIDE.md)** — **[Panduan Lomba]**  
  *Peran:* Kriteria penilaian juri, struktur slide pitch deck, naskah demo video, dan kesiapan babak final TRASPAC 2027.

---

## 4. DOKUMEN LAPORAN HISTORIS (HISTORICAL AUDIT & VERIFICATION)

File di dalam [`reports/`](./reports/) dipertahankan sebagai **bukti historis** yang mencatat evolusi implementasi sistem:

1. **[`reports/backend-audit.md`](./reports/backend-audit.md)**  
   *Status:* **SUPERSEDED** oleh `core/API_CONTRACT.md` & `reports/backend-verification-report.md`.  
   *Peran:* Audit teknis awal (12 Nov 2026 pagi) sebelum implementasi milestone backend selesai.
2. **[`reports/backend-verification-report.md`](./reports/backend-verification-report.md)**  
   *Status:* **FINAL & LOCKED REPORT**.  
   *Peran:* Bukti kelulusan 100% test suite repositori (90 tests / 437 assertions) dan integrasi live BMKG.
3. **[`reports/frontend-integration-report.md`](./reports/frontend-integration-report.md)**  
   *Status:* **PHASE 1 IMPLEMENTATION REPORT**.  
   *Peran:* Laporan fondasi frontend React 19, Axios client, komponen UI foundation, dan pemetaan desain mobile warga.
4. **[`reports/authentication-security-report.md`](./reports/authentication-security-report.md)**  
   *Status:* **SECURITY HARDENING AUDIT REPORT**.  
   *Peran:* Hasil pengujian eksekusi 12 alur pengujian keamanan autentikasi (cookie HttpOnly, rotasi CSRF, dan pembatasan role).
5. **[`reports/browser-authentication-e2e-report.md`](./reports/browser-authentication-e2e-report.md)**  
   *Status:* **REAL BROWSER E2E VERIFICATION REPORT (PASS)**.  
   *Peran:* Hasil verifikasi end-to-end langsung pada Google Chrome peramban nyata membuktikan 15 skenario interaksi browser, cookie HttpOnly, zero token di localStorage, dan isolasi RBAC 100% lulus.
6. **[`reports/public-user-implementation-plan.md`](./reports/public-user-implementation-plan.md)**  
   *Status:* **PRE-IMPLEMENTATION AUDIT & IMPLEMENTATION PLAN**.  
   *Peran:* Rencana implementasi detail untuk Public Website dan User Portal (Siaga Personal), memetakan 11 endpoint publik dan 17 endpoint user, komponen reusable, urutan fase prioritas, dan mitigasi risiko teknis.
7. **[`reports/phase-1a-api-services-report.md`](./reports/phase-1a-api-services-report.md)**  
   *Status:* **PHASE 1A IMPLEMENTATION REPORT (PASS)**.  
   *Peran:* Laporan implementasi lapisan Typed API Services untuk Public Website dan User Portal (28 method typed), verifikasi struktur controller backend aktual, hasil audit lint dan build.

---

## 5. ATURAN KONSISTENSI PENGEMBANGAN (NON-NEGOTIABLE)

1. **Aturan Peran (Role Structure):**
   Hanya 3 role resmi yang diakui: **`admin`**, **`intelligence`**, dan **`user`**. Dilarang menambahkan role lama (`super_admin`, `analyst`, `operator`).
2. **Aturan Penyimpanan Kredensial:**
   Autentikasi web SPA berjalan melalui session cookie HttpOnly. **Dilarang keras menyimpan token atau user credential di `localStorage`**.
3. **Aturan Desain:**
   Wajib merujuk pada [`core/DESIGN.md`](./core/DESIGN.md). Desain area Public/Warga wajib bertema terang (*Light*), sedangkan Admin/Intelijen wajib bertema hitam netral (*Deep Black*).
