# SENTRAVAX - design.md

Sistem desain untuk platform kecerdasan geospasial dan ketahanan masyarakat SENTRAVAX.
Dokumen ini adalah sumber kebenaran untuk semua keputusan visual dan UX. Dibaca bersama `SENTRAVAX_Detailed_PRD_Antigravity.md` (isi produk) dan panduan lomba (deliverable).

Bahasa antarmuka utama: Bahasa Indonesia. Zona waktu tampilan: zona pengguna (default WIB).

---

## 0. Urutan prioritas aturan

Jika dua dokumen bertentangan, ikuti urutan ini:

1. Keselamatan dan kejujuran data (PRD bagian 3, 6, 18).
2. Dokumen ini (design.md).
3. PRD bagian 10 (UI/UX).
4. Preferensi gaya pribadi agent.

Penyesuaian yang sudah diputuskan terhadap PRD bagian 10.1:

| PRD | Keputusan di dokumen ini | Alasan |
|---|---|---|
| Aksen cyan/electric blue | Aksen `Glacier` biru baja yang diredam (#86B6CE) | Pemilik proyek melarang warna neon |
| Hindari glassmorphism berlebihan | Glass dipakai terbatas dan fungsional, hanya di atas peta/foto | Pemilik proyek meminta tema glass; PRD meminta keterbacaan |
| Tipografi Inter atau Geist | Schibsted Grotesk + IBM Plex Sans | Inter/Geist adalah default yang paling sering muncul di produk buatan AI |

---

## 1. Mandat Skill Anti Slop (WAJIB, TANPA PENGECUALIAN)

Agent WAJIB menggunakan **Skill Anti Slop** sejak baris kode UI pertama sampai proyek selesai, termasuk perbaikan kecil setelah pendaftaran lomba dibuka.

Aturan penggunaan:

1. **Sebelum** membuat atau mengubah komponen, halaman, ikon, ilustrasi, copy, atau animasi, muat dan baca Skill Anti Slop. Jangan mengandalkan ingatan dari sesi sebelumnya.
2. **Selama** pengerjaan, nilai setiap keputusan visual terhadap skill ini. Jika sebuah elemen terasa seperti "default yang akan dibuat siapa saja", ganti dengan pilihan yang spesifik untuk SENTRAVAX.
3. **Sesudah** pengerjaan, jalankan tinjauan Anti Slop terhadap hasil (screenshot desktop dan mobile) sebelum menyatakan tugas selesai. Hapus satu elemen dekoratif yang tidak melayani tujuan.
4. Setiap laporan fase (PRD 18.5) wajib memuat bagian "Tinjauan Anti Slop": apa yang diperiksa, apa yang diubah, dan alasannya.
5. Jika Skill Anti Slop tidak dapat dimuat, **berhenti dan beri tahu pemilik proyek**. Jangan melanjutkan pekerjaan UI dengan asumsi sendiri.
6. Skill ini tidak boleh diabaikan demi kecepatan, demo, atau kemudahan. Aturan di bagian 3 dokumen ini berlaku sebagai cadangan minimum meskipun skill tidak aktif.

Pemeriksaan wajib setiap pull request yang menyentuh UI:

- Apakah ada gradien dekoratif? (harus nol)
- Apakah ada emoji atau karakter pictograf? (harus nol)
- Apakah semua kartu memiliki radius, bayangan, dan bobot visual yang sama? (tidak boleh)
- Apakah ada label huruf kapital berjarak lebar di atas setiap judul? (tidak boleh)
- Apakah ada angka besar dengan label kecil dan aksen gradien sebagai "hero stat"? (tidak boleh kecuali benar-benar pilihan terbaik dan berdata nyata)
- Apakah copy terdengar seperti brosur? (tulis ulang)

---

## 2. Identitas dan prinsip desain

**Karakter:** ruang kendali yang tenang. Seperti instrumen survei presisi, bukan game sci-fi dan bukan situs startup. Mewah lewat ketelitian: ruang kosong yang disengaja, garis halus, material kaca yang jujur, dan tipografi yang kuat. Bukan lewat kilau.

**Satu momen yang diingat juri:** globe 3D berbasis data nyata yang berputar ke Indonesia lalu menurun menjadi medan 3D (terrain) dengan panel kaca berisi insight berlabel. Semua elemen lain tenang dan disiplin agar momen ini menonjol.

Prinsip:

1. **Peta adalah kanvas.** Panel adalah kaca melayang di atasnya, bukan halaman berisi kartu.
2. **Kejujuran terlihat.** Sumber, waktu observasi, status kesegaran, dan label simulasi selalu terlihat, tidak disembunyikan di tooltip.
3. **Satu hal per layar adalah fokus.** Hierarki dibuat lewat ukuran, bobot, dan ruang, bukan lewat warna cerah.
4. **Mudah untuk semua kalangan.** Anak muda, orang tua, pengguna ponsel murah, dan pengguna dengan keterbatasan penglihatan harus bisa menyelesaikan tugas inti tanpa bantuan.
5. **Struktur adalah informasi.** Border, garis, nomor, dan label hanya dipakai jika mengodekan sesuatu (kelas data, urutan langkah, status).

---

## 3. Larangan mutlak

| Dilarang | Catatan |
|---|---|
| Emoji dalam bentuk apa pun | UI, copy, toast, seed data, log, commit message, README |
| Karakter pictograf sebagai ikon (centang, bintang, peringatan, panah teks) | Gunakan komponen ikon SVG |
| Gradien dekoratif | Tidak ada di latar, tombol, kartu, teks, border, atau glow |
| Warna neon dan glow berpendar | Tidak ada `box-shadow` berwarna terang, tidak ada `drop-shadow` neon |
| Kombinasi ungu-biru-pink, atau hitam pekat dengan satu aksen hijau/oranye terang | Penanda khas buatan AI |
| Latar krem dengan serif dan aksen terakota | Penanda khas buatan AI |
| Hitam murni `#000` dan putih murni `#FFF` sebagai latar atau teks utama | Pakai token |
| Ilustrasi hasil generator gambar AI, orang palsu, stock "tim tertawa di kantor" | Aset harus dibuat sendiri atau dari sumber nyata berlisensi |
| Grid kartu identik sebagai struktur utama halaman | Lihat bagian 10 |
| Label kecil HURUF KAPITAL berjarak lebar di atas judul | Gunakan sentence case |
| Judul dengan satu kata diberi warna/italik berbeda | Penanda khas |
| Teks tombol dengan panah ("Mulai ->") | Aksi dijelaskan dengan kata kerja |
| Font monospace untuk label data kecil | Pakai angka tabular dari IBM Plex Sans |
| Pola "A . B . C" (titik tengah) sebagai penghubung metadata | Pakai pemisah ruang atau kolom |
| Animasi masuk fade-up di setiap section dan hover-lift di setiap kartu | Lihat bagian 12 |
| Statistik dampak tanpa sumber | PRD 5.1 |
| Tombol dekoratif tanpa aksi | PRD 10.4: tampilkan "Belum tersedia" |
| Placeholder "Lorem ipsum", nama "John Doe", "Acme" | Gunakan data demo realistis yang berlabel simulasi |

Gradien yang diizinkan hanya satu: **rampa warna pada legenda data peta** (skala sekuensial diskret atau kontinu) karena itu pengodean data, bukan dekorasi.

---

## 4. Warna

Warna dibangun dari bahan dunia geospasial: air dalam, kaca, baja survei, lumut, tanah liat, dan getah. Tidak ada warna yang berpendar.

### 4.1 Tema gelap "Deep Strait" (default)

| Token | Nama | Hex | Peran |
|---|---|---|---|
| `--ink-950` | Petrol Deep | `#0C1A22` | Latar aplikasi, di bawah peta |
| `--ink-900` | Strait | `#112430` | Permukaan solid dasar |
| `--ink-800` | Hull | `#183241` | Permukaan terangkat, input |
| `--ink-700` | Sounding | `#234255` | Garis tebal, hover solid |
| `--text-1` | Frost | `#E8EEF1` | Teks utama |
| `--text-2` | Mist | `#A9BAC4` | Teks sekunder |
| `--text-3` | Fog | `#8CA0AC` | Teks tersier (minimal pada permukaan `ink-900`) |
| `--accent` | Glacier | `#86B6CE` | Aksi utama, fokus, tautan |
| `--accent-2` | Verdigris | `#5FA89B` | Aksen sekunder, status positif/terverifikasi |
| `--warn` | Ochre | `#E0A23A` | Peringatan |
| `--crit` | Madder | `#EE7C73` | Kritis |
| `--unknown` | Slate | `#94A3AD` | Tidak diketahui / tidak tersedia |
| `--ok` | Lichen | `#8FB98A` | Segar / berhasil |

Teks di atas `--accent` (tombol utama) memakai `--ink-950`.

### 4.2 Tema terang "Daylight"

Disediakan sebagai pilihan pengguna dan mengikuti `prefers-color-scheme`. Penting untuk pengguna lanjut usia dan penggunaan di luar ruangan.

| Token | Hex |
|---|---|
| `--ink-950` (latar) | `#EAF0F2` |
| `--ink-900` | `#FFFFFF` (permukaan solid, hanya sebagai permukaan) |
| `--ink-800` | `#DCE5E9` |
| `--text-1` | `#12212B` |
| `--text-2` | `#3F5461` |
| `--text-3` | `#51646F` |
| `--accent` | `#24627F` (teks tombol `#FFFFFF`) |
| `--accent-2` | `#2A7165` |
| `--warn` | `#7F5200` |
| `--crit` | `#B13A32` |

Rasio kontras sudah dihitung: semua pasangan teks/latar di atas minimal 4,5:1 pada permukaan yang ditentukan (teks utama di atas 11:1). Jangan mengubah hex tanpa menghitung ulang.

### 4.3 Aturan pemakaian warna

- Warna aksen maksimal pada satu aksi utama per layar. Selebihnya tombol sekunder bergaris.
- Warna status (`warn`, `crit`, `ok`) hanya untuk status. Tidak untuk dekorasi.
- Warna tidak pernah menjadi satu-satunya pembeda. Selalu pasangkan dengan bentuk, ikon, dan teks (PRD 10.3).
- Tidak ada warna di luar token. Nilai heksadesimal mentah di komponen dilarang.

### 4.4 Kelas informasi (PRD 3.1): dibedakan lewat bentuk, bukan hanya warna

Lima kelas harus tidak mungkin tertukar. Pembeda utamanya adalah **bentuk penanda dan gaya lencana**; warna menunjukkan **tingkat urgensi**, bukan kelas.

| Kelas | Bentuk di peta | Lencana | Label wajib |
|---|---|---|---|
| Peringatan resmi | Belah ketupat solid dengan cincin luar 2px | Terisi penuh | Nama otoritas dan waktu terbit |
| Data observasi | Lingkaran solid | Bergaris, isi transparan | Nama sumber dan waktu observasi |
| Laporan warga | Cincin berongga dengan titik tengah; garis putus-putus jika belum diverifikasi, garis solid dengan tanda centang SVG jika terverifikasi | Bergaris putus-putus atau solid | Status verifikasi |
| Insight SENTRAVAX | Segitiga solid; area terkait diarsir pola garis diagonal | Terisi dengan sudut potong | Versi aturan dan batasan |
| Data simulasi | Bentuk asli dengan overlay arsir silang dan opasitas turun | Pita permanen "Data simulasi" | Tidak dapat ditutup |

Skala urgensi (satu hue per level, dipasangkan dengan ikon jumlah garis 1-4):

| Level | Nama | Warna |
|---|---|---|
| 1 | Informasi | `--accent` |
| 2 | Waspada | `--warn` |
| 3 | Siaga | `--warn` dengan ikon level 3 dan border tebal |
| 4 | Kritis | `--crit` |
| - | Tidak diketahui | `--unknown` |

### 4.5 Status kesegaran (PRD 6.4)

| Status | Teks tampil | Penanda | Warna |
|---|---|---|---|
| FRESH | Segar | Titik solid | `--ok` |
| DELAYED | Tertunda | Setengah lingkaran | `--warn` |
| STALE | Usang | Titik berongga + garis coret | `--warn` |
| UNAVAILABLE | Tidak tersedia | Silang pada lingkaran | `--unknown` |
| SIMULATED | Simulasi | Arsir silang | `--accent-2` dengan arsir |
| UNKNOWN | Tidak diketahui | Tanda tanya dalam lingkaran | `--unknown` |

Selalu tampilkan teks relatif ("Diperbarui 4 menit lalu") dan waktu absolut lengkap dengan zona (misalnya "04 Nov 2026, 14.32 WIB") saat disorot atau di panel detail.

### 4.6 Rampa data peta

Untuk legenda risiko dan curah hujan gunakan rampa persepsi seragam yang ramah buta warna (diskret 5 langkah), dari pasir pucat `#E7DCC3` ke madder tua `#8E2F2A` melewati ochre dan terakota. Rampa ini hanya muncul di dalam peta dan legenda, tidak di UI umum. Setiap rampa harus lolos simulasi deuteranopia dan protanopia.

---

## 5. Glassmorphism (versi terkendali)

Glass di SENTRAVAX adalah material fungsional untuk panel yang melayang di atas peta. Bukan hiasan.

### 5.1 Resep

Semua permukaan kaca memakai **warna datar transparan**, bukan gradien:

```css
.glass-1 {            /* panel utama di atas peta */
  background: rgb(17 36 48 / 0.68);
  backdrop-filter: blur(18px) saturate(115%);
  border: 1px solid rgb(232 238 241 / 0.10);
  box-shadow: inset 0 1px 0 rgb(232 238 241 / 0.06),
              0 12px 32px rgb(5 12 16 / 0.35);
}
.glass-2 {            /* kontrol kecil melayang (zoom, filter) */
  background: rgb(17 36 48 / 0.58);
  backdrop-filter: blur(12px) saturate(110%);
  border: 1px solid rgb(232 238 241 / 0.08);
}
.glass-3 {            /* modal dan drawer */
  background: rgb(12 26 34 / 0.82);
  backdrop-filter: blur(28px) saturate(115%);
  border: 1px solid rgb(232 238 241 / 0.12);
}
```

Versi terang memakai `rgb(255 255 255 / 0.72)` dengan garis `rgb(18 33 43 / 0.10)`.

### 5.2 Aturan keras

1. Glass hanya di atas peta, foto, atau globe 3D. Di atas latar polos, pakai permukaan solid `ink-900`.
2. Teks tidak boleh bergantung pada apa yang ada di belakang kaca. Opasitas minimum menjamin kontras 4,5:1 pada kasus terburuk (peta paling terang). Uji dengan layer terang aktif.
3. Maksimal tiga lapis kaca bertumpuk pada satu layar.
4. Fallback wajib: jika `backdrop-filter` tidak didukung, atau `prefers-reduced-transparency: reduce` aktif, ubah ke permukaan solid `ink-900` tanpa transparansi.
5. Pada perangkat lemah, kurangi blur (`blur(8px)`) dan jangan menganimasikan elemen yang memiliki `backdrop-filter`.
6. Tidak ada kaca di dalam kaca untuk teks panjang (formulir, tabel moderasi, artikel panduan). Area baca memakai permukaan solid.

---

## 6. Tipografi

| Peran | Keluarga | Bobot | Catatan |
|---|---|---|---|
| Judul dan angka sorotan | **Schibsted Grotesk** | 600, 700 | Berwatak editorial: cocok untuk produk yang menjual kepercayaan informasi |
| UI, isi, tabel, formulir | **IBM Plex Sans** | 400, 500, 600 | Sangat terbaca, mendukung angka tabular, tampak teknis tanpa mono |

- Muat lewat paket self-host (`@fontsource-variable/schibsted-grotesk`, `@fontsource/ibm-plex-sans`), bukan CDN, untuk kecepatan dan privasi. Gunakan `font-display: swap` dan subset Latin.
- Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Angka pada tabel, metrik, dan waktu: `font-variant-numeric: tabular-nums`.

Skala tipografi (rasio ~1,2; ukuran dasar 16px):

| Token | Ukuran / tinggi baris | Pemakaian |
|---|---|---|
| `display` | 56 / 1.05 (mobile 38) | Hero landing saja |
| `h1` | 36 / 1.15 (mobile 28) | Judul halaman |
| `h2` | 26 / 1.25 | Judul panel |
| `h3` | 20 / 1.3 | Sub judul |
| `body` | 16 / 1.6 | Isi default |
| `body-sm` | 14 / 1.5 | Metadata, caption (minimum untuk teks informasi) |
| `micro` | 12 / 1.4 | Hanya atribusi peta dan hak cipta |

Aturan:

- Panjang baris isi maksimal 72 karakter.
- Sentence case di seluruh antarmuka. Tidak ada teks huruf kapital kecuali nama merek pada logo dan singkatan resmi (BMKG, BNPB).
- Jangan meminjam ukuran di bawah 14px untuk informasi yang dibutuhkan untuk mengambil keputusan.
- Judul hero memperlakukan tipografi sebagai elemen desain: ukuran besar, tracking rapat (-1,5%), bobot 700, rata kiri. Seluruh judul satu warna.
- Pengguna dapat memperbesar ukuran teks (100 / 115 / 130%) dari pengaturan, dan tata letak harus bertahan sampai 200% zoom browser.

---

## 7. Ruang, bentuk, dan elevasi

- Unit ruang: 4px. Skala: 4, 8, 12, 16, 24, 32, 48, 72, 112.
- Radius dibedakan menurut hierarki, bukan satu nilai untuk semua:
  - Lencana dan chip: 6px
  - Kontrol dan input: 10px
  - Panel: 16px
  - Modal dan drawer: 24px
  - Penanda peta mengikuti bentuk kelas informasi (bagian 4.4)
- Elevasi dengan tiga tingkat nyata: datar (di atas peta), melayang (`glass-1`), dan modal (`glass-3`). Tidak ada bayangan abu-abu seragam di setiap kartu.
- Garis 1px pada `rgb(232 238 241 / 0.10)` sebagai pemisah struktural. Tidak ada garis dekoratif.
- Grid desktop: 12 kolom, margin 24px, gutter 16px. Panel peta menempel pada tepi viewport (full-bleed).

---

## 8. Aset: ikon, foto, 3D, logo

Prinsip: setiap aset harus dibuat sendiri, dikodekan dari data nyata, atau diambil dari sumber nyata berlisensi yang jelas. Catat setiap aset eksternal di `ASSETS.md` (sumber, URL, lisensi, atribusi).

### 8.1 Logo

- Wordmark SENTRAVAX dalam Schibsted Grotesk 700, huruf kapital, tracking +4% (satu-satunya tempat huruf kapital berjarak).
- Tanda grafis dibangun sendiri sebagai SVG pada grid 32px: lingkaran garis 2px (bumi), satu busur meridian off-center, dan satu titik solid kecil di perpotongan yang mewakili sinyal yang terdeteksi. Hanya satu warna (`--text-1`, titik `--accent`).
- Sediakan varian horizontal, tanda saja, dan monokrom. Area bebas minimum sama dengan tinggi titik.

### 8.2 Ikon

- **Ikon hazard dan merek dibuat sendiri** (SVG, grid 24px, garis 1,75px, ujung membulat, sudut konsisten): banjir, cuaca ekstrem, kebakaran/anomali termal, longsor, gempa, kekeringan, laporan warga, insight, peringatan resmi, kesegaran.
- Ikon utilitas umum (cari, tutup, filter, pengaturan) boleh memakai satu set sumber terbuka (disarankan Lucide) dengan ketebalan garis yang disamakan dengan ikon buatan sendiri. Jangan mencampur dua set.
- Setiap ikon yang tidak disertai teks wajib memiliki `aria-label`. Navigasi utama selalu ikon **dan** teks.

### 8.3 Aset 3D (semua berbasis data, tidak dekoratif)

| Aset | Cara membangun | Sumber data / aset |
|---|---|---|
| Globe hero | three.js atau globe MapLibre; tekstur malam hari menampilkan cahaya kota nyata, tekstur siang untuk lautan dan awan | NASA Visible Earth (Blue Marble, Black Marble); periksa ketentuan penggunaan media NASA dan cantumkan kredit |
| Medan 3D Indonesia | MapLibre GL dengan `terrain` dan hillshade dari DEM; kemiringan kamera 55-65 derajat pada mode "Medan" | DEM terbuka (misalnya terrain tiles di AWS Open Data atau Copernicus DEM); verifikasi lisensi dan atribusi |
| Bangunan 3D | Ekstrusi bangunan dari data OSM, hanya saat zoom tinggi pada area perkotaan | OpenStreetMap (atribusi wajib, ODbL) |
| Titik gempa | Cincin gelombang 3D pada permukaan globe/peta, ukuran mengikuti magnitudo | Data gempa asli dari sumber resmi; jika demo, berlabel simulasi |
| Pita arus data (opsional) | Garis busur tipis antarsumber dan lokasi pengguna di halaman landing | Hanya jika mewakili aliran data nyata; jika tidak, hapus |

Aturan 3D:

- 3D harus menjelaskan sesuatu (relief menunjukkan potensi longsor, globe menunjukkan cakupan). Jika dihapus dan tidak ada informasi yang hilang, itu dekorasi, hapus.
- Material: tanpa kilau logam, tanpa pantulan chrome, tanpa objek melayang abstrak, tanpa bola energi.
- Pencahayaan satu arah lembut (matahari), bayangan nyata, tanpa bloom.
- Targetkan 60 fps pada perangkat menengah. Sediakan mode "Peta datar" otomatis jika WebGL tidak tersedia atau perangkat lemah, dan sebagai pilihan manual.
- Atur `prefers-reduced-motion`: globe statis menghadap Indonesia, tanpa rotasi.
- Tekstur dan model dikompres (KTX2/WebP, glTF dengan Draco). Total aset hero di bawah 3 MB.

### 8.4 Foto dan ilustrasi

- Foto hanya dari fotografer nyata dengan lisensi jelas (Unsplash, Pexels, Wikimedia Commons, arsip pemerintah yang boleh dipakai). Pilih dokumentasi nyata (lanskap, cuaca, infrastruktur, relawan), bukan stock bergaya korporat.
- Perlakuan foto seragam: koreksi warna ke arah palet (desaturasi ringan, bayangan ke `ink-900`), tanpa overlay gradien. Jika teks perlu di atas foto, pakai panel kaca atau blok solid.
- Ilustrasi (misalnya alur Data > Analisis > Insight > Tindakan) digambar sendiri sebagai SVG dari bentuk geometris dan ikon sistem. Dilarang memakai ilustrasi AI atau paket ilustrasi generik.

### 8.5 Peta dasar

- Gaya peta dibuat sendiri (MapLibre style JSON) agar menyatu dengan palet: daratan `ink-900`, laut `ink-950`, jalan `ink-700`, label `text-2`. Jangan memakai gaya peta bawaan penyedia.
- Peta dasar vektor terbuka (misalnya OpenFreeMap atau Protomaps/PMTiles yang di-host sendiri). Verifikasi lisensi dan batas pemakaian sebelum dipakai. Atribusi selalu terlihat (12px).
- Peta versi terang memakai gaya terpisah, bukan inversi warna.

---

## 9. Peta dan Earth Intelligence

- Peta memenuhi seluruh area kerja. Panel kaca melayang di tepi: kiri (layer), kanan (detail), bawah (legenda dan filter waktu).
- Layer awal (PRD 5.4) masing-masing punya satu ikon, satu bentuk penanda (4.4), dan satu baris status kesegaran di daftar layer.
- Marker padat digabung dengan klaster. Klaster menampilkan jumlah dan kelas dominan lewat bentuk.
- Panel detail menampilkan urutan tetap: judul, kelas informasi, urgensi, ringkasan, waktu dan kesegaran, sumber, penjelasan skor (jika ada), batasan analisis, tindakan.
- Layer gagal dimuat: baris di daftar layer berubah menjadi status "Tidak tersedia" dengan tombol "Coba lagi". Peta tetap bisa dipakai.
- Lokasi laporan warga di peta publik digeneralisasi (PRD 5.7); tampilkan lingkaran ketidakpastian, bukan titik presisi.
- Kontrol sentuh: tombol zoom, lokasi saya, dan layer minimal 44x44px, jarak antartombol 8px.
- Mode tampilan: Peta datar, Globe, Medan 3D. Pilihan tampil sebagai kontrol segmen berlabel.

---

## 10. Tata letak

Hindari tampilan "dashboard sebagai tumpukan kartu statistik" (PRD 5.3). Dashboard menjawab lima pertanyaan PRD dengan urutan baca tetap.

### 10.1 Workspace desktop (>= 1200px)

```
+------+---------------------------------------------------------------+
| Rail |  Lokasi aktif: Jakarta Utara   [Cari]  Kesegaran  Notif  Profil|
|      +---------------------------------------------------------------+
| Ikon |                                                  +-----------+ |
|  +   |                 PETA (full-bleed)                | Panel     | |
| teks |    [Peringatan resmi aktif - bar tipis, solid]   | detail    | |
|      |                                                  | (glass-1) | |
|      |  +--------------+                                | Insight   | |
|      |  | Layer (glass)|                                | Perubahan | |
|      |  +--------------+                                | Tindakan  | |
|      |  [ Legenda + filter waktu (glass-2) ]            +-----------+ |
+------+---------------------------------------------------------------+
```

- Rail navigasi kiri: 6 menu utama (PRD 10.2), selalu ikon dan teks, lebar 88px. Dapat diperluas ke 240px.
- Peringatan resmi aktif tampil sebagai bar solid tipis di bagian atas peta, bukan toast. Berwarna sesuai urgensi, berisi nama otoritas dan waktu terbit.
- Rata kiri untuk semua teks. Tidak ada teks rata tengah kecuali pada layar kosong dan halaman error.

### 10.2 Tablet (768-1199px)

Rail menyempit menjadi ikon dengan teks di bawahnya. Panel detail menjadi drawer dari kanan (lebar 420px) dengan `glass-3`.

### 10.3 Mobile (< 768px)

```
+----------------------------+
| Jakarta Utara        Notif |
+----------------------------+
|                            |
|        PETA (full)         |
|                            |
|   [Layer]   [Lokasi saya]  |
+----------------------------+
| ===== bottom sheet ======  |
|  Insight terpenting        |
|  Perubahan terbaru         |
|  [ Lapor kejadian ]        |
+----------------------------+
| Beranda Peta AI Warga Siap |
+----------------------------+
```

- Navigasi bawah 5 item (Impact & Recovery masuk ke menu "Lainnya").
- Bottom sheet memiliki tiga posisi: tertutup (ringkasan satu baris), setengah, penuh. Dapat ditarik dan juga dioperasikan lewat tombol (bukan hanya gestur).
- Tombol "Lapor kejadian" selalu dapat dijangkau dengan satu ketukan dari layar utama.

### 10.4 Landing page

Satu rangkaian terkoordinasi saat gulir (satu-satunya animasi masuk besar):

1. Hero: judul rata kiri, globe 3D di kanan menghadap malam hari dengan cahaya kota. CTA utama "Buka peta". CTA sekunder "Pelajari kesiapsiagaan".
2. Gulir pertama: globe berputar ke Indonesia dan menurun menjadi peta datar kemudian medan 3D.
3. Panel kaca muncul dengan satu contoh insight berlabel "Data simulasi" dan seluruh bidang wajibnya (sumber, waktu, batasan).
4. Bagian berikutnya statis dan tenang: alur Data > Validasi > Analisis > Insight > Tinjauan manusia > Notifikasi, cakupan multi-hazard, transparansi sumber data dan batasan sistem (PRD 5.1).

Bagian alur adalah urutan nyata, jadi penomoran diperbolehkan di sana dan hanya di sana.

---

## 11. Komponen inti

Setiap komponen wajib memiliki varian dan state: default, hover, fokus, aktif, nonaktif, memuat, kosong, galat.

- **Tombol:** utama (solid `--accent`, maksimal satu per layar), sekunder (garis), tersier (teks), bahaya (solid `--crit`). Tinggi 44px (mobile 48px). Label kata kerja spesifik: "Kirim laporan", "Simpan perubahan". Tidak ada panah.
- **Input:** tinggi 48px, label selalu terlihat di atas (bukan hanya placeholder), teks bantuan di bawah, galat inline dengan ikon dan teks.
- **Lencana kelas informasi dan kesegaran:** mengikuti 4.4 dan 4.5. Satu komponen, banyak varian.
- **Kartu insight:** lencana kelas, judul, ringkasan satu kalimat, baris sumber dan waktu, tombol "Lihat alasan". Ukuran dan bobot bervariasi menurut urgensi, bukan semua sama.
- **Panel penjelasan skor:** skala, metode, input, dan versi aturan. Skor tidak pernah tampil tanpa panel ini.
- **Asisten AI:** panel percakapan dengan sumber yang dikutip di setiap jawaban, pemisah visual antara observasi, laporan, inferensi, dan rekomendasi, serta pernyataan "Data tidak cukup" sebagai state resmi. Tidak ada avatar robot, tidak ada animasi mengetik berlebihan.
- **Tabel moderasi:** permukaan solid, baris 56px, aksi massal, perbandingan duplikat berdampingan, catatan internal.
- **Formulir laporan:** satu kolom, empat langkah berurutan (kategori, deskripsi, lokasi di peta, foto), ringkasan sebelum kirim. Boleh diberi nomor karena memang berurutan.
- **Toast:** hanya untuk konfirmasi aksi pengguna. Kata kerjanya sama dengan tombol ("Dikirim", "Disimpan"). Pesan galat tidak memakai kata maaf dan menyebut cara memperbaiki.
- **Pita simulasi:** selalu terlihat pada data berlabel SIMULATED, tidak dapat ditutup.

---

## 12. Gerak

- Gerak yang dipicu pengguna (membuka panel, memperluas, konfirmasi) selalu halus dan menunjukkan apa yang berubah. Durasi 160-240ms, kurva `cubic-bezier(0.2, 0, 0, 1)`.
- Gerak tanpa pemicu hanya satu: rangkaian globe saat memuat landing. Selain itu tidak ada animasi masuk otomatis.
- Penanda peta baru muncul dengan satu denyut singkat (satu kali) agar mata menemukannya. Tidak ada denyut berulang kecuali untuk peringatan level 4 (maksimal 3 kali, lalu diam).
- `prefers-reduced-motion: reduce`: matikan rotasi globe, denyut, dan transisi kamera; ganti dengan perubahan instan atau fade 100ms.
- Tidak ada parallax, kursor kustom, atau partikel mengambang.

---

## 13. UX dan aksesibilitas untuk semua kalangan

Standar minimum: **WCAG 2.2 AA**. Teks isi ditargetkan mencapai AAA bila memungkinkan.

**Kemudahan dasar**

- Ukuran sentuh minimal 44x44px, jarak antarkontrol 8px.
- Satu aksi utama per layar. Maksimal tiga langkah untuk tugas inti (lihat kondisi lokasi, lapor kejadian, baca panduan).
- Bahasa sederhana, tanpa istilah teknis yang tidak dijelaskan. Istilah teknis (hotspot, PGA, DEM) diberi penjelasan satu kalimat dengan tautan "Apa artinya".
- Jangan memaksa gestur: setiap gestur (tarik, geser, cubit) memiliki padanan tombol.
- Konfirmasi hanya pada aksi yang merusak atau tidak dapat dibatalkan. Sediakan "Batalkan" setelah aksi umum.
- Status selalu terlihat: apa yang sedang dilihat, lokasi mana, data seberapa segar.

**Teknis**

- HTML semantik, urutan fokus logis, indikator fokus terlihat: cincin 2px `--accent` dengan offset 2px, kontras 3:1 terhadap latar.
- Seluruh fungsi dapat dioperasikan dengan keyboard, termasuk peta (panah untuk geser, plus/minus untuk zoom, Enter untuk membuka detail penanda). Sediakan daftar teks setara dari isi peta ("Lihat sebagai daftar").
- Tautan lewati ke konten utama. Landmark ARIA untuk rail, peta, panel detail.
- Pembaruan data penting diumumkan lewat `aria-live="polite"`; peringatan kritis `assertive` sekali.
- Penanda peta dan lencana memiliki nama aksesibel lengkap (kelas, jenis bahaya, urgensi, waktu).
- Gambar bermakna memiliki `alt` deskriptif; dekoratif diberi `alt=""` (dan seharusnya sangat jarang).
- Mendukung `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more` (naikkan opasitas kaca dan ketebalan garis), serta perbesaran teks sampai 200%.
- Uji dengan pembaca layar (NVDA atau VoiceOver) pada tiga alur: lihat kondisi lokasi, kirim laporan, baca peringatan.

**Kinerja sebagai bagian dari UX**

- LCP di bawah 2,5 detik pada jaringan 4G menengah untuk halaman landing; peta interaktif dalam 3 detik.
- Halaman landing memuat globe secara lazy setelah teks hero tampil; tampilkan poster statis (foto globe yang dirender sendiri) selama memuat.
- Koneksi lambat: tawarkan "Mode hemat data" (tanpa 3D, tanpa foto, peta datar).

**Keselamatan dalam desain**

- Tidak ada warna atau teks yang mengesankan kepastian palsu. Gunakan "indikator", "kemungkinan", dan tampilkan batasan.
- Informasi darurat selalu menyertakan tautan ke otoritas resmi (BMKG, BNPB, BPBD) dan nomor layanan darurat yang berlaku.
- Lokasi presisi diminta hanya setelah penjelasan satu layar dan persetujuan eksplisit. Lokasi manual selalu tersedia.

---

## 14. Copywriting

- Tulis dari sudut pandang pengguna, dengan bahasa sehari-hari yang sopan dan lugas. Aktif, kata kerja di depan, sentence case.
- Nama fitur menjelaskan fungsi: "Lapor kejadian", bukan "Community Engagement Hub". Nama modul PRD (Earth Intelligence, AI Intelligence, Community Network) boleh tetap sebagai nama merek, selalu disertai deskripsi satu baris pada tooltip navigasi dan halaman.
- Konsisten: tombol "Kirim laporan" menghasilkan toast "Laporan dikirim".
- Galat menjelaskan apa yang terjadi dan cara memperbaikinya. Tanpa permintaan maaf, tanpa humor.
- Layar kosong mengajak bertindak: "Belum ada laporan di area ini. Kirim laporan pertama."
- Hindari klaim bombastis ("revolusioner", "tercanggih", "berbasis AI generasi baru"). Sebut kemampuan yang nyata.
- Contoh judul hero (boleh diganti): "Pahami risiko di sekitarmu sebelum dampaknya terasa."

---

## 15. State wajib

Setiap tampilan data memiliki desain untuk: memuat (kerangka dengan bentuk konten asli), kosong, galat (dengan "Coba lagi"), usang, tidak tersedia, simulasi, dan tidak ada izin. Tidak boleh ada layar putih atau spinner tanpa konteks. Data lama tidak boleh tampil seperti data terbaru (PRD 18.4).

---

## 16. Implementasi

Stack mengikuti PRD: React + Vite + TypeScript + Tailwind CSS, peta MapLibre GL JS, globe dengan three.js atau proyeksi globe MapLibre (pilih satu setelah uji kinerja).

- Seluruh token berada sebagai CSS variables di `src/styles/tokens.css` dan dipetakan ke `tailwind.config`. Tidak ada nilai warna, radius, atau ruang di luar token.
- Komponen berada di `src/components/ui` (primitif) dan `src/features/*` (domain). Komponen primitif tidak mengetahui data domain.
- Tema diganti lewat atribut `data-theme="dark|light"` pada `<html>`, dengan default mengikuti sistem.
- Ikon hazard dan merek: `src/assets/icons/*.svg`, dimuat sebagai komponen.
- Setiap aset eksternal dicatat di `ASSETS.md`: sumber, lisensi, atribusi, tanggal diambil.
- Tidak ada API key di bundle frontend (PRD 17). Tile dan tekstur dilayani dari sumber yang tidak memerlukan kunci rahasia atau lewat proxy backend.

Cuplikan awal `tokens.css`:

```css
:root[data-theme="dark"] {
  --ink-950: #0C1A22; --ink-900: #112430; --ink-800: #183241; --ink-700: #234255;
  --text-1: #E8EEF1; --text-2: #A9BAC4; --text-3: #8CA0AC;
  --accent: #86B6CE; --accent-2: #5FA89B;
  --warn: #E0A23A; --crit: #EE7C73; --ok: #8FB98A; --unknown: #94A3AD;
  --line: rgb(232 238 241 / 0.10);
  --r-chip: 6px; --r-control: 10px; --r-panel: 16px; --r-modal: 24px;
}
:root[data-theme="light"] {
  --ink-950: #EAF0F2; --ink-900: #FFFFFF; --ink-800: #DCE5E9; --ink-700: #C9D5DB;
  --text-1: #12212B; --text-2: #3F5461; --text-3: #51646F;
  --accent: #24627F; --accent-2: #2A7165;
  --warn: #7F5200; --crit: #B13A32; --ok: #3D6B38; --unknown: #51646F;
  --line: rgb(18 33 43 / 0.10);
}
@media (prefers-reduced-transparency: reduce) {
  .glass-1, .glass-2, .glass-3 { background: var(--ink-900); backdrop-filter: none; }
}
```

(Nilai `--ok`, `--ink-700`, dan `--unknown` tema terang harus diverifikasi kontrasnya sebelum dipakai untuk teks.)

---

## 17. Daftar periksa sebelum dinilai juri

**Kesan visual**

- [ ] Globe/medan 3D memuat cepat, berdata nyata, dan berlabel simulasi bila demo.
- [ ] Tidak ada gradien dekoratif, neon, atau emoji di seluruh aplikasi dan README.
- [ ] Palet hanya memakai token; tampilan konsisten di tema gelap dan terang.
- [ ] Kaca terbaca di atas layer peta paling terang.
- [ ] Setiap kartu, panel, dan lencana memiliki bobot sesuai hierarkinya, bukan seragam.

**Keandalan**

- [ ] Semua tombol berfungsi atau berlabel "Belum tersedia".
- [ ] Lima kelas informasi dan enam status kesegaran tampil benar.
- [ ] Layer yang gagal tidak merusak peta.
- [ ] Tidak ada galat konsol dan galat jaringan pada alur utama.

**UX dan aksesibilitas**

- [ ] Tiga alur inti selesai dalam tiga langkah atau kurang pada mobile.
- [ ] Audit Lighthouse aksesibilitas >= 95 dan lolos uji keyboard serta pembaca layar.
- [ ] Teks diperbesar 200% tanpa kehilangan fungsi.
- [ ] Mode hemat data dan peta datar berfungsi.

**Pengiriman lomba**

- [ ] Tautan GitHub di pitch deck dapat diklik dan tidak rusak.
- [ ] `.env` tidak ter-commit; `.env.example` tersedia.
- [ ] `README.md` memuat deskripsi, tech stack, panduan instalasi, dan tautan demo.
- [ ] Video demo, pitch deck, dan sistem seluruhnya lengkap.
- [ ] Laporan fase terakhir memuat "Tinjauan Anti Slop".
