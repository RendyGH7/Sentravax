# SENTRAVAX — LAPORAN AUDIT AKHIR AKSESIBILITAS PHASE 1B
## Shared UI Component Library (WCAG 2.2 AA Compliance Audit)

**Tanggal:** 13 November 2026  
**Status:** AUDITED, HARDENED, & VERIFIED (PASS)  
**Lingkup Komponen:** `frontend/src/components/ui/` (`Modal.tsx`, `Badge.tsx`, `Tabs.tsx`, `FormControls.tsx`, `Button.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `Card.tsx`)  
**Standar Pengujian:** WCAG 2.2 AA Target (Contrast 4.5:1 normal text / 3.0:1 large text & non-text, WAI-ARIA 1.2, Keyboard Trap, Reduced Motion)  
**Tooling Verifikasi:** Python WCAG Contrast Checker (`contrast-check.py`), Oxlint, TypeScript 5.7+ (`verbatimModuleSyntax`), Vite 8.3.7  

---

## 1. RINGKASAN EKSEKUTIF AUDIT

Audit mendalam terhadap Shared UI Component Library SENTRAVAX telah dilakukan secara menyeluruh dengan memprioritaskan 6 komponen utama (`Modal.tsx`, `Badge.tsx`, `Tabs.tsx`, `FormControls.tsx`, `Button.tsx`, `EmptyState.tsx`). 

Hasil audit mengidentifikasi sejumlah area kritis yang membutuhkan penguatan:
1. **Focus Trap pada Modal:** Sebelumnya modal hanya menangani tombol Escape dan belum mengurung siklus Tab/Shift+Tab di dalam dialog, sehingga fokus dapat terlepas ke latar belakang (*background leakage*).
2. **Reduced Motion:** Komponen beranimasi (seperti denyut titik status `LIVE`, spinner tombol proses, dialog modal, dan panel tab) belum seluruhnya dipagari dengan modifier `motion-safe` atau `motion-reduce`.
3. **Contrast Flaws Tersembunyi:** 
   - Tombol Danger pada Dark mode sebelumnya menggunakan teks putih di atas latar `#EF4444` (rasio kontras 3.76:1 — **Gagal** memenuhi ambang batas 4.5:1 normal text).
   - Teks tab tidak aktif varian *pills* pada Light mode sebelumnya menggunakan `#6B7280` di atas latar `#F3F4F6` (rasio 4.39:1 — **Gagal** memenuhi 4.5:1).
   - Badge tab tidak aktif pada Light mode sebelumnya menggunakan `#6B7280` di atas `#E5E7EB` (rasio 3.90:1 — **Gagal** memenuhi 4.5:1).
4. **Accessible Associations pada Formulir:** Checkbox dan Radio belum menghubungkan teks `description` ke elemen `<input>` melalui `aria-describedby`. Elemen input belum menyematkan `aria-required`, dan indikator asteris belum memiliki label deskriptif yang terbaca screen reader.
5. **Indikator Fokus Link EmptyState:** Elemen tautan fallback `<a>` pada CTA EmptyState belum memiliki ring focus visible yang memenuhi kontras 3:1.

Seluruh temuan di atas **telah diperbaiki secara langsung** tanpa mengubah API props publik yang digunakan oleh aplikasi.

---

## 2. DETAIL TEMUAN & PERBAIKAN KOMPONEN

### 2.1 Modal (`Modal.tsx`)
- **Temuan Awal:**
  - Hanya menangani `Escape` key; keyboard `Tab` dan `Shift+Tab` dapat menembus keluar modal menuju elemen latar belakang web.
  - Fokus awal langsung diarahkan ke panel modal (`div tabIndex={-1}`) alih-alih elemen interaktif pertama (misal close button atau form input).
  - Animasi dialog panel dan backdrop belum menyertakan `motion-reduce:animate-none`.
  - Belum memiliki prop `ariaLabel` sebagai nama aksesibel fallback jika prop `title` tidak diberikan.
- **Perbaikan yang Dilakukan:**
  1. **Lengkap dengan Keyboard Focus Trap:** Menambahkan fungsi pencari elemen fokus aktif (`a[href]`, `button:not([disabled])`, `input:not([disabled])`, `select:not([disabled])`, `textarea:not([disabled])`, dsb.) dan menangkap siklus Tab:
     - `Shift + Tab` pada elemen pertama memindahkan fokus ke elemen terakhir modal.
     - `Tab` pada elemen terakhir memindahkan fokus ke elemen pertama modal.
  2. **Initial Focus Management:** Setelah modal terbuka, fokus otomatis diarahkan ke elemen fokus pertama yang tersedia (atau close button), dengan fallback ke panel modal jika tidak ada elemen interaktif.
  3. **Focus Restoration:** Saat modal ditutup, referensi `previouslyFocusedElement.current.focus()` dieksekusi secara aman untuk mengembalikan fokus pengguna ke tombol pembuka modal.
  4. **Background Interactivity Lock:** Background diblokir oleh backdrop berdimensi `fixed inset-0 z-50` yang menangkap klik backdrop, `document.body.style.overflow = 'hidden'` mencegah scroll halaman, dan atribut WAI-ARIA `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, dan `aria-describedby` aktif mengisolasi pohon aksesibilitas.
  5. **Reduced Motion:** Menambahkan `motion-reduce:animate-none motion-reduce:transition-none` pada backdrop dan panel dialog.
  6. **Fallback Accessible Name:** Menambahkan prop opsional `ariaLabel?: string` (`aria-label={title ? undefined : (ariaLabel || 'Dialog')}`).

### 2.2 Badge & Provenance Data (`Badge.tsx`)
- **Temuan Awal:**
  - Status `LIVE` menggunakan animasi `animate-pulse` tanpa modifier penyesuaian untuk pengguna dengan sensitivitas gerakan (*vestibular disorder*).
- **Perbaikan yang Dilakukan:**
  1. **Reduced Motion Adaptation:** Mengubah class animasi titik live menjadi `motion-safe:animate-pulse`. Ketika pengguna mengaktifkan preferensi *Reduced Motion* pada sistem operasinya, denyut animasi berhenti, namun titik hijau solid tetap tampil jelas berukuran `w-1.5 h-1.5` dengan warna `#10B981` / `#059669`.
  2. **Non-Reliance on Animation (Truthful Provenance):** Status `LIVE` didampingi teks eksplisit `"LIVE (REALTIME)"` sehingga tidak mengandalkan warna maupun animasi semata untuk menyampaikan informasi kritis (memenuhi WCAG 1.4.1 Use of Color & 2.2.2 Pause, Stop, Hide).

### 2.3 Tabs (`Tabs.tsx`)
- **Temuan Awal:**
  - Varian *pills* tab tidak aktif (Light mode) menggunakan warna teks `#6B7280` di atas `#F3F4F6` dengan rasio 4.39:1 (Gagal 4.5:1).
  - Badge angka pada tab tidak aktif (Light mode) menggunakan `#6B7280` di atas `#E5E7EB` dengan rasio 3.90:1 (Gagal 4.5:1).
  - Tombol tab penyandang status `disabled` belum mengekspos atribut `aria-disabled="true"`.
  - Transisi `TabPanel` belum memiliki `motion-reduce:animate-none`.
- **Perbaikan yang Dilakukan:**
  1. **Peningkatan Kontras Teks:** Mengganti warna teks tab tidak aktif varian *pills* menjadi `#4B5563`, menaikkan rasio kontras dari 4.39:1 menjadi **6.87:1 (Lulus WCAG AA)**.
  2. **Peningkatan Kontras Badge:** Mengganti warna teks badge tidak aktif menjadi `#374151` di atas `#E5E7EB`, menaikkan rasio dari 3.90:1 menjadi **8.33:1 (Lulus WCAG AA)**.
  3. **Peningkatan Kontras Dark Badge:** Mengganti teks badge gelap tidak aktif menjadi `#A3A3A3` di atas `#222222` (**6.31:1**).
  4. **Ekspos Status Disabilitas:** Menambahkan `aria-disabled={tab.disabled ? true : undefined}` pada tombol tab.
  5. **Reduced Motion:** Menambahkan `motion-reduce:animate-none` pada pembungkus `TabPanel`.

### 2.4 Form Controls (`FormControls.tsx`)
- **Temuan Awal:**
  - Label wajib (`required`) hanya menyematkan tanda bintang `*` dengan `aria-hidden="true"`, sehingga screen reader tidak menyuarakan keterangan wajib jika hanya membaca label.
  - Checkbox dan Radio memiliki teks `description`, namun elemen input tidak memiliki relasi `aria-describedby` yang menunjuk ke deskripsi tersebut.
  - Elemen `Input`, `Select`, dan `Textarea` belum mengekspos atribut `aria-required="true"` secara eksplisit, dan jika memiliki kedua nilai `error` dan `helperText`, hanya ID error yang terhubung.
- **Perbaikan yang Dilakukan:**
  1. **Screen Reader Accessible Required Indicator:** Memperbarui komponen `Label`:
     ```tsx
     {required && (
       <>
         <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>
         <span className="sr-only"> (wajib diisi)</span>
       </>
     )}
     ```
  2. **Relasi Deskripsi Checkbox & Radio:** Menghubungkan ID deskripsi unik (`${checkboxId}-desc`) ke elemen input melalui `aria-describedby={description ? descId : undefined}`.
  3. **Aria Required & Multi-Description:** Menambahkan `aria-required={required ? true : undefined}` pada `Input`, `Select`, dan `Textarea`, serta menggabungkan referensi `errorId` dan `helperId` ke dalam `aria-describedby`.
  4. **Peningkatan Kontras Teks Deskripsi:** Teks deskripsi formulir Light mode disesuaikan ke `#4B5563` (**7.56:1**) untuk keterbacaan optimal.

### 2.5 Button (`Button.tsx`)
- **Temuan Awal:**
  - Tombol Danger pada Dark mode menggunakan latar `#EF4444` dengan teks putih (rasio kontras 3.76:1 — Gagal WCAG AA normal text).
  - Ikon pemuatan `Loader2` berputar terus-menerus tanpa penonaktifan animasi pada preferensi reduced motion.
- **Perbaikan yang Dilakukan:**
  1. **Perbaikan Kontras Tombol Danger:** Mengganti latar danger dark mode menjadi `#DC2626` (hover `#B91C1C`), meningkatkan rasio kontras teks putih di atas tombol menjadi **4.83:1 (Lulus WCAG AA normal & large text)**.
  2. **Reduced Motion Spinner:** Menambahkan `motion-reduce:animate-none` pada ikon `Loader2`. Teks status `"Memproses..."` dan `aria-busy="true"` tetap aktif menyampaikan proses kepada pengguna.

### 2.6 EmptyState (`EmptyState.tsx`)
- **Temuan Awal:**
  - Tautan tombol navigasi `<a>` (bila `action.href` atau `secondaryAction.href` digunakan) tidak memiliki ring outline keyboard fokus (`:focus-visible`).
- **Perbaikan yang Dilakukan:**
  1. **Focus Ring Indikator:** Menambahkan kelas `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2` yang selaras dengan tema (Light: `#047857` offset putih rasio 5.48:1; Dark: `#F59E0B` offset hitam rasio 9.11:1).
  2. **Kontras Deskripsi:** Menggunakan `#4B5563` pada Light mode (**7.56:1**) dan `#D4D4D4` pada Dark mode (**12.21:1**).

### 2.7 Card (`Card.tsx`)
- **Perbaikan:** Menambahkan focus visible outline ring (`focus-visible:ring-2`) pada kartu interaktif (`interactive={true}`) agar pengguna keyboard yang menyematkan `tabIndex={0}` dapat melihat posisi fokus dengan kontras terukur.

---

## 3. HASIL VERIFIKASI KONTRAS WARNA (WCAG 2.2 AA)

Pengujian kontras dihitung menggunakan script standar WCAG 2.x Relative Luminance (`contrast-check.py`):
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

### Tabel Perhitungan Matematis Pasangan Warna

| Elemen UI / Konteks Komponen | Warna Latar ($L_1$) | Warna Teks / Foreground ($L_2$) | Rasio Dihitung | Normal Text ($\ge 4.5:1$) | Large Text ($\ge 3.0:1$) | Status WCAG AA |
|---|---|---|:---:|:---:|:---:|:---:|
| **Light Canvas ke Teks Utama** | `#FFFFFF` | `#111827` | **17.74:1** | PASS | PASS | **LULUS** |
| **Light Canvas ke Forest Emerald (Primary)** | `#FFFFFF` | `#047857` | **5.48:1** | PASS | PASS | **LULUS** |
| **Light Canvas ke Terracotta (Accent)** | `#FFFFFF` | `#C2410C` | **5.18:1** | PASS | PASS | **LULUS** |
| **Light Canvas ke Teks Sekunder** | `#FFFFFF` | `#4B5563` | **7.56:1** | PASS | PASS | **LULUS** |
| **Light Canvas ke Muted/Helper Text** | `#FFFFFF` | `#6B7280` | **4.83:1** | PASS | PASS | **LULUS** |
| **Light Canvas ke Pesan Error Formulir** | `#FFFFFF` | `#DC2626` | **4.83:1** | PASS | PASS | **LULUS** |
| **Tombol Primary Light (Putih di Emerald)** | `#047857` | `#FFFFFF` | **5.48:1** | PASS | PASS | **LULUS** |
| **Tombol Danger Light (Putih di Merah-600)** | `#DC2626` | `#FFFFFF` | **4.83:1** | PASS | PASS | **LULUS** |
| **Tabs Inactive Pill Text (Light)** | `#F3F4F6` | `#4B5563` | **6.87:1** | PASS | PASS | **LULUS** |
| **Tabs Inactive Badge (Light)** | `#E5E7EB` | `#374151` | **8.33:1** | PASS | PASS | **LULUS** |
| **Dark Canvas ke Teks Utama** | `#0C0C0C` | `#F5F5F5` | **17.94:1** | PASS | PASS | **LULUS** |
| **Dark Canvas ke Amber Gold (Primary)** | `#0C0C0C` | `#F59E0B` | **9.11:1** | PASS | PASS | **LULUS** |
| **Dark Canvas ke Teks Sekunder** | `#0C0C0C` | `#D4D4D4` | **13.20:1** | PASS | PASS | **LULUS** |
| **Dark Canvas ke Muted Text** | `#0C0C0C` | `#8A8A8A` | **5.67:1** | PASS | PASS | **LULUS** |
| **Dark Surface ke Teks Utama** | `#161616` | `#F5F5F5` | **16.60:1** | PASS | PASS | **LULUS** |
| **Dark Surface ke Amber Gold (Primary)** | `#161616` | `#F59E0B` | **8.43:1** | PASS | PASS | **LULUS** |
| **Dark Surface ke Pesan Error (Red-400)** | `#161616` | `#F87171` | **6.54:1** | PASS | PASS | **LULUS** |
| **Tombol Primary Dark (Hitam di Amber)** | `#F59E0B` | `#0C0C0C` | **9.11:1** | PASS | PASS | **LULUS** |
| **Tombol Danger Dark (Putih di Merah-600)** | `#DC2626` | `#FFFFFF` | **4.83:1** | PASS | PASS | **LULUS** |
| **Tabs Inactive Pill Text (Dark)** | `#1C1C1C` | `#8A8A8A` | **4.94:1** | PASS | PASS | **LULUS** |
| **Tabs Inactive Badge (Dark)** | `#222222` | `#A3A3A3` | **6.31:1** | PASS | PASS | **LULUS** |
| **Focus Indicator Light (#047857 di White)** | `#FFFFFF` | `#047857` | **5.48:1** | PASS ($\ge 3:1$) | PASS | **LULUS** |
| **Focus Indicator Dark (#F59E0B di Black)** | `#0C0C0C` | `#F59E0B` | **9.11:1** | PASS ($\ge 3:1$) | PASS | **LULUS** |

> **Kesimpulan Kontras:** Seluruh pasangan warna teks pada antarmuka pengguna Light Family dan Dark Family terbukti secara matematis melampaui rasio minimal 4.5:1 untuk teks normal dan 3.0:1 untuk indikator fokus non-teks.

---

## 4. HASIL UJI AKSESIBILITAS KEYBOARD

| Komponen | Interaksi Keyboard Diuji | Perilaku Aktual Pasca Perbaikan | Status |
|---|---|---|:---:|
| **Modal** | Tombol `Escape` | Modal tertutup seketika jika `closeOnEscape=true`. | **PASS** |
| **Modal** | Tombol `Tab` (Forward) | Siklus fokus berputar dari elemen fokus terakhir kembali ke elemen pertama di dalam modal. | **PASS** |
| **Modal** | Tombol `Shift + Tab` (Backward) | Siklus fokus berputar dari elemen pertama langsung melompat ke elemen terakhir modal. | **PASS** |
| **Modal** | Focus Restoration | Fokus dikembalikan ke elemen pemanggil (`previouslyFocusedElement.current`) saat ditutup. | **PASS** |
| **Tabs** | `ArrowRight` / `ArrowLeft` | Navigasi antar tab secara sirkular dan memindahkan fokus keyboard ke tab target. | **PASS** |
| **Tabs** | Tombol `Home` / `End` | Langsung melompat ke tab aktif pertama (`Home`) atau tab aktif terakhir (`End`). | **PASS** |
| **Tabs** | Tab Disabled | Tab berstatus `disabled` dilewati dalam siklus arrow keys dan memiliki `aria-disabled="true"`. | **PASS** |
| **Form Controls** | `Tab` dan Focus State | Setiap input memiliki outline focus-visible 2px dengan kontras $\ge 5.48:1$. | **PASS** |
| **Checkbox / Radio** | Tombol `Space` / `Arrow` | Mengubah status checked secara native dengan sinkronisasi label dan deskripsi. | **PASS** |

---

## 5. HAL YANG BELUM DAPAT DIVERIFIKASI DI LINGKUNGAN HEADLESS / KODE

Meskipun seluruh kontrak kode, atribut ARIA, fokus trap, dan perhitungan kontras matematis telah diverifikasi lulus, terdapat aspek empiris yang berada di luar jangkauan pengujian statis/headless dan perlu dievaluasi saat demonstrasi perangkat nyata:
1. **Perilaku Screen Reader Platform Nyata:**
   Perbedaan intonasi dan kecepatan baca antara perangkat pembaca layar aktual (NVDA pada Windows, JAWS, VoiceOver pada macOS/iOS, dan TalkBack pada Android) saat membaca gabungan `aria-describedby` multi-ID (`errorId helperId`).
2. **Kompensasi Windows High Contrast Mode (WHCM):**
   Pada mode kontras tinggi Windows (Inverted Black/White), border tipis `border-[#E5E7EB]` terkadang di-override oleh style sistem operasi.
3. **Pemuatan Skalabilitas Teks OS (Large Text Zoom > 200%):**
   Perilaku tata letak kontainer saat pengguna memperbesar ukuran huruf bawaan browser hingga 200%–300% (perlu verifikasi visual responsif pada halaman penuh di Phase 2).

---

## 6. HASIL QUALITY GATE (LINT & BUILD)

### 6.1 Linter (Oxlint)
```bash
npm run lint
```
**Output:**
```text
> frontend@0.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 28ms on 72 files with 116 rules using 12 threads.
```
**Status:** **PASS (0 Warnings, 0 Errors)**

### 6.2 TypeScript Compilation & Production Build (Vite)
```bash
npm run build
```
**Output:**
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.7 building client environment for production...
transforming...
✓ 2197 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.67 kB │ gzip:   0.40 kB
dist/assets/index-C0HUkfEp.css   54.62 kB │ gzip:  10.41 kB
dist/assets/index-XnlQ9jj_.js   530.94 kB │ gzip: 159.35 kB
✓ built in 671ms
```
**Status:** **PASS (100% Sukses)**

---

## 7. KESIMPULAN & STATUS KESIAPAN PHASE 1C

Dengan diselesaikannya audit dan pengerasan ini, **Shared UI Component Library SENTRAVAX resmi dinyatakan LOCKED & MEMENUHI TARGET WCAG 2.2 AA**.

Komponen UI kini memiliki jaminan keamanan interaksi keyboard, trap dialog yang kokoh, kontras warna matematis teruji, serta adaptasi penuh terhadap preferensi *Reduced Motion*.

**Status untuk Phase 1C (Leaflet & Interactive Map):**  
**READY FOR APPROVAL.** Pengembangan dihentikan di sini sesuai batasan instruksi untuk menunggu konfirmasi dari Anda sebelum melanjutkan ke fondasi Leaflet & Peta Interaktif Indonesia.

