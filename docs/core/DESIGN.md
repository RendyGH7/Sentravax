# SENTRAVAX — Design System & UX Guidelines

Versi revisi: 2.0  
Status: **Design source of truth**  
Bahasa antarmuka: Bahasa Indonesia  
Zona waktu tampilan: zona pengguna (default WIB)

Dokumen ini mengatur seluruh keputusan visual, interaksi, aksesibilitas, dan performa SENTRAVAX. Gunakan bersama `PRD.md`, panduan lomba (`COMPETITION_GUIDE.md`), Skill Anti Slop, serta referensi visual yang diberikan pemilik proyek.

---

## 0. Tujuan dan aturan utama

SENTRAVAX harus terasa seperti produk teknologi yang matang, dapat dipercaya, mudah dipakai masyarakat luas, dan dibuat dengan perhatian terhadap detail. Desain tidak boleh terlihat seperti template dashboard, landing page generik, atau hasil AI yang mengandalkan efek visual berlebihan.

**Karakter utama produk:**

- Clean, minimalis, simpel, profesional, user-friendly, dan elegan.
- Interaktif dan responsif, tetapi tidak ramai atau mengganggu.
- Tata letak rapi, punya ruang bernapas, konsisten, dan mudah dipahami.
- Konten ringkas. Tampilkan hanya informasi yang membantu pengguna mengambil keputusan.
- Cepat dimuat dan tetap nyaman di perangkat dengan spesifikasi maupun koneksi terbatas.
- Visual harus mendukung fungsi dan kejelasan informasi, bukan menjadi dekorasi.

### 0.1 Prioritas keputusan

Jika ada aturan yang bertentangan, gunakan urutan berikut:

1. Keselamatan pengguna, kejujuran data, privasi, dan ketentuan PRD.
2. Arahan eksplisit pemilik proyek dalam percakapan terbaru.
3. Dokumen `design.md` ini.
4. Skill Anti Slop.
5. Referensi visual yang diberikan pemilik proyek, selama tidak bertentangan dengan aturan 1–4.
6. Preferensi visual bawaan agent.

Referensi visual adalah bahan untuk memahami arah, bukan perintah untuk menyalin. Agent wajib menggabungkan referensi, dokumen ini, dan Skill Anti Slop secara seimbang.

### 0.2 Empat area produk

SENTRAVAX memiliki empat area dengan dua keluarga visual:

| Area | Tema | Karakter |
|---|---|---|
| Public Website | Light | Ramah, terbuka, informatif, bersih |
| User Portal | Light — sama dengan Public Website | Personal, sederhana, nyaman |
| Admin Dashboard | Black / dark | Tegas, padat informasi, profesional |
| Intelligence Center | Black / dark | Analitis, teknis, fokus pada data |

**Public Website dan User Portal wajib memakai sistem warna terang yang sama.** Keduanya tidak boleh memiliki identitas warna yang berbeda. Perbedaan cukup ditunjukkan melalui navigasi, struktur halaman, dan kebutuhan fungsional.

**Admin Dashboard dan Intelligence Center wajib memakai latar hitam/gelap netral.** Jangan menggunakan tema midnight navy, petrol, biru gelap, atau latar kebiruan sebagai warna dasar kedua area tersebut.

Jangan membuat satu prompt desain yang mencampur seluruh area. Pengerjaan desain harus dipisah menjadi:
- Prompt khusus Public Website + User Portal.
- Prompt khusus Admin Dashboard + Intelligence Center.

Komponen bersama boleh dipakai jika memang sesuai, tetapi tema, layout, navigasi, dan hierarki informasi harus tetap mengikuti keluarga visual masing-masing.

---

## 1. Prosedur wajib sebelum mendesain

### 1.1 Skill Anti Slop — wajib

Agent WAJIB menggunakan Skill Anti Slop untuk setiap pekerjaan yang menyentuh UI, termasuk halaman, komponen, ikon, ilustrasi, copywriting, animasi, responsivitas, dan perbaikan kecil.

Sebelum mulai:
1. Cari dan muat Skill Anti Slop yang tersedia di lingkungan Antigravity.
2. Baca instruksi lengkapnya, bukan hanya nama atau ringkasan skill.
3. Terapkan prinsipnya selama implementasi.
4. Jika skill tidak tersedia atau gagal dimuat, berhenti dan minta pemilik proyek menyediakan skill tersebut. Jangan mengaku sudah menggunakannya.

Sesudah implementasi:
1. Periksa hasil desktop, tablet, dan mobile.
2. Periksa screenshot halaman utama dan state interaktif.
3. Tinjau apakah ada pola visual generik atau dekorasi yang tidak punya fungsi.
4. Hapus atau perbaiki elemen yang tidak mendukung tujuan.
5. Cantumkan hasil pemeriksaan pada laporan dengan bagian **Tinjauan Anti Slop**.

### 1.2 Referensi visual wajib untuk setiap pekerjaan desain

Pemilik proyek akan memberikan ilustrasi, screenshot, website, atau referensi desain secara bertahap.

**Setiap kali akan mendesain atau mengubah tampilan suatu halaman/komponen, agent wajib memeriksa referensi desain yang diberikan untuk pekerjaan tersebut terlebih dahulu.**

Prosedur:
1. Identifikasi referensi yang relevan dengan halaman/komponen yang sedang dikerjakan.
2. Amati layout, komposisi, hierarki, proporsi, spacing, tipografi, penggunaan warna, bentuk komponen, interaksi, dan perilaku responsifnya.
3. Catat prinsip yang relevan, bukan menyalin seluruh tampilan.
4. Cocokkan prinsip tersebut dengan aturan `design.md` dan Skill Anti Slop.
5. Rancang solusi SENTRAVAX yang orisinal dan sesuai konteks produk.
6. Jangan menyalin logo, identitas merek, ilustrasi, aset, copy, atau susunan unik referensi secara mentah.
7. Jika referensi bertentangan dengan larangan neon, gradient dekoratif, emoji, aksesibilitas, performa, atau aturan produk, aturan dalam dokumen ini yang menang.
8. Jika belum ada referensi yang relevan, **jangan mengarang seolah-olah sudah melihat referensi**. Tanyakan kepada pemilik proyek apakah ia ingin memberikan referensi atau mengizinkan agent menggunakan arah desain yang sudah ditetapkan dokumen ini.

Pada laporan, tuliskan:
- Referensi yang diperiksa.
- Prinsip desain yang diambil.
- Bagian yang sengaja tidak ditiru dan alasannya.
- Bagaimana referensi diseimbangkan dengan Skill Anti Slop dan `design.md`.

Referensi boleh berbeda untuk setiap halaman. Jangan menganggap satu referensi berlaku otomatis untuk seluruh aplikasi.

---

## 2. Larangan visual mutlak

Larangan ini berlaku di seluruh aplikasi, termasuk Public Website, User Portal, Admin Dashboard, Intelligence Center, halaman autentikasi, loading state, toast, ilustrasi, dan komponen kecil.

| Dilarang | Ketentuan |
|---|---|
| Warna neon | Tidak boleh ada cyan neon, electric blue, neon green, neon purple, neon pink, atau warna berpendar |
| Gradient dekoratif | Tidak boleh dipakai pada background, hero, tombol, teks, border, card, panel, atau dekorasi |
| Neon gradient / glow | Tidak boleh ada glow, bloom, neon shadow, atau drop-shadow berwarna terang |
| Emoji / emoticon | Tidak boleh digunakan dalam UI, copy, tombol, toast, data demo, atau konten aplikasi |
| Ikon berbasis karakter teks | Jangan memakai simbol Unicode sebagai pengganti ikon; gunakan ikon SVG/Lucide |
| Efek visual berlebihan | Hindari glassmorphism dekoratif, blur berat, partikel, aurora, blob, dan ornamen abstrak |
| AI slop | Hindari layout generik, kartu identik berulang, gradient hero, angka statistik dekoratif, dan copy bombastis |
| Tombol palsu | Tidak boleh ada tombol tanpa aksi yang jelas |
| Navigasi yang membingungkan | Jangan membuat teks biasa terlihat seperti tombol atau link |
| Teks berlebihan | Hindari paragraf panjang, penjelasan berulang, label teknis tanpa konteks |
| Layout bertumpuk | Tidak boleh ada elemen bertabrakan, saling menutupi, terlalu rapat, atau keluar dari viewport |
| Animasi mengganggu | Tidak boleh ada animasi berulang tanpa alasan fungsional, parallax berat, atau gerakan yang mengganggu |

### 2.1 Pengecualian warna

Warna yang lebih kuat boleh digunakan jika memiliki fungsi yang jelas:
- Status bahaya, peringatan, keberhasilan, dan informasi.
- Kategori risiko dan kelas data.
- Grafik, peta tematik, chart, dan visualisasi analitik.

Pengecualian tersebut bukan izin untuk menggunakan neon. Warna data harus tetap terbaca, terukur, ramah buta warna, dan memiliki legenda/label. Warna grafik tidak boleh bocor menjadi warna dekoratif komponen lain.

### 2.2 Gradient untuk data dan skeleton

- Gradient dekoratif tetap dilarang.
- Rampa warna pada peta atau grafik diperbolehkan hanya jika memetakan nilai data dan disertai legenda.
- Skeleton shimmer boleh memakai pergeseran highlight abu-abu/putih yang sangat halus pada permukaan netral. Ini adalah state loading fungsional, bukan dekorasi.
- Skeleton shimmer tidak boleh memakai warna neon atau gradient warna-warni.

---

## 3. Sistem warna

Gunakan warna solid, tenang, tegas, dan konsisten. Semua warna UI harus berasal dari design token. Jangan menulis nilai hex acak langsung di komponen.

### 3.1 Keluarga terang — Public Website dan User Portal

Public Website dan User Portal menggunakan tema terang yang sama: putih, netral, bersih, dan ramah untuk semua kalangan.

Palet awal:

| Token | Nilai | Fungsi |
|---|---|---|
| `--light-bg` | `#FFFFFF` | Latar utama |
| `--light-surface` | `#FFFFFF` | Permukaan konten |
| `--light-surface-muted` | `#F5F6F7` | Area sekunder dan hover lembut |
| `--light-surface-subtle` | `#F0F2F3` | Input, panel sekunder |
| `--light-text` | `#202428` | Teks utama |
| `--light-text-secondary` | `#596168` | Teks sekunder |
| `--light-text-muted` | `#737C83` | Metadata yang tidak kritis |
| `--light-border` | `#E2E5E8` | Border dan divider |
| `--light-primary` | `#245B78` | Aksi utama dan link |
| `--light-primary-hover` | `#1D4B64` | Hover aksi utama |
| `--light-primary-soft` | `#EAF1F5` | Permukaan aksen lembut |
| `--light-success` | `#28734D` | Status berhasil |
| `--light-warning` | `#8A5A13` | Status peringatan |
| `--light-danger` | `#B33A35` | Status kritis/error |
| `--light-info` | `#315F86` | Status informasi |

Ketentuan:
- Putih menjadi warna dominan, bukan abu-abu gelap.
- Gunakan abu-abu netral untuk pembagian area dan hierarki.
- Aksen biru baja yang solid digunakan seperlunya untuk aksi utama, bukan untuk dekorasi.
- Jangan mewarnai semua link, ikon, border, dan heading dengan aksen sekaligus.
- Hindari tampilan yang terlalu pucat. Pastikan teks, kontrol, dan batas komponen tetap jelas.
- User Portal tidak boleh tiba-tiba berubah menjadi dark mode.

### 3.2 Keluarga gelap — Admin Dashboard dan Intelligence Center

Kedua area ini menggunakan latar hitam netral, bukan midnight navy, bukan petrol, dan bukan biru gelap.

Palet awal:

| Token | Nilai | Fungsi |
|---|---|---|
| `--dark-bg` | `#111111` | Latar utama aplikasi |
| `--dark-surface` | `#191919` | Panel dan permukaan utama |
| `--dark-surface-raised` | `#222222` | Permukaan terangkat |
| `--dark-surface-hover` | `#2A2A2A` | Hover dan state aktif |
| `--dark-text` | `#F2F2F2` | Teks utama |
| `--dark-text-secondary` | `#B8B8B8` | Teks sekunder |
| `--dark-text-muted` | `#929292` | Metadata |
| `--dark-border` | `#343434` | Border dan divider |
| `--dark-primary` | `#A9C2D1` | Aksen tindakan yang diredam |
| `--dark-primary-hover` | `#C0D2DC` | Hover aksen |
| `--dark-primary-soft` | `#283139` | Permukaan aksen lembut |
| `--dark-success` | `#70A987` | Status berhasil |
| `--dark-warning` | `#D2A45E` | Status peringatan |
| `--dark-danger` | `#D47A74` | Status kritis/error |
| `--dark-info` | `#8BAFC8` | Status informasi |

Ketentuan:
- `--dark-bg` harus menjadi latar dasar yang terlihat hitam/netral.
- Panel menggunakan variasi abu-abu gelap, bukan biru navy.
- Gunakan warna aksen secara terbatas untuk aksi dan fokus.
- Jangan menggunakan glow, neon border, atau gradient.
- Admin dan Intelligence boleh lebih padat informasi daripada area publik, tetapi tetap harus punya hierarki dan ruang yang cukup.
- Glassmorphism bukan gaya dasar. Gunakan panel solid. Transparansi hanya bila benar-benar membantu overlay di atas peta.

### 3.3 Warna status dan data

Status minimum:
- Fresh / Segar
- Delayed / Tertunda
- Stale / Usang
- Unavailable / Tidak tersedia
- Simulated / Simulasi
- Unknown / Tidak diketahui

Setiap status harus memiliki:
- Label teks yang jelas.
- Penanda bentuk atau ikon.
- Warna status yang sesuai.
- Waktu pembaruan dan sumber bila relevan.

Jangan mengandalkan warna sebagai satu-satunya pembeda.

### 3.4 Warna peta dan grafik

Grafik, peta risiko, chart, dan analitik boleh memakai warna data yang lebih beragam karena memiliki fungsi kuantitatif.

Aturan:
1. Pilih palet berdasarkan jenis data dan makna nilai.
2. Sertakan legenda, satuan, label, dan rentang bila diperlukan.
3. Pastikan warna dapat dibedakan oleh pengguna dengan gangguan persepsi warna.
4. Jangan memakai warna neon atau efek glow.
5. Gunakan satu sistem warna konsisten antarhalaman untuk kategori data yang sama.
6. Jangan menggunakan warna grafik sebagai aksen dekoratif tombol atau background.
7. Jika chart tidak memiliki data, tampilkan empty state, bukan chart palsu.

---

## 4. Tipografi dan konten

Tipografi harus jelas, modern, profesional, dan nyaman dibaca. Gunakan satu keluarga font utama yang konsisten; font tambahan hanya jika ada alasan desain yang kuat.

Rekomendasi:
- UI dan isi: Inter atau font sans-serif sistem yang ringan.
- Heading: gunakan keluarga yang sama dengan bobot berbeda, kecuali referensi desain menunjukkan kebutuhan yang jelas.
- Self-host font bila memungkinkan. Gunakan `font-display: swap`.

Skala awal:
| Token | Ukuran | Penggunaan |
|---|---:|---|
| `display` | 48–56px desktop, 34–40px mobile | Hero tertentu |
| `h1` | 32–40px | Judul halaman |
| `h2` | 24–28px | Judul bagian |
| `h3` | 18–21px | Judul panel |
| `body` | 15–16px | Isi |
| `body-sm` | 14px | Keterangan |
| `caption` | 12–13px | Metadata non-kritis |

Aturan copywriting:
- Gunakan Bahasa Indonesia yang lugas dan mudah dimengerti.
- Utamakan kalimat pendek dan aktif.
- Hindari paragraf panjang dan penjelasan yang mengulang informasi.
- Tampilkan ringkasan terlebih dahulu; detail tambahan dapat dibuka saat diperlukan.
- Jangan menampilkan semua informasi sekaligus. Gunakan progressive disclosure.
- Hindari jargon teknis. Jika istilah teknis harus muncul, jelaskan secara singkat.
- Jangan memakai klaim bombastis seperti “revolusioner” atau “AI tercanggih”.
- Label tombol harus berupa aksi yang spesifik, misalnya “Kirim laporan”, “Simpan perubahan”, atau “Lihat detail”.

---

## 5. Layout, spacing, dan kerapian

Layout harus rapi dan seimbang di seluruh ukuran layar. Tidak boleh ada komponen saling menumpuk, teks terpotong tanpa alasan, tombol terlalu rapat, atau konten menempel ke tepi layar.

### 5.1 Spacing

Gunakan skala berbasis 4px:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.

Pedoman:
- Jarak antar elemen terkait: 8–16px.
- Jarak antar kelompok konten: 20–32px.
- Padding panel: 20–24px desktop; 16px mobile.
- Jarak antar section: 48–80px desktop; 32–48px mobile.
- Konten tidak boleh terlalu lebar untuk dibaca. Gunakan max-width yang sesuai.
- Sisakan ruang di sekitar judul, form, tabel, dan tombol.
- Jangan memaksakan semua area menjadi grid kartu.

### 5.2 Grid dan responsivitas

- Gunakan layout fluid dengan breakpoint berdasarkan kebutuhan konten, bukan hanya ukuran perangkat.
- Desktop: manfaatkan ruang lebar tanpa membuat teks dan tabel melebar berlebihan.
- Tablet: ubah kolom menjadi susunan yang tetap terbaca; navigasi dapat menjadi drawer.
- Mobile: satu kolom untuk konten utama, navigasi mudah dijangkau, kontrol tidak terlalu kecil.
- Hindari horizontal scroll pada halaman umum. Tabel kompleks boleh memiliki area scroll terkontrol dengan petunjuk yang jelas.
- Modal, drawer, dropdown, tooltip, dan popover harus tetap berada di dalam viewport.
- Periksa orientasi portrait dan landscape bila relevan.
- Pastikan zoom browser hingga 200% tidak merusak fungsi inti.

### 5.3 Hirarki

- Setiap layar harus memiliki satu fokus utama.
- Bedakan bagian melalui ukuran, bobot, jarak, dan struktur.
- Jangan membuat semua card sama besar, sama warna, dan sama penting.
- Gunakan tabel, list, tab, accordion, atau panel sesuai jenis informasi.
- Hindari menampilkan statistik besar hanya untuk mengisi ruang.
- Jangan menambahkan elemen dekoratif yang tidak membantu pengguna.

---

## 6. Micro-interaction dan animasi — prioritas tinggi

Micro-interaction adalah bagian penting dari kualitas SENTRAVAX. Setiap elemen interaktif harus memberi respons yang jelas, konsisten, halus, dan terasa hidup. Namun, animasi harus membantu pengguna memahami tindakan, bukan menjadi hiasan.

**Prinsip:** setiap interaksi yang memiliki state harus memiliki feedback visual yang tepat.

### 6.1 Elemen yang wajib memiliki feedback interaksi

- Tombol: hover, pressed/active, focus, disabled, loading.
- Link dan item navigasi: hover, active/current, focus.
- Card yang dapat diklik: hover/focus/pressed yang halus dan jelas.
- Input dan textarea: focus, filled, invalid, disabled.
- Select, dropdown, popover, tooltip: open/close yang halus.
- Tab dan segmented control: perpindahan state yang terlihat.
- Checkbox, radio, switch: perubahan state dengan animasi singkat.
- Modal dan drawer: masuk/keluar halus, fokus terkelola.
- Accordion: buka/tutup dengan transisi yang tidak membuat layout meloncat.
- Toast: muncul dan hilang dengan transisi ringan.
- Peta dan marker: perubahan pilihan, filter, dan detail dengan feedback yang jelas.
- Skeleton: shimmer lembut selama data sedang dimuat.
- Drag, upload, atau proses yang dapat dilacak: tampilkan state proses dan hasilnya.

### 6.2 Timing dan karakter gerak

Gunakan nilai awal berikut dan sesuaikan setelah uji nyata:

| Interaksi | Durasi awal |
|---|---:|
| Hover / pressed | 120–180ms |
| Focus / state kontrol | 120–180ms |
| Tooltip / dropdown | 140–200ms |
| Modal / drawer | 180–240ms |
| Tab / accordion | 180–240ms |
| Toast | 180–220ms |
| Feedback aksi berhasil | 160–220ms |

Gunakan easing natural seperti:
`cubic-bezier(0.2, 0, 0, 1)`.

Ketentuan:
- Gunakan transform dan opacity bila memungkinkan.
- Jangan menganimasikan properti layout berat secara terus-menerus.
- Hindari hover-lift berlebihan. Perubahan warna, border, opacity, atau pergeseran 1–2px sudah cukup bila sesuai.
- Animasi tidak boleh menghambat klik atau membuat pengguna menunggu.
- Jangan membuat animasi yang hanya berjalan untuk menarik perhatian tanpa alasan.
- Hindari animasi otomatis berulang pada elemen yang tidak membutuhkan perhatian.
- Jangan menggunakan custom cursor, parallax berat, atau partikel mengambang.
- Jangan menganimasikan semua elemen saat halaman pertama kali dibuka. Prioritaskan respons atas tindakan pengguna.

### 6.3 Tombol dan navigasi

- Semua tombol harus benar-benar menjalankan fungsi yang dijanjikan.
- Semua tombol harus memiliki hover, pressed, focus-visible, disabled, dan loading state yang sesuai.
- Navigasi harus berupa elemen link/button yang benar, bukan teks biasa yang hanya terlihat seperti navigasi.
- Jangan memaksa pengguna berpindah halaman hanya untuk tindakan sederhana yang bisa dilakukan lewat modal, drawer, tab, atau inline action.
- Jangan menyembunyikan navigasi penting di balik teks yang tidak terlihat interaktif.
- Hindari tombol “Lihat selengkapnya” jika konten dapat ditampilkan langsung secara ringkas.
- Gunakan tombol dengan ukuran sentuh minimal 44×44px.
- Beri jarak minimal 8px antar kontrol yang berdekatan.
- Jika suatu fitur belum tersedia, jangan membuat tombol palsu. Tampilkan status “Belum tersedia” dengan jelas atau hilangkan tombolnya.

### 6.4 Reduced motion

Hormati `prefers-reduced-motion: reduce`:
- Kurangi atau matikan gerakan non-esensial.
- Pertahankan feedback state yang penting melalui perubahan visual instan.
- Jangan memaksa animasi otomatis.
- Semua fungsi tetap dapat digunakan tanpa animasi.

---

## 7. Loading state — Skeleton Shimmer

**Gunakan skeleton shimmer sebagai pola loading utama.** Jangan menggunakan spinner sebagai loading default untuk halaman atau konten.

Ketentuan:
1. Skeleton harus mengikuti bentuk konten yang akan muncul: baris teks, gambar, tabel, card, chart, atau panel.
2. Gunakan warna netral yang sesuai tema.
3. Shimmer bergerak perlahan dan halus; jangan memakai warna neon atau gradient warna-warni.
4. Pertahankan ukuran skeleton sedekat mungkin dengan ukuran konten akhir agar layout tidak bergeser.
5. Jika hanya satu aksi yang sedang diproses, gunakan loading state pada tombol tersebut, bukan skeleton seluruh halaman.
6. Untuk proses panjang, tampilkan status proses yang dapat dipahami pengguna.
7. Jika loading berlangsung terlalu lama, tampilkan penjelasan dan opsi coba lagi bila sesuai.
8. Untuk data yang sudah pernah dimuat, pertimbangkan mempertahankan konten lama dengan penanda sedang diperbarui daripada mengosongkan seluruh halaman.
9. Jangan tampilkan data simulasi seolah-olah data live saat loading atau fallback.

Skeleton shimmer harus menghormati `prefers-reduced-motion`. Dalam mode tersebut, gunakan skeleton statis.

---

## 8. Komponen dan state

Setiap komponen harus dirancang sesuai fungsi, tidak semua komponen harus berbentuk card.

Komponen utama:
- Button: primary, secondary, tertiary, danger.
- Input, textarea, select, checkbox, radio, switch.
- Navigation, breadcrumb, tabs, pagination bila benar-benar dibutuhkan.
- Modal, drawer, dropdown, popover, tooltip.
- Table, list, filter, search.
- Status badge dan freshness indicator.
- Toast dan inline alert.
- Skeleton shimmer.
- Empty state, error state, unavailable state, simulated state.
- Chart dan map controls.
- Form multi-step jika alurnya memang kompleks.

Setiap komponen yang relevan harus memiliki state:
- Default
- Hover
- Focus-visible
- Active/pressed
- Disabled
- Loading
- Success
- Error
- Empty (untuk komponen data)

Jangan membuat state yang tidak relevan hanya demi checklist.

### 8.1 Tombol

- Gunakan kata kerja yang jelas.
- Satu aksi utama per area/layar bila memungkinkan.
- Tombol utama solid dan tegas, bukan gradient.
- Tombol sekunder menggunakan outline atau permukaan netral.
- Tombol bahaya hanya untuk tindakan destruktif.
- Berikan feedback saat ditekan.
- Cegah double-submit pada proses yang sedang berjalan.
- Tampilkan hasil aksi melalui toast atau inline feedback.

### 8.2 Formulir

- Label selalu terlihat; jangan hanya mengandalkan placeholder.
- Kelompokkan input yang berkaitan.
- Validasi dekat dengan field yang bermasalah.
- Jangan menghapus input pengguna ketika validasi gagal.
- Beri petunjuk singkat dan contoh format bila dibutuhkan.
- Form harus nyaman digunakan dengan keyboard dan layar sentuh.
- Jangan membuat pengguna mengisi informasi yang tidak diperlukan.

### 8.3 Empty, error, dan unavailable state

- Jelaskan keadaan dengan satu atau dua kalimat.
- Berikan satu tindakan yang paling relevan.
- Sediakan “Coba lagi” bila proses dapat diulang.
- Jangan menyalahkan pengguna.
- Jangan menampilkan chart, angka, atau daftar palsu untuk mengisi ruang kosong.

---

## 9. Aturan khusus per area

### 9.1 Public Website

Tema: putih, bersih, ramah, minimalis, dan informatif.

- Fokus pada pemahaman masyarakat dan akses cepat ke informasi penting.
- Navigasi sederhana dan konsisten.
- Gunakan bahasa sehari-hari yang sopan.
- Prioritaskan peta, informasi peringatan, kesiapsiagaan, dan edukasi.
- Hindari hero yang terlalu ramai, teks panjang, dan banyak CTA yang bersaing.
- Gunakan ilustrasi atau foto hanya jika membantu pemahaman.
- Pastikan informasi penting mudah ditemukan tanpa harus menggulir terlalu jauh.

### 9.2 User Portal

Tema: **sama persis dengan keluarga visual Public Website**.

- Tetap memakai latar putih, permukaan terang, tipografi, token, dan aksen yang sama.
- Jangan mengubah User Portal menjadi dark dashboard.
- Buat navigasi dan informasi personal mudah dipahami.
- Prioritaskan tugas inti: melihat kondisi, mengirim laporan, mengatur wilayah pantauan, dan membaca notifikasi.
- Tampilkan informasi personal seperlunya.
- Form laporan harus ringkas dan mudah diselesaikan melalui ponsel.

### 9.3 Admin Dashboard

Tema: hitam netral dengan panel abu-abu gelap.

- Fokus pada manajemen pengguna, verifikasi, konten, sumber data, audit, dan konfigurasi.
- Boleh lebih padat informasi daripada Public Website dan User Portal.
- Gunakan tabel dan filter yang jelas, bukan tumpukan card statistik.
- Tindakan berisiko harus memiliki konfirmasi yang tepat.
- Aksi massal harus menunjukkan jumlah item yang dipilih dan dampaknya.
- Perubahan status harus terlihat dan dapat ditelusuri.
- Hindari efek futuristik, neon, glow, dan dekorasi berlebihan.

### 9.4 Intelligence Center

Tema: hitam netral yang sama dengan Admin Dashboard, tetapi struktur dan prioritas informasinya berorientasi analisis.

- Fokus pada peta geospasial, multi-hazard, risk analysis, AI insights, sumber data, dan operasi peringatan.
- Peta dan visualisasi analitik menjadi fokus utama saat relevan.
- Panel analisis menggunakan permukaan gelap solid.
- Warna chart/peta boleh lebih variatif hanya untuk membedakan data dan tingkat risiko.
- Tampilkan sumber, waktu pembaruan, status kesegaran, dan batasan analisis.
- Bedakan data observasi, peringatan resmi, laporan warga, insight sistem, dan data simulasi.
- AI harus menjelaskan bukti, alasan, keterbatasan, dan rekomendasi; bukan sekadar menghasilkan paragraf panjang.
- Jangan mengklaim prediksi gempa atau kepastian bencana.

---

## 10. Peta, grafik, dan analitik

- Gunakan warna yang memiliki makna data dan legenda.
- Peta harus tetap dapat digunakan saat salah satu layer gagal dimuat.
- Marker harus dapat dipilih dan memiliki feedback visual.
- Cluster digunakan saat marker terlalu padat.
- Kontrol peta harus memiliki ukuran sentuh yang cukup.
- Sediakan cara alternatif untuk membaca data peta, misalnya daftar kejadian.
- Tampilkan sumber dan waktu data.
- Bedakan data aktual, data tertunda, data usang, data tidak tersedia, dan data simulasi.
- Grafik harus memiliki judul yang menjelaskan metrik, satuan, rentang waktu, dan sumber jika tersedia.
- Jangan menggunakan animasi chart yang berat atau berulang.
- Saat filter berubah, transisi data harus halus tetapi tidak menghalangi pembacaan.
- Jangan menampilkan angka atau visualisasi tanpa sumber data yang jelas.

---

## 11. Aksesibilitas dan kemudahan penggunaan

Target minimum: WCAG 2.2 AA.

- Kontras teks dan latar harus memadai.
- Semua fungsi dapat digunakan dengan keyboard.
- Focus-visible harus jelas.
- Gunakan HTML semantik dan label aksesibel.
- Ikon tanpa teks harus memiliki accessible name.
- Jangan mengandalkan warna saja untuk status.
- Target sentuh minimal 44×44px.
- Form harus memiliki label dan pesan validasi yang jelas.
- Hormati `prefers-reduced-motion`.
- Hormati `prefers-reduced-transparency` bila memakai transparansi.
- Pastikan tampilan dapat digunakan dengan zoom browser 200%.
- Bahasa harus sederhana dan tidak mengasumsikan pengguna memahami istilah teknis.
- Jangan memaksa gestur; setiap gestur harus memiliki alternatif tombol.
- Jangan meminta izin lokasi presisi sebelum menjelaskan alasan dan memperoleh persetujuan.

---

## 12. Performa dan perangkat

SENTRAVAX harus ringan, responsif, dan dapat digunakan pada perangkat kelas menengah maupun perangkat dengan spesifikasi terbatas.

### 12.1 Prinsip performa

- Hindari dependency besar jika fitur dapat dibuat dengan solusi yang lebih ringan.
- Jangan menambahkan library animasi hanya untuk transisi sederhana.
- Gunakan CSS transition untuk interaksi dasar.
- Lazy-load halaman, peta, chart, dan aset berat.
- Pecah bundle berdasarkan route/fitur bila bermanfaat.
- Optimalkan gambar ke WebP/AVIF dengan ukuran responsif.
- Tetapkan dimensi gambar untuk mencegah layout shift.
- Hindari render ulang komponen yang tidak perlu.
- Hindari animasi yang memicu layout/reflow terus-menerus.
- Gunakan `transform` dan `opacity` untuk animasi bila sesuai.
- Jangan memuat globe/3D sebelum konten utama yang penting tampil.
- Sediakan fallback peta datar jika WebGL tidak tersedia atau perangkat tidak mampu.
- Jangan memuat semua chart atau layer peta sekaligus.
- Gunakan pagination atau virtualisasi hanya jika volume data memang membutuhkannya.

### 12.2 Responsive dan koneksi terbatas

- Uji desktop, tablet, dan mobile.
- Pastikan layout tidak pecah pada layar kecil.
- Sediakan mode hemat data jika fitur visual berat digunakan.
- Pada perangkat lemah, kurangi blur, animasi, dan efek kompleks.
- Hindari video autoplay.
- Berikan fallback yang tetap fungsional saat koneksi lambat atau sumber data gagal.
- Jangan membuat pengguna harus memakai perangkat flagship untuk mengakses fitur inti.

### 12.3 Target kualitas

Target awal untuk halaman publik:
- LCP di bawah 2,5 detik pada koneksi 4G menengah.
- CLS di bawah 0,1.
- INP di bawah 200ms bila memungkinkan.
- Lighthouse Accessibility minimal 95 sebagai target audit.
- Periksa ukuran bundle dan waktu interaksi setelah menambah dependency besar.

Target tersebut harus diuji pada build nyata; jangan mengklaim tercapai tanpa hasil pengukuran.

---

## 13. Implementasi teknis

Stack utama:
- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- React Router
- Axios
- Lucide React untuk ikon
- Laravel REST API
- PostgreSQL + PostGIS

Aturan implementasi:
1. Simpan token warna, radius, spacing, shadow, dan motion sebagai CSS variables/design tokens.
2. Komponen UI dasar dibuat reusable, tetapi jangan membuat abstraksi berlebihan.
3. Pisahkan komponen berdasarkan tanggung jawab dan domain.
4. Jangan menambahkan dependency tanpa alasan dan evaluasi ukuran/performa.
5. Gunakan `loading="lazy"` atau strategi lazy loading yang tepat untuk aset non-kritis.
6. Pastikan semua tombol dan link memiliki fungsi yang benar.
7. Jangan memasukkan API key atau secret ke bundle frontend.
8. Jangan mengubah backend, database, atau autentikasi di luar scope fase yang sedang dikerjakan.
9. Jangan mengubah data simulasi menjadi data live tanpa sumber dan validasi.
10. Jangan menghapus atau mengganti komponen yang sudah berfungsi tanpa alasan teknis yang jelas.

### 13.1 Token motion

Gunakan token motion bersama agar interaksi konsisten:

```css
:root {
  --motion-fast: 140ms;
  --motion-base: 180ms;
  --motion-panel: 220ms;
  --motion-ease: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-base: 0ms;
    --motion-panel: 0ms;
  }
}
```

Sesuaikan transisi per komponen. Jangan menerapkan selector global yang mematikan semua feedback visual penting.

### 13.2 Contoh skeleton netral

```css
.skeleton {
  position: relative;
  overflow: hidden;
  background: var(--skeleton-base);
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    var(--skeleton-highlight),
    transparent
  );
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
    display: none;
  }
}
```

Gradient pada contoh ini hanya highlight netral untuk skeleton loading. Jangan gunakan teknik ini untuk dekorasi UI.

---

## 14. Workflow desain dan prompt Antigravity

Agent tidak boleh mengerjakan seluruh desain empat area dalam satu prompt besar.

### 14.1 Tahapan desain yang disarankan

**Tahap A — Fondasi bersama**
- Audit struktur frontend yang sudah ada.
- Muat Skill Anti Slop.
- Periksa referensi visual yang diberikan.
- Buat design tokens, typography, spacing, button, input, badge, skeleton, modal, toast, dan komponen dasar.
- Pastikan dua keluarga tema: light dan black/dark neutral.

**Tahap B — Public Website + User Portal**
- Dikerjakan dalam prompt tersendiri.
- Keduanya memakai keluarga tema light yang sama.
- Fokus pada aksesibilitas, kemudahan masyarakat, navigasi, dan alur pengguna.
- Jangan mengubah Admin Dashboard dan Intelligence Center kecuali komponen bersama yang memang perlu.

**Tahap C — Admin Dashboard + Intelligence Center**
- Dikerjakan dalam prompt tersendiri.
- Keduanya memakai latar hitam netral.
- Admin fokus pada manajemen.
- Intelligence fokus pada peta, analisis, AI, dan operasi.
- Jangan mengubah Public Website dan User Portal.

**Tahap D — Audit lintas area**
- Uji konsistensi token.
- Uji responsive dan micro-interaction.
- Uji loading skeleton, empty/error state, keyboard, reduced motion.
- Uji performa.
- Periksa tidak ada emoji, neon, glow, dan gradient dekoratif.

### 14.2 Isi minimum setiap prompt desain

Setiap prompt untuk Antigravity harus menyebutkan:
1. Scope halaman/area yang boleh diubah.
2. File dan komponen yang relevan.
3. Referensi visual yang wajib diperiksa.
4. Kewajiban membaca Skill Anti Slop.
5. Keluarga warna yang berlaku.
6. Aturan layout dan responsive.
7. Aturan micro-interaction dan skeleton shimmer.
8. Larangan visual.
9. Batas performa dan dependency.
10. Kriteria penerimaan dan format laporan.

Agent harus mengerjakan scope yang diminta saja. Jangan melakukan redesign area lain secara otomatis.

---

## 15. Checklist sebelum menyatakan pekerjaan desain selesai

### Visual
- [ ] Public Website dan User Portal memakai tema putih yang sama.
- [ ] Admin Dashboard dan Intelligence Center memakai latar hitam netral, bukan midnight navy.
- [ ] Tidak ada warna neon, glow, atau gradient dekoratif.
- [ ] Tidak ada emoji/emoticon atau ikon karakter teks.
- [ ] Warna berasal dari design tokens.
- [ ] Desain clean, minimalis, simpel, profesional, dan elegan.
- [ ] Tidak ada dekorasi tanpa fungsi.
- [ ] Copy ringkas dan mudah dimengerti.

### Layout dan UX
- [ ] Tidak ada elemen bertumpuk, terpotong, atau terlalu rapat.
- [ ] Navigasi jelas dan mudah digunakan.
- [ ] Tidak ada tombol atau link palsu.
- [ ] Setiap aksi memiliki feedback.
- [ ] Tombol memiliki hover, pressed, focus, disabled, dan loading state yang relevan.
- [ ] Interaksi terasa halus dan tidak mengganggu.
- [ ] Skeleton shimmer digunakan untuk loading konten.
- [ ] Empty, error, unavailable, stale, dan simulated state tersedia sesuai kebutuhan.

### Responsivitas dan performa
- [ ] Desktop, tablet, dan mobile diuji.
- [ ] Tidak ada horizontal overflow yang tidak disengaja.
- [ ] Target sentuh minimal 44×44px.
- [ ] Halaman tetap nyaman di layar kecil.
- [ ] Aset berat dimuat secara lazy.
- [ ] Tidak ada dependency atau animasi berat yang tidak diperlukan.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] Build dan lint berhasil.

### Referensi dan Anti Slop
- [ ] Skill Anti Slop sudah dimuat dan digunakan.
- [ ] Referensi visual untuk scope pekerjaan sudah diperiksa.
- [ ] Implementasi tidak menyalin referensi secara mentah.
- [ ] Keputusan desain seimbang dengan `design.md` dan Skill Anti Slop.
- [ ] Screenshot desktop dan mobile sudah ditinjau.
- [ ] Laporan memuat bagian Tinjauan Anti Slop dan analisis referensi.

---

## 16. Format laporan Agent

Setiap fase desain harus melaporkan:

1. Scope pekerjaan dan file yang diubah.
2. Skill Anti Slop yang dimuat dan prinsip yang diterapkan.
3. Referensi visual yang diperiksa dan prinsip yang diambil.
4. Komponen, token, dan halaman yang dibuat/diubah.
5. Interaksi dan animasi yang diterapkan.
6. Loading skeleton dan state lain yang diuji.
7. Hasil pengujian desktop, tablet, dan mobile.
8. Hasil build, lint, dan pengujian performa jika relevan.
9. Tinjauan Anti Slop: temuan, perubahan, dan alasan.
10. Hal yang belum selesai atau memerlukan keputusan pemilik proyek.

Jangan menyatakan pekerjaan selesai jika belum diuji. Bedakan dengan jelas antara yang sudah diimplementasikan, yang baru direncanakan, dan yang belum tersedia.

---

## 17. Prinsip penutup

SENTRAVAX tidak perlu terlihat ramai untuk terlihat canggih. Kualitas harus terasa dari struktur yang rapi, informasi yang jujur, interaksi yang responsif, animasi mikro yang tepat, dan performa yang ringan.

**Arah visual final:**
- Public Website + User Portal: putih, bersih, minimalis, ramah, dan konsisten.
- Admin Dashboard + Intelligence Center: hitam netral, tegas, profesional, dan fokus pada informasi.
- Semua area: warna solid yang tenang, tanpa neon, tanpa gradient dekoratif, tanpa emoji, tanpa AI slop.
- Semua interaksi: memiliki feedback dan micro-interaction yang halus.
- Semua halaman: responsive, mudah dipahami, tidak padat berlebihan, dan ringan digunakan.

Dokumen ini menjadi acuan desain utama SENTRAVAX untuk seluruh fase pengembangan berikutnya.
