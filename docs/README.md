# SENTRAVAX — INDEKS & TATA KELOLA DOKUMENTASI (DOCUMENTATION INDEX)

**Status Proyek:** Backend Verified & Locked (90 tests) | Frontend Phase 1 Hardened  
**Terakhir Diperbarui:** 12 November 2026  
**Standar Arsitektur:** React 19 + TypeScript (Frontend) <-> Laravel 13 + PostgreSQL 18 + PostGIS 3.7 (Backend)  

Selamat datang di repositori dokumentasi resmi **SENTRAVAX**. Dokumen ini berfungsi sebagai **Master Index** dan panduan navigasi untuk seluruh developer dan AI Engineering Agent agar tidak terjadi kebingungan (*hallucination* / *context drift*) pada setiap tahapan pengembangan.

---

## 1. PANDUAN CEPAT AI AGENT (TASK-TO-DOC ROUTING)

Ketika mengerjakan tugas tertentu, **HANYA BACA** dokumen primer yang relevan di bawah ini:

| Fokus Tugas yang Dikerjakan | Dokumen Wajib Dibaca | Keterangan / Scope |
|---|---|---|
| **Membuat/Mengubah UI & Komponen Frontend** | [`design_SENTRAVAX_revised.md`](./design_SENTRAVAX_revised.md) | **SSOT Desain**: Token warna, tipografi, visual family (Light vs Dark), Anti-Slop rules. |
| **Integrasi Endpoint & Kontrak Data API** | [`backend-api-documentation.md`](./backend-api-documentation.md) | **SSOT API**: Kontrak 73 rute, request/response schema, parameter, error codes. |
| **Alur & Fitur Siaga Warga (User Portal)** | [`community-first-features.md`](./community-first-features.md) | **SSOT Fitur Warga**: Spesifikasi kalkulator risiko, tas siaga, rencana keluarga, simulasi. |
| **Autentikasi, Session, & Keamanan Akses** | [`authentication-security-report.md`](./authentication-security-report.md) | **SSOT Autentikasi**: Sanctum Stateful Session Cookie, CSRF, CORS, 0 localStorage tokens. |
| **Logika Produk, Kebutuhan & Aturan Bisnis** | [`SENTRAVAX_Detailed_PRD_Antigravity.md`](./SENTRAVAX_Detailed_PRD_Antigravity.md) | **SSOT Produk**: Visi platform, alur multi-hazard, arsitektur data. |
| **Jadwal, Milestone, & Persiapan Lomba** | [`SENTRAVAX_Master_Project_Execution_Plan.md`](./SENTRAVAX_Master_Project_Execution_Plan.md) | **SSOT Roadmap**: Milestone kerja, checklist deliverables TRASPAC 2027. |
| **Deployment Server, PostGIS, & Operasional** | [`backend-deployment-guide.md`](./backend-deployment-guide.md) | **SSOT Deployment**: Setup PostgreSQL, PostGIS, Supervisor, Cron, Environment. |
| **Kriteria Pitch Deck & Video Demo Lomba** | [`ai_agent_guide_lomba_web_mobile_apps.md`](./ai_agent_guide_lomba_web_mobile_apps.md) | Panduan presentasi, video demo, dan standar penilaian juri. |

---

## 2. SINGLE SOURCE OF TRUTH (SSOT) BERDASARKAN KATEGORI

Setiap aspek teknis dalam SENTRAVAX memiliki **SATU sumber kebenaran mutlak**. Jika ditemukan perbedaan pernyataan antar file lama, acuan tertinggi mengikuti dokumen SSOT berikut:

```
                              ┌─────────────────────────┐
                              │     docs/README.md      │
                              │ (Indeks & Tata Kelola)  │
                              └────────────┬────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬───────────────────┐
         ▼                   ▼                     ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     PRODUK      │ │     DESAIN      │ │       API       │ │    KEAMANAN     │
│     (PRD)       │ │  (Design System)│ │  (API Contract) │ │ (Auth Hardened) │
│   PRD_v1.0.md   │ │design_revised.md│ │backend-api-doc.md│ │auth-security.md │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### A. Kategori Spesifikasi Produk & Roadmap
- **[`SENTRAVAX_Detailed_PRD_Antigravity.md`](./SENTRAVAX_Detailed_PRD_Antigravity.md)** — **[SSOT Produk]**  
  *Deskripsi:* Kebutuhan fungsional dan non-fungsional, arsitektur multi-hazard, integrasi data BMKG/BNPB/FIRMS.  
  *Catatan Tata Kelola:* Skema role telah disederhanakan menjadi **3 role resmi** (`admin`, `intelligence`, `user`). Referensi lama tentang `analyst` atau `operator` telah dikonsolidasikan.
- **[`SENTRAVAX_Master_Project_Execution_Plan.md`](./SENTRAVAX_Master_Project_Execution_Plan.md)** — **[SSOT Roadmap]**  
  *Deskripsi:* Rencana eksekusi kompetisi, pembagian milestone, dan target pengumpulan 30 Desember 2026.
- **[`community-first-features.md`](./community-first-features.md)** — **[SSOT Fitur Kesiapsiagaan Warga]**  
  *Deskripsi:* Metodologi Citizen-First Resilience, parameter kalkulasi skor risiko PostGIS, 5 kategori Tas Siaga Bencana (Go-Bag), dan alur simulasi interaktif.

### B. Kategori Desain & Antarmuka Pengguna
- **[`design_SENTRAVAX_revised.md`](./design_SENTRAVAX_revised.md)** — **[SSOT Desain & UX]**  
  *Deskripsi:* Panduan visual resmi dua keluarga:
  - **Light Family** (`#F9FAFB` / `#047857` Emerald / `#C2410C` Terracotta): Public Website & User Portal.
  - **Dark Family** (`#0C0C0C` Deep Black / `#161616` Charcoal / `#F59E0B` Amber Gold): Admin Dashboard & Intelligence Center.
  - Aturan Anti-Slop: Zero blue generik, zero decorative blur yang tidak perlu.

### C. Kategori Arsitektur API & Database
- **[`backend-api-documentation.md`](./backend-api-documentation.md)** — **[SSOT Kontrak API]**  
  *Deskripsi:* Kontrak 73 endpoint REST API v1 yang terkunci (*locked*), struktur parameter, header autentikasi, dan matriks hak akses.
- **[`backend-deployment-guide.md`](./backend-deployment-guide.md)** — **[SSOT Operasional Server]**  
  *Deskripsi:* Panduan instalasi PostgreSQL 18, ekstensi PostGIS 3.7, konfigurasi queue supervisor, task scheduler, dan setup lingkungan produksi.

### D. Kategori Keamanan & Autentikasi
- **[`authentication-security-report.md`](./authentication-security-report.md)** — **[SSOT Keamanan Autentikasi]**  
  *Deskripsi:* Implementasi Laravel Sanctum Stateful Session Cookie (HttpOnly), proteksi CSRF penuh tanpa blanket exception, eliminasi `localStorage` tokens, dan bukti kelulusan 12 alur uji keamanan.

### E. Kategori Panduan Kompetisi
- **[`ai_agent_guide_lomba_web_mobile_apps.md`](./ai_agent_guide_lomba_web_mobile_apps.md)** — **[Panduan Lomba]**  
  *Deskripsi:* Kriteria penilaian juri, struktur slide pitch deck, naskah demo video, dan persiapan babak final.

---

## 3. LAPORAN HISTORIS & AUDIT (HISTORICAL RECORDS)

Dokumen dalam kategori ini adalah **bukti historis** hasil audit dan pengujian pada setiap milestone. Dokumen ini **tidak boleh dihapus** sebagai rekam jejak teknis, tetapi tidak dijadikan acuan fitur baru jika telah ada dokumen SSOT yang lebih baru:

1. **[`backend-audit.md`](./backend-audit.md)**  
   *Status:* **SUPERSEDED** oleh `backend-verification-report.md` & `backend-api-documentation.md`.  
   *Peran:* Laporan audit teknis awal (12 Nov 2026 pagi) sebelum implementasi penambahan 33 method test dan skema baru.
2. **[`backend-verification-report.md`](./backend-verification-report.md)**  
   *Status:* **FINAL & LOCKED HISTORICAL RECORD**.  
   *Peran:* Bukti rekonsiliasi pengujian test suite repo (90 tests / 437 assertions lulus 100%), pembuktian integrasi live BMKG, dan verifikasi PostGIS.
3. **[`frontend-integration-report.md`](./frontend-integration-report.md)**  
   *Status:* **PHASE 1 INTEGRATION REPORT**.  
   *Peran:* Laporan fondasi frontend React 19, TypeScript types, Axios client, komponen UI foundation, dan pemetaan referensi visual mobile warga.

---

## 4. KLASIFIKASI STATUS DOKUMEN

| Dokumen | Kategori | Status | Keterangan |
|---|---|:---:|---|
| `docs/README.md` | Indeks & Tata Kelola | **ACTIVE (SSOT)** | Master index seluruh dokumentasi. |
| `docs/SENTRAVAX_Detailed_PRD_Antigravity.md` | Spesifikasi Produk | **ACTIVE (SSOT)** | Kebutuhan produk baseline. |
| `docs/design_SENTRAVAX_revised.md` | Desain & UX | **ACTIVE (SSOT)** | Design system & UX tokens. |
| `docs/backend-api-documentation.md` | Kontrak API | **LOCKED (SSOT)** | Kontrak 73 rute API v1. |
| `docs/authentication-security-report.md` | Keamanan Sistem | **ACTIVE (SSOT)** | Arsitektur session cookie & CSRF. |
| `docs/community-first-features.md` | Fitur Spesifik | **ACTIVE (SSOT)** | Spesifikasi Siaga Personal warga. |
| `docs/backend-deployment-guide.md` | Operasional Server | **ACTIVE (SSOT)** | Deployment manual PostgreSQL & PostGIS. |
| `docs/SENTRAVAX_Master_Project_Execution_Plan.md` | Rencana Kerja | **ACTIVE (SSOT)** | Roadmap pengerjaan hingga 30 Des 2026. |
| `docs/ai_agent_guide_lomba_web_mobile_apps.md` | Panduan Lomba | **ACTIVE** | Kriteria penilaian & pitch deck guide. |
| `docs/frontend-integration-report.md` | Laporan Implementasi | **HISTORICAL** | Laporan hasil Phase 1 Frontend Foundation. |
| `docs/backend-verification-report.md` | Laporan Pengujian | **HISTORICAL** | Bukti verifikasi backend 90 tests & BMKG live. |
| `docs/backend-audit.md` | Audit Baseline | **SUPERSEDED** | Audit awal sebelum implementasi selesai. |
| `README.md` (Root) | Repositori | **NEEDS UPDATE** | Ringkasan proyek dan quick-start. |
| `frontend/README.md` | Frontend Subproject | **NEEDS UPDATE** | Panduan dev server & build frontend. |

---

## 5. ATURAN KONSISTENSI UNTUK PENGEMBANGAN SELANJUTNYA

1. **Aturan Peran (Role Consistency):**
   Hanya gunakan 3 role resmi: **`admin`**, **`intelligence`**, dan **`user`**. Jangan pernah membuat role `super_admin`, `analyst`, atau `operator`.
2. **Aturan Autentikasi Website:**
   Gunakan session cookie HttpOnly via Laravel Sanctum. **Jangan menyimpan token di `localStorage`**.
3. **Aturan Penambahan Endpoint:**
   Jika ada kebutuhan endpoint baru di kemudian hari, wajib didaftarkan terlebih dahulu ke `docs/backend-api-documentation.md` sebelum dibuatkan implementasinya.
4. **Aturan Desain:**
   Wajib merujuk pada `docs/design_SENTRAVAX_revised.md`. Jangan menggunakan Tailwind warna biru generik atau efek AI slop.

