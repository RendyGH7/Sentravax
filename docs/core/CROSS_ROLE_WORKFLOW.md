# SENTRAVAX — Arsitektur Alur Pengguna Lintas-Role & Respons Terhubung
## Connected Emergency Response & Multi-Role Workflow Specification

**Dokumen:** Technical Architecture & UX Blueprint  
**Versi:** 2.0  
**Status:** Canonical Reference untuk Alur Lintas-Role & Ekosistem Terhubung  
**Tanggal:** 16 November 2026  
**Klasifikasi:** Core Engineering & Product Architecture

---

## 1. Filosofi & Visi: The Connected Response Ecosystem

SENTRAVAX bukan sekadar portal katalog informasi bencana atau dashboard analitik terisolasi. SENTRAVAX adalah **ekosistem intelijen kebencanaan dan respons krisis terpadu** yang menghubungkan empat area operasional dalam satu lingkaran komunikasi tertutup (*Closed-Loop Emergency Response Lifecycle*):

```
┌──────────────────────────────────────────────────────────────────────────┐
│              SENTRAVAX CLOSED-LOOP EMERGENCY RESPONSE LIFECYCLE          │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
  1. DETEKSI & LAPORAN               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │ • Warga (Guest & User): Fast-track Incident Report + Foto + Lokasi    │
  │ • Sumber Resmi: Sensor telemetry, BMKG, BPBD, satelit anomali termal │
  └──────────────────────────────────┬───────────────────────────────────┘
                                     │
  2. ANALISIS & TRIAGE               ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │ • AI Proactive Intelligence: PostGIS Auto-Clustering (≤2km, ≤2jam),  │
  │   deduplikasi, ekstraksi entitas, anomali sensor, prioritas keparahan│
  │ • Intelligence Center: Live Triage Board, Priority Inbox, Hotkeys    │
  └──────────────────────────────────┬───────────────────────────────────┘
                                     │
  3. VERIFIKASI & KOORDINASI         ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │ • Intelligence Officers: Evaluasi bukti foto, riwayat verifikasi     │
  │ • Penugasan Lapangan: Assignee unit reaksi cepat, Internal Notes     │
  └──────────────────────────────────┬───────────────────────────────────┘
                                     │
  4. TINDAKAN & DISEMINASI           ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │ • Eskalasi 1-Klik: Upgrade laporan ke Active Hazard Event di peta    │
  │ • Rapid Broadcast: Diseminasi Peringatan Dini CAP (<30 detik)        │
  │ • Admin Operations: Sinkronisasi data source, audit trail permanen   │
  └──────────────────────────────────┬───────────────────────────────────┘
                                     │
  5. UMPAN BALIK & MITIGASI          ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │ • Warga Publik: Peringatan real-time, rute evakuasi, titik kumpul    │
  │ • Pelapor: Pelacakan status laporan (tracking token / in-app update) │
  │ • Response Monitoring: Pemantauan SLA penyelesaian & resolusi akhir  │
  └──────────────────────────────────────────────────────────────────────┘
```

Prinsip mutlak: **Keempat area ini tidak boleh terasa seperti empat aplikasi terpisah**. Data laporan masyarakat, telemetri sensor, notifikasi darurat, dan status penanganan mengalir secara real-time dan tersinkronisasi di bawah pembagian hak akses peran yang presisi.

---

## 2. Matriks Pengalaman Masyarakat: Warga Tamu (Guest) vs Warga Terdaftar (User)

Dalam bencana alam, hambatan birokrasi dapat berakibat fatal. SENTRAVAX menerapkan prinsip **Emergency Zero-Barrier**: informasi keselamatan jiwa dan pelaporan darurat wajib tersedia instan tanpa paksaan login. Namun, sistem memberikan insentif personalisasi yang nyata bagi warga yang mendaftar.

| Kapabilitas / Fitur | Warga Tamu (Guest) | Warga Terdaftar (User) | Dasar Desain & Justifikasi Teknis |
|---|---|---|---|
| **Melihat Peta & Risiko Bencana** | **Ya** (Akses penuh) | **Ya** (Akses penuh) | Akses visual peta multi-hazard publik tidak boleh dibatasi. |
| **Melihat Peringatan Resmi (CAP)** | **Ya** (Akses penuh) | **Ya** (Akses penuh) | Peringatan dini bencana wajib terbuka untuk umum demi keselamatan. |
| **Panduan Kesiapsiagaan & Mitigasi** | **Ya** (Akses penuh) | **Ya** (Akses penuh) | Edukasi pra-bencana, saat bencana, dan pasca-bencana terbuka bebas. |
| **Checklist Tas Siaga Bencana (Go-Bag)** | **Ya** (Tersimpan di LocalStorage) | **Ya** (Tersinkronisasi Cloud) | Tamu tetap dapat mencentang perlengkapan tanpa akun; user disinkronkan ke server. |
| **Cek Risiko Mandiri (SIAGA PERSONAL)** | **Terbatas** (Cek 1 titik instan) | **Lengkap** (Multi-lokasi & profil) | Tamu dapat mengecek titik lokasi saat ini; user dapat menyimpan profil risiko lengkap. |
| **Membuat Laporan Insiden Masyarakat** | **Ya** (*Fast-Track Emergency* + verifikasi ringan) | **Ya** (Alur terverifikasi langsung) | Tamu dapat melapor darurat dengan perlindungan anti-spam; user otomatis terprofil. |
| **Memantau Laporan Pribadi** | **Terbatas** (Via Tracking Token) | **Lengkap** (Dashboard linimasa) | Tamu melacak via URL token acak aman; user melacak seluruh riwayat di akunnya. |
| **Rencana Kesiapsiagaan Keluarga** | **Tidak tersimpan** (Hanya template lokal) | **Ya** (Tersimpan & terintegrasi) | Membutuhkan akun untuk menyimpan kontak keluarga dan titik kumpul privat. |
| **Langganan Peringatan Wilayah** | **Tidak tersimpan** (Hanya sesi aktif) | **Ya** (Multi-region alert feed) | User dapat memantau rumah, kantor, sekolah anak, dan daerah kerabat. |
| **Akses Direktori Nomor Darurat 24/7** | **Ya** (Akses 1-klik 112, BPBD, SAR) | **Ya** (Akses 1-klik terintegrasi) | Panggilan darurat harus selalu tersedia di pojok layar kapan saja. |

---

## 3. Alur Penanganan Insiden 6 Tahap (The 6-Stage Incident Lifecycle)

Alur penanganan insiden memastikan kolaborasi yang presisi, tanggap, dan akuntabel antara masyarakat, analis intelijen kebencanaan, dan tim administrator:

```
  [Laporan Masuk] ──▶ [AI Triage & Clustering] ──▶ [Triage & Verifikasi]
                                                           │
  [Monitoring & Evaluasi] ◀── [Tindakan & Publikasi] ◀─────┘ [Penugasan & Koordinasi]
```

### Tahap 1: Laporan Masuk (Multi-Source Ingestion)
- **Sumber Data Terintegrasi:**
  - Laporan insiden masyarakat (dari Guest via jalur cepat atau User via akun terdaftar).
  - Telemetri sensor lingkungan (tinggi muka air sungai, sensor cuaca AWS, akselerograf gempa).
  - Feed resmi otoritas mitra (BMKG RSS/CAP, BPBD, anomali termal satelit LAPAN/NASA).
- **Proses Penerimaan:**
  - Validasi payload skema, pengecekan koordinat SRID 4326 PostGIS.
  - Sanitasi file gambar (penghapusan metadata EXIF privat, kompresi WebP, verifikasi MIME).
  - Pemberian status awal `pending` / `submitted`.

### Tahap 2: AI Proactive Intelligence & Spatial Clustering
- **Auto-Clustering & Deduplikasi PostGIS:**
  - Algoritma spasial mengelompokkan laporan baru menggunakan `ST_DWithin(location, geom, 2000)` (radius 2 km) dan jendela waktu pembaruan $\le 2$ jam.
  - Jika terdeteksi $\ge 3$ laporan warga dalam klaster yang sama, sistem secara otomatis menandai status **`incident_surge`** (lonjakan insiden lokal).
- **Analisis & Ekstraksi Entitas:**
  - Ekstraksi otomatis lokasi, perkiraan keparahan (*minor, moderate, severe, critical*), dan estimasi korban/kerusakan dari deskripsi warga.
  - Pemberian skor keparahan awal untuk pengurutan antrean kerja petugas.

### Tahap 3: Triage & Verifikasi (Intelligence Center)
- **Priority Inbox:**
  - Petugas Intelijen melihat antrean insiden yang diurutkan otomatis berdasarkan prioritas: *Critical Surge* di posisi paling atas, diikuti laporan berfoto dengan anomali sensor.
- **Split-Screen Verification Workspace:**
  - Layar kiri: Rincian laporan warga, bukti foto beresolusi tinggi, nomor kontak pelapor (jika validasi diperlukan), dan riwayat klaster serupa.
  - Layar kanan: Live Incident Map yang memperlihatkan titik insiden terhadap layer sensor cuaca, zonasi bahaya geologi, dan shelter terdekat.
- **Quick Actions (Keyboard Hotkeys):**
  - Petugas mengeksekusi keputusan dalam hitungan detik tanpa membuka dialog bertingkat:
    - `V`: **Verify** (Menyetujui laporan sebagai kejadian nyata).
    - `R`: **Request Info** (Mengirimkan notifikasi/SMS klarifikasi ke pelapor).
    - `J`: **Reject / Duplicate** (Menolak atau menautkan laporan ke klaster induk sebagai duplikat).
    - `E`: **Escalate** (Meneruskan insiden berkategori kritis ke meja komando/admin).

### Tahap 4: Penugasan & Koordinasi Lapangan
- **Assignment System:**
  - Laporan yang diverifikasi dapat ditugaskan ke petugas lapangan, posko BPBD wilayah, atau relawan tersertifikasi.
  - Kolom penugasan mencakup `assigned_to` (user ID), waktu penugasan, dan target respons (SLA).
- **Internal Notes Thread:**
  - Ruang koordinasi tertutup antar-petugas intelijen dan admin untuk mencatat temuan radio lapangan, kebutuhan logistik, dan asesmen cepat (*Rapid Damage Assessment*) tanpa terlihat oleh publik.

### Tahap 5: Tindakan & Publikasi (Dissemination & Escalation)
- **One-Click Incident Escalation:**
  - Dari laporan warga yang diverifikasi, petugas intelijen dapat menekan tombol **"Eskalasi ke Hazard Event Aktif"**.
  - Sistem otomatis membuat rekaman `hazard_events` resmi, memplot poligon radius dampak di peta publik, dan memperbarui status laporan menjadi `promoted`.
- **Rapid CAP Warning Broadcast (<30 Detik Dissemination):**
  - Templat peringatan resmi berstandar CAP (*Common Alerting Protocol*) yang siap disiarkan: memilih area terdampak, tingkat keparahan (*Severe/Extreme*), dan instruksi keselamatan.
  - Disiarkan serentak dalam <30 detik ke:
    1. Banner merah darurat di landing page publik dan portal warga.
    2. Pin berkedip pada peta interaktif.
    3. Browser push notification untuk seluruh warga yang memantau wilayah terdampak.

### Tahap 6: Monitoring, Evaluasi & Resolusi Akhir
- **Response Monitoring:**
  - Dashboard pengawasan memantau waktu respons rata-rata (*Mean Time to Acknowledge* / MTTA) dan waktu penyelesaian (*Mean Time to Resolve* / MTTR).
  - Peringatan visual kuning/merah jika terdapat laporan prioritas tinggi yang belum ditangani dalam waktu > 15 menit.
- **Incident Timeline & Audit Trail:**
  - Linimasa kronologis yang merekam setiap detik siklus hidup insiden: waktu lapor $\rightarrow$ waktu verifikasi $\rightarrow$ petugas pelaksana $\rightarrow$ waktu broadcast peringatan $\rightarrow$ waktu penanganan lapangan $\rightarrow$ resolusi penutupan insiden.

---

## 4. Delapan Fitur Operasional Kunci untuk Admin & Intelligence Center

| Fitur Operasional | Area Pengguna | Tujuan & Fungsi Utama | Indikator Kunci & Standar Desain |
|---|---|---|---|
| **1. Priority Inbox** | Intelligence & Admin | Menampilkan antrean insiden yang memerlukan tindakan segera; memisahkan noise dari krisis mendesak. | Badge warna kontras tinggi (*Critical Vermilion*, *Severe Amber*), filter cepat 1-klik, auto-refresh tanpa reload. |
| **2. Live Incident Map** | Intelligence | Peta situasional multi-hazard real-time yang memadukan titik laporan, poligon peringatan, sensor, dan rute evakuasi. | Layer toggle dinamis, cluster radius marker, mode layar penuh (*Situational Room View*). |
| **3. Quick Actions / Hotkeys** | Intelligence | Eksekusi tindakan triage instan (verifikasi, minta info, tolak, eskalasi) tanpa hambatan form berbelit. | Pintasan keyboard terintegrasi (`V`, `R`, `J`, `E`), feedback toast instan, konfirmasi mini ramah keyboard. |
| **4. Incident Timeline** | Intelligence & Admin | Rekaman kronologis jejak penanganan insiden dari pertama kali dilaporkan hingga dinyatakan selesai. | Linimasa vertikal rapi, stempel waktu UTC + zona lokal, identitas aktor dan bukti pendukung. |
| **5. Internal Notes** | Intelligence & Admin | Kolaborasi internal tim tanggap darurat untuk mencatat koordinasi lapangan yang bersifat rahasia/operasional. | Panel catatan terenkripsi, penandaan waktu, avatar petugas, isolasi penuh dari tampilan warga publik. |
| **6. Notification Center** | Semua Role | Saluran notifikasi proaktif berbasis peristiwa (*event-driven alerts*) untuk anomali sensor, surge, dan eskalasi. | Ikon kategori bahaya, penanda status terbaca/belum, tautan langsung ke berkas insiden terkait. |
| **7. Response Monitoring** | Admin & Koordinator | Pemantauan beban kerja tim dan waktu tanggap insiden untuk memastikan tidak ada laporan warga yang terabaikan. | Metrik SLA, timer berjalan sejak laporan diterima, peringatan keterlambatan penanganan (*breach alert*). |
| **8. Tamper-Evident Audit Trail** | Admin | Rekaman forensik sistem yang mencatat seluruh aksi kritis (perubahan role, penghapusan data, eskalasi event). | Format log terstruktur, IP address, user agent, data sebelum vs sesudah, perlindungan anti-tamper. |

---

## 5. Delapan Prinsip UX Lintas Platform (Unified UX Standards)

Setiap halaman dan interaksi di SENTRAVAX wajib memenuhi delapan prinsip pengalaman pengguna berikut:

1. **Minimum Steps (Langkah Minimal):**
   - Aksi-aksi penyelamatan jiwa (melihat rute evakuasi, membaca peringatan dini, melaporkan bahaya) diselesaikan dalam maksimal 2–3 interaksi. Tidak ada form bertingkat tanpa alasan teknis yang mutlak.
2. **One Clear Action (Satu Aksi Utama yang Tegas):**
   - Setiap layar memiliki tombol tindakan utama (*Primary CTA*) yang dominan dan kontras. Contoh di halaman peringatan: *"Buka Jalur Evakuasi Terdekat"*; di halaman triage petugas: *"Verifikasi Sekarang"*.
3. **Fast Access (Akses Cepat & Tanpa Halangan):**
   - Fitur darurat tidak boleh terkubur di dalam dropdown atau menu hamburger sekunder. Nomor kontak darurat 24/7 dan tombol Lapor Cepat selalu tersedia di pojok layar (*sticky emergency utility*).
4. **Real-Time Feedback (Umpan Balik Seketika):**
   - Setiap perubahan status, pengiriman laporan, atau evaluasi risiko memberikan indikator visual yang jelas (toast notifikasi, skeleton shimmer saat memuat, perubahan badge status real-time).
5. **No Dead Ends (Tanpa Jalan Buntu):**
   - Setiap kondisi error, data kosong (*empty state*), atau koneksi terputus wajib menyertakan penjelasan yang ramah dan aksi pemulihan konkret (misal: *"Coba lagi"*, *"Unduh panduan offline"*, atau *"Hubungi Hotline 112"*).
6. **Role-Based Simplicity (Kesesuaian Tampilan Peran):**
   - Masyarakat melihat visual yang bersih, ramah, dan bebas jargon; Petugas Intelijen melihat metrik telemetri padat dan alat analisis spasial; Admin melihat kontrol tata kelola dan audit yang tertata rapi.
7. **Human Verification (Verifikasi Manusia untuk Keputusan Berisiko):**
   - Kecerdasan buatan (AI) bertindak sebagai asisten pengelompok dan pemberi konteks. Keputusan penerbitan peringatan darurat ke publik, perubahan status verifikasi, dan evakuasi massal wajib disetujui manusia.
8. **Accessible Everywhere (Inklusif & Ramah Semua Kalangan):**
   - Nyaman digunakan pada ponsel spesifikasi rendah dan layar sentuh satu tangan (*thumb-zone ergonomics*). Memenuhi standar kontras tinggi WCAG 2.1 AA dan tipografi ramah lansia ($\ge 16$ px).

---

## 6. Audit Kesenjangan Aktual & Rencana Remediasi Arsitektur

Berdasarkan audit mendalam terhadap basis kode frontend dan backend saat ini:

### Temuan Kesenjangan (Gaps Identified)
1. **Rute Pelaporan Darurat Guest Belum Tersedia di Public API:**
   - Kondisi saat ini: `POST /api/v1/user/reports` mensyaratkan `auth:sanctum`.
   - Solusi: Sediakan endpoint publik `POST /api/v1/public/reports/emergency` dengan rate-limiting ketat, validasi nomor kontak/OTP ringan, dan pengembalian `tracking_token`.
2. **Kolom Penugasan Petugas (`assigned_to`) dan Catatan Internal:**
   - Kondisi saat ini: `community_reports` memiliki `verified_by` dan `moderation_notes`, tetapi belum memiliki kolom `assigned_to` terpisah.
   - Solusi: Manfaatkan kolom JSON `media` / atribut metadata terstruktur pada model tanpa merusak migrasi terkunci, atau sediakan relasi verifikasi bertahap via `report_verifications`.
3. **Komponen Reusable Hotline Darurat 24/7:**
   - Kondisi saat ini: Tombol panggilan darurat masih bersifat statis di beberapa halaman.
   - Solusi: Buat komponen floating `EmergencyHotlineWidget` universal yang mendeteksi nomor BPBD/SAR terdekat berbasis lokasi pengguna.
4. **Alur Transisi Guest ke Registered User:**
   - Kondisi saat ini: Setelah melapor, guest belum memiliki alur 1-klik untuk mendaftarkan akun dan mengklaim laporannya.
   - Solusi: Sertakan `claim_token` pada payload sukses pelaporan guest yang dapat ditautkan saat pengguna menekan tombol *"Simpan Laporan & Buat Akun"*.

Dokumen ini menjadi acuan baku untuk penyelesaian implementasi Public Pages (Phase 2B.4C) dan pengembangan modul operasional berikutnya.
