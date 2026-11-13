# SENTRAVAX — LAPORAN IMPLEMENTASI PHASE 1B
## Shared UI Component Library (Light & Dark Family)

**Tanggal:** 13 November 2026  
**Status:** IMPLEMENTED, TESTED, & VERIFIED (PASS)  
**Lingkup Komponen:** `frontend/src/components/ui/`  
**Framework & Tooling:** React 19, Vite, TypeScript 5.7+ (`verbatimModuleSyntax`), Tailwind CSS v4  
**Design Reference:** `docs/core/DESIGN.md` (Dual Visual Family: Light & Dark)  
**Prinsip Desain:** Anti-Slop (No generic blue, no neon, no emojis, truthful data provenance)

---

## 1. RINGKASAN EKSEKUTIF

Phase 1B membangun fondasi **Shared UI Component Library** SENTRAVAX yang dapat digunakan bersama oleh seluruh 4 area aplikasi:
1. **Public Website** (Visual Family: Light)
2. **User Portal / Siaga Warga** (Visual Family: Light)
3. **Admin Dashboard** (Visual Family: Dark)
4. **Intelligence Center** (Visual Family: Dark)

Setiap komponen dirancang dengan prop `theme?: 'light' | 'dark'` (default: `'light'`), memastikan konsistensi token warna, tipografi, interaksi keyboard, aksesibilitas WCAG AA, dan state transisi tanpa memerlukan dependensi library pihak ketiga yang berlebihan (seperti Radix UI atau Headless UI).

---

## 2. FILE YANG DIBUAT DAN DIUBAH

| Operasi | Path File | Keterangan |
|---|---|---|
| **Created** | `frontend/src/components/ui/Button.tsx` | Reusable button (5 varian, 3 ukuran, loading state, icon slots, theme support). |
| **Created** | `frontend/src/components/ui/Badge.tsx` | Status badge & Data Provenance indicator (`LIVE`, `SIMULATED`, `STATIC`, `STALE`, `UNAVAILABLE`). |
| **Created** | `frontend/src/components/ui/Card.tsx` | Composable card components (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). |
| **Created** | `frontend/src/components/ui/FormControls.tsx` | Form controls (`Label`, `FormErrorMessage`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`). |
| **Created** | `frontend/src/components/ui/Modal.tsx` | Accessible dialog modal (Escape listener, backdrop dismiss, focus management, body scroll lock). |
| **Created** | `frontend/src/components/ui/Tabs.tsx` | Accessible tab navigation & panel (`underline` & `pills`, full keyboard navigation Arrow/Home/End). |
| **Created** | `frontend/src/components/ui/Skeleton.tsx` | Shimmer loading placeholders (text, circular, rectangular, card, table) berbasis token CSS variables. |
| **Created** | `frontend/src/components/ui/EmptyState.tsx` | Clean empty state placeholder dengan icon Lucide, judul, deskripsi, CTA primary & secondary. |
| **Created** | `frontend/src/components/ui/index.ts` | Barrel export untuk seluruh 8 komponen UI dan tipe TypeScript terkait. |
| **Modified** | `docs/reports/phase-1a-api-services-report.md` | Rekonsiliasi jumlah method API services (Public: 11 method, User: 21 method, Total: 32 method, 28 endpoint URL). |

---

## 3. SPESIFIKASI DAN PROPS 8 KOMPONEN UI

### 3.1 Button (`Button.tsx`)
Komponen tombol serbaguna dengan dukungan state loading, penonaktifan, ikon kiri/kanan, dan dua visual family:
- **Props:**
  - `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
  - `size?: 'sm' | 'md' | 'lg'`
  - `theme?: 'light' | 'dark'`
  - `isLoading?: boolean`
  - `leftIcon?: React.ReactNode`
  - `rightIcon?: React.ReactNode`
  - `disabled?: boolean`
  - `React.ButtonHTMLAttributes<HTMLButtonElement>`
- **Design Tokens:**
  - *Light Family:* Primary menggunakan `#047857` (Forest Emerald) dengan hover `#065F46`; Secondary `#F3F4F6`; Danger `#DC2626`.
  - *Dark Family:* Primary menggunakan `#F59E0B` (Amber Gold) dengan teks gelap `#0C0C0C`; Secondary `#212121` border `#2C2C2C`; Danger `#EF4444`.
- **Aksesibilitas:** Menangani `aria-busy={isLoading}`, `disabled={isDisabled}`, dan ring focus adaptif (`focus-visible:ring-2`).

### 3.2 Badge (`Badge.tsx`)
Komponen badge untuk indikator status bahaya, prioritas, dan **Truthful Data Provenance**:
- **Props:**
  - `variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'`
  - `status?: 'LIVE' | 'SIMULATED' | 'STATIC' | 'STALE' | 'UNAVAILABLE'` (Data Freshness Status)
  - `size?: 'sm' | 'md'`
  - `theme?: 'light' | 'dark'`
  - `withDot?: boolean`
- **Integritas Provenance Data (Anti-Deceptive UI):**
  - `LIVE`: Titik hijau dengan animasi denyut (*pulse ping*) menandakan data telemetri real-time aktif.
  - `SIMULATED`: Titik ungu statis (tidak berkedip) untuk membedakan skenario simulasi dari kejadian nyata.
  - `STATIC`: Titik abu-abu netral untuk referensi statis (misal panduan BNPB).
  - `STALE`: Titik oranye peringatan untuk data yang melewati interval kesegaran toleransi.
  - `UNAVAILABLE`: Titik merah penanda data provider yang gagal terhubung.

### 3.3 Card (`Card.tsx`)
Sistem komponen kartu modular dan komposable:
- **Subkomponen:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Props:**
  - `Card`: `padding?: 'none' | 'sm' | 'md' | 'lg'`, `theme?: 'light' | 'dark'`, `hoverEffect?: boolean`.
  - `CardHeader`: `theme?: 'light' | 'dark'`.
  - `CardTitle`: `theme?: 'light' | 'dark'`.
  - `CardDescription`: `theme?: 'light' | 'dark'`.
  - `CardContent`: `className?: string`.
  - `CardFooter`: `theme?: 'light' | 'dark'`.
- **Design Tokens:**
  - *Light:* Background `#FFFFFF`, border `#E5E7EB`, shadow lembut `shadow-xs`.
  - *Dark:* Background `#161616`, border `#2C2C2C`, teks `#F5F5F5`.

### 3.4 Form Controls (`FormControls.tsx`)
Kumpulan elemen form terintegrasi dan konsisten:
- **Komponen:**
  - `Label`: Mendukung `required?: boolean`, `theme?: 'light' | 'dark'`.
  - `FormErrorMessage`: Pesan error berbasis `role="alert"` dengan ikon peringatan Lucide.
  - `Input`: Mendukung controlled input, `label`, `error`, `helperText`, `leftIcon`, `rightIcon`, `theme`.
  - `Select`: Native HTML select dengan custom arrow indicator, `options: SelectOption[]`, placeholder default, `error`, `theme`.
  - `Textarea`: Textarea multi-baris dengan auto-resize atau fixed rows, `error`, `theme`.
  - `Checkbox`: Custom styled checkbox dengan SVG checkmark dan ring focus jelas.
  - `Radio`: Accessible radio button dengan circular dot indicator.
- **Validasi Visual:** Border warna merah (`#DC2626` / `#EF4444`) saat error aktif, disertai pesan `FormErrorMessage` otomatis.

### 3.5 Modal (`Modal.tsx`)
Dialog modal ramah aksesibilitas (WAI-ARIA Dialog):
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `title?: string`
  - `description?: string`
  - `size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'`
  - `showCloseButton?: boolean`
  - `closeOnBackdropClick?: boolean`
  - `closeOnEscape?: boolean`
  - `theme?: 'light' | 'dark'`
- **Fitur Aksesibilitas:**
  - Listener tombol `Escape` untuk menutup dialog seketika.
  - Body scroll lock otomatis (`document.body.style.overflow = 'hidden'`) saat modal terbuka dan pemulihan saat tertutup.
  - Pengembalian fokus keyboard (*focus restoration*) ke elemen pemanggil saat modal ditutup.
  - Atribut ARIA `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, dan `aria-describedby`.

### 3.6 Tabs (`Tabs.tsx`)
Sistem navigasi tab horizontal berbasis keyboard:
- **Subkomponen:** `Tabs`, `TabPanel`.
- **Props:**
  - `tabs: TabItem[]` (`id`, `label`, `icon?`, `badge?`, `disabled?`)
  - `activeTab: string`
  - `onChange: (id: string) => void`
  - `variant?: 'underline' | 'pills'`
  - `theme?: 'light' | 'dark'`
- **Navigasi Keyboard Penuh (WAI-ARIA Tabs):**
  - Tombol `ArrowRight` / `ArrowLeft`: Berpindah tab secara sirkular.
  - Tombol `Home`: Langsung menuju tab pertama yang aktif.
  - Tombol `End`: Langsung menuju tab terakhir yang aktif.
  - Elemen panel menggunakan `role="tabpanel"` dengan kaitan `aria-labelledby`.

### 3.7 Skeleton (`Skeleton.tsx`)
Komponen animasi pemuatan data (*skeleton placeholder*):
- **Props:**
  - `variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table'`
  - `lines?: number` (untuk varian text dan table)
  - `columns?: number` (untuk varian table)
  - `theme?: 'light' | 'dark'`
  - `animate?: boolean`
- **Animasi:** Terintegrasi dengan utility Tailwind `animate-pulse` dan token shimmer yang selaras dengan tema canvas light dan dark.

### 3.8 EmptyState (`EmptyState.tsx`)
Komponen penanda state kosong yang informatif tanpa ilustrasi kartun generik:
- **Props:**
  - `icon?: React.ReactNode` (default: ikon Lucide `Inbox`)
  - `title: string`
  - `description?: string`
  - `action?: EmptyStateAction` (`label`, `onClick?`, `href?`, `variant?`, `icon?`)
  - `secondaryAction?: EmptyStateAction`
  - `theme?: 'light' | 'dark'`
  - `children?: React.ReactNode`

---

## 4. DESIGN TOKENS & ANTI-SLOP COMPLIANCE

| Kategori Desain | Implementasi Light Family | Implementasi Dark Family | Anti-Slop Safeguard |
|---|---|---|---|
| **Canvas / Background** | `#F9FAFB` | `#0C0C0C` | Tidak menggunakan background putih mentah menyilaukan atau hitam pekat tanpa hierarki |
| **Surface / Card** | `#FFFFFF` | `#161616` | Tidak ada gradient 3D atau neon drop shadows |
| **Border / Divider** | `#E5E7EB` / `#D1D5DB` | `#2C2C2C` / `#343434` | Border tajam dan terukur, ketebalan 1px konsisten |
| **Primary Accent** | `#047857` (Forest Emerald) | `#F59E0B` (Amber Gold) | **Zero generic blue (#2563EB/cyan)**; warna khas darurat dan pertahanan |
| **Danger / Alert** | `#DC2626` | `#EF4444` | Penanda bencana dan validasi form yang tegas |
| **Typography** | Inter / System Sans, slate/gray | Inter / System Sans, neutral | Tidak menggunakan font dekoratif atau display berlebihan |
| **Visual Provenance** | Label jelas status data | Label jelas status data | **Dilarang keras memalsukan data simulasi menjadi data live** |

---

## 5. HASIL VERIFIKASI BUILD & QUALITY GATE

### 5.1 Frontend Linter (Oxlint)
```bash
npm run lint
```
**Hasil:**
```text
> frontend@0.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 30ms on 72 files with 116 rules using 12 threads.
```
**Status:** **PASS (100% Bersih)**

### 5.2 TypeScript Compilation & Vite Production Build
```bash
npm run build
```
**Hasil:**
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.7 building client environment for production...
transforming...
✓ 2197 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.67 kB │ gzip:   0.40 kB
dist/assets/index-qqB4zprl.css   54.35 kB │ gzip:  10.33 kB
dist/assets/index-B08jLRP7.js   530.94 kB │ gzip: 159.35 kB
✓ built in 743ms
```
**Status:** **PASS (100% Sukses)**

---

## 6. BATASAN IMPLEMENTASI (SCOPE BOUNDARIES)

1. **Leaflet & Peta Interaktif:**  
   Belum diimplementasikan pada tahap 1B ini sesuai instruksi kerja. Peta interaktif Leaflet dialokasikan secara terisolasi pada **Phase 1C**.
2. **Halaman Publik & Portal Pengguna:**  
   Implementasi halaman penuh (`HomePage`, `CheckLocationPage`, `GoBagChecklistPage`, dsb.) akan dibangun pada **Phase 2** menggunakan komponen UI dari library ini.
3. **Database & API Backend:**  
   Tidak ada modifikasi backend, migrasi database, atau pengubahan rute API pada tahap ini.

---

## 7. KESIAPAN PHASE 1C (LEAFLET & INTERACTIVE MAP)

Komponen UI Library (`Button`, `Badge`, `Card`, `Modal`, `Tabs`, `Skeleton`, `EmptyState`) telah siap diintegrasikan dengan komponen visual peta pada **Phase 1C** (`DisasterMap`, layer GeoJSON, popup tooltip, filter bahaya).

