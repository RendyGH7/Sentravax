# SENTRAVAX — CORE UI/UX & FEATURE DENSITY RULES

> **Aturan Wajib:** Desain antarmuka SENTRAVAX berorientasi pada **kepadatan fitur (feature density)**, kepraktisan, dan **minimalisme teks**. Aplikasi harus mudah digunakan oleh masyarakat umum maupun operator teknis tanpa terhalang teks deskriptif yang berlebihan.

---

## 1. PRINSIP UTAMA: ANTI WALL-OF-TEXT & HIGH SIGNAL-TO-NOISE

1. **Haramkan Paragraf Panjang (*No Wall of Text*)**:
   - Dilarang menempatkan teks pengantar panjang, deskripsi filosofis berbelit-belit, atau narasi artikel yang memakan ruang pandang pengguna.
   - Semua label, judul, dan keterangan harus ringkas, jelas, to the point, dan langsung dapat ditindaklanjuti (*action-oriented*).
   - Maksimum panjang penjelasan pendukung adalah 1 baris singkat (subjudul fungsional).

2. **Ruang Layar untuk Fitur Nyata (*Feature-First Layout*)**:
   - Setiap ruang yang tadinya terbuang untuk penjelasan naratif wajib digantikan oleh fitur yang bermanfaat:
     - Tombol aksi cepat (*Quick Actions* & *Pills*).
     - Widget data langsung (*Live Metrics*, *Weather/Water Level Gauges*).
     - Filter interaktif instan (*Segmented Controls*).
     - Alat kalkulasi cepat (*Interactive Sliders*, *Coordinate Grabber*).
     - Pintasan tanggap darurat (*1-Click SOS / Emergency Hotline*).

3. **Komunikasi Visual & Data Langsung (*Show, Don't Tell*)**:
   - Informasi disajikan dalam bentuk badge status yang tegas, progress bar, metrik angka tebal, dan peta interaktif.
   - Hindari menjelaskan apa yang sedang dilihat pengguna; berikan pengguna alat untuk memanipulasi atau memanfaatkan data tersebut.

---

## 2. STANDAR IMPLEMENTASI PER AREA

### A. Area Publik (Public Website)
- **Fokus Utama:** Akses darurat instan, kecepatan bertindak, dan visibilitas risiko.
- **Fitur yang Diutamakan:**
  - *Emergency Zero-Barrier Report*: Formulir pelaporan cepat dengan GPS instan dan kamera langsung.
  - *Quick Emergency Hotline Bar*: Telepon darurat 1-klik (BNPB 117, Ambulans 118, Damkar 113, Polisi 110, Basarnas 115).
  - *Interactive Risk Radar & Map*: Peta bahaya dengan filter multi-hazard satu ketukan.
  - *Quick Distance to Shelter*: Pencari titik kumpul terdekat langsung dari koordinat perangkat.
  - *Go-Bag Quick Checklist*: Checklist interaktif 13 barang siaga BNPB tanpa teks berulang.

### B. Portal Warga (User Portal)
- **Fokus Utama:** Manajemen kesiapsiagaan keluarga mandiri yang praktis dan efisien.
- **Fitur yang Diutamakan:**
  - *Readiness Dial*: Meter kesiapan keluarga visual dengan progress otomatis.
  - *Family Emergency Speed-Dial*: Daftar kontak darurat yang dapat ditelepon langsung.
  - *Multi-Location Watchlist Cards*: Kartu pemantauan ringkas untuk rumah, kantor, dan keluarga dengan indikator status aktif.
  - *One-Click Report Tracker*: Pelacak status laporan dengan timeline visual sederhana.

### C. Pusat Intelijen Spasial (Intelligence Center)
- **Fokus Utama:** Operasi tanggap darurat berbasis GIS, telemetri real-time, dan diseminasi cepat.
- **Fitur yang Diutamakan:**
  - *Dense GIS Command Toolbar*: Kontrol layer cepat (gempa, banjir, shelter, laporan warga).
  - *Threat Matrix & Operational Telemetry*: Angka kunci dan metrik risiko tanpa pengantar panjang.
  - *CAP Alert Dissemination Desk*: Form penyiaran peringatan ringkas dengan template siap pakai.
  - *AI Insight Snippets*: Ringkasan rekomendasi tindakan taktis dengan indikator kekuatan bukti numerik.

### D. Konsol Admin (Admin Workspace)
- **Fokus Utama:** Pengawasan tata kelola, moderasi cepat, dan efisiensi manajemen data.
- **Fitur yang Diutamakan:**
  - *Quick Moderation Actions*: Verifikasi / tolak laporan warga dalam satu klik dari tabel.
  - *Shelter & Facility Registry*: Manajemen shelter dengan status operasional instan.
  - *System Health Monitor*: Status PostGIS, antrean worker, dan sinkronisasi eksternal langsung.

---

## 3. CEKLIS KEPATUHAN PENGEMBANGAN

- [ ] Apakah teks deskripsi dapat dipersingkat menjadi kurang dari 10 kata?
- [ ] Apakah ada paragraf yang bisa diubah menjadi kartu metrik atau tombol interaktif?
- [ ] Apakah elemen antarmuka menyediakan aksi langsung (klik, toggle, filter, salin)?
- [ ] Apakah navigasi di perangkat mobile terasa lega dan tidak sesak oleh tulisan panjang?
- [ ] Apakah seluruh fitur canggih (GPS, spatial clustering, hotline darurat) mudah diakses tanpa harus membaca instruksi panjang?
