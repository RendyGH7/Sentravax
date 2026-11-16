# SENTRAVAX — Product Requirements Document (PRD)
## AI-Powered Geospatial Intelligence & Community Resilience Platform

> [!NOTE]
> **KONSOLIDASI ROLE RESMI:** Sesuai keputusan arsitektur final, platform secara resmi hanya memiliki 3 peran (*canonical roles*): **`admin`**, **`intelligence`**, dan **`user`**. Peran *Analyst* dan *Operator* yang disebutkan pada draf PRD awal telah disatukan ke dalam kewenangan peran `intelligence`, sedangkan pengelolaan platform berada di bawah peran `admin`. Rujukan teknis hak akses terkini dapat dilihat pada [`API_CONTRACT.md`](./API_CONTRACT.md).

**Dokumen:** Product Requirements Document  
**Versi:** 1.0  
**Status:** Baseline untuk perencanaan dan implementasi MVP  
**Tanggal:** 4 November 2026  
**Nama produk:** SENTRAVAX  
**Tagline:** *See the Signals. Understand the Risk. Act Together.*

---

# 1. Ringkasan Produk

## 1.1 Visi

SENTRAVAX adalah platform kecerdasan geospasial dan ketahanan masyarakat yang menggabungkan data lingkungan, cuaca, kejadian bencana, peta, laporan masyarakat, dan analisis AI untuk membantu masyarakat memahami kondisi di sekitar mereka, mengenali indikator risiko, mempersiapkan diri, dan mengambil tindakan yang tepat.

SENTRAVAX bukan sekadar dashboard yang menampilkan peta atau kumpulan berita bencana. Platform harus memiliki alur operasional yang nyata: mengambil data dari sumber yang dapat dipertanggungjawabkan, memvalidasi dan memperbarui data, menganalisis perubahan kondisi, menghasilkan insight yang dapat dijelaskan, menyampaikan informasi kepada pengguna yang relevan, dan menyediakan mekanisme tindak lanjut.

## 1.2 Pernyataan produk

> SENTRAVAX transforms trusted environmental and geospatial data into understandable, location-aware intelligence and coordinated community action.

## 1.3 Masalah yang diselesaikan

1. Informasi risiko tersebar di banyak sumber dan sulit dipahami masyarakat.
2. Masyarakat sering mengetahui kondisi berbahaya ketika dampaknya sudah terasa.
3. Peta dan data teknis tidak selalu menjelaskan apa arti kondisi tersebut bagi warga.
4. Laporan masyarakat sulit dipilah, diverifikasi, dan ditindaklanjuti.
5. Informasi resmi, observasi, laporan warga, dan analisis AI sering tercampur sehingga berisiko menimbulkan salah persepsi.
6. Informasi kesiapsiagaan sering tidak terhubung dengan kondisi lokal pengguna.

## 1.4 Sasaran utama

SENTRAVAX harus mampu:
- Mengumpulkan data dari sumber eksternal dan internal secara terjadwal atau melalui mekanisme streaming/webhook jika tersedia.
- Menampilkan kondisi dan kejadian pada peta interaktif.
- Menyediakan konteks lokasi dan waktu untuk setiap informasi.
- Melakukan analisis risiko yang transparan dan dapat diaudit.
- Menghasilkan AI insight secara kontekstual dan proaktif.
- Mengirimkan notifikasi hanya ketika relevan, dengan mekanisme pencegah spam.
- Menerima laporan warga dan menyediakan proses verifikasi manusia.
- Menyediakan panduan kesiapsiagaan yang relevan.
- Tetap dapat digunakan ketika sebagian sumber data atau layanan eksternal sedang tidak tersedia.

## 1.5 Bukan tujuan produk

SENTRAVAX **bukan**:
- Pengganti BMKG, BNPB, BPBD, pemadam kebakaran, tenaga medis, atau layanan darurat resmi.
- Sistem yang menjamin dapat memprediksi waktu dan lokasi bencana secara pasti.
- Sistem yang mengeluarkan peringatan resmi tanpa otoritas terkait.
- Sekadar chatbot AI, landing page, atau dashboard statistik dekoratif.
- Platform yang menganggap semua hotspot sebagai kebakaran terkonfirmasi.
- Aplikasi yang mengklaim data real-time apabila sumbernya hanya diperbarui secara berkala atau sedang tidak tersedia.

## 1.6 Standar Desain Visual-Rich, User-Friendly & Universal

Sebagai platform kecerdasan kebencanaan publik yang dirancang untuk seluruh lapisan masyarakat Indonesia, SENTRAVAX menetapkan 6 pilar standar desain visual dan pengalaman pengguna (UX) yang wajib dipatuhi di seluruh antarmuka:

### 1.6.1 Enam Pilar Standar Desain
1. **Visual-Rich (Kaya Visual & Informatif):**
   - Area publik dan portal warga dilengkapi dengan banyak ilustrasi berkualitas tinggi, ikon tematik kebencanaan (banjir, gempa, cuaca ekstrem, kebakaran hutan/lahan, tanah longsor), visualisasi infografik terstruktur, dan dekorasi grafis kontekstual yang memperjelas informasi tanpa mengaburkan data.
   - Mengadopsi visualisasi lanskap terrain 3D / isometrik (seperti lembah sungai, perbukitan rawan longsor, zonasi pemukiman warga) dengan penanda pin risiko interaktif (*High-risk*, *Medium-risk*, *Low-risk*) untuk memberikan pemahaman spasial yang langsung intuitif bagi masyarakat awam.
2. **User-Friendly (Mudah Dipahami Semua Kalangan):**
   - Penyampaian informasi bebas dari jargon teknis meteorologi/geologi yang membingungkan. Skala risiko dan tingkat keparahan dijelaskan dalam bahasa sehari-hari yang lugas, dilengkapi arti risiko konkret dan rekomendasi tindakan nyata yang harus diambil warga.
   - Indikator telemetri lingkungan disajikan dengan label yang jelas, status peringatan tegas, dan panduan tindak lanjut langsung.
3. **Universal & Inklusif (Nyaman Lintas Generasi & Usia):**
   - Antarmuka dirancang untuk kenyamanan berbagai kelompok usia, mulai dari generasi muda pengguna ponsel pintar hingga kalangan orang tua dan lansia (*elderly-friendly*).
   - Memenuhi standar aksesibilitas **WCAG 2.1 Level AA**: rasio kontras teks minimal 4.5:1 terhadap latar belakang, skala tipografi modular yang mudah dibaca (body text minimum 16px, caption minimum 14px), target sentuhan jari (*touch targets*) minimum 44×44 px, serta navigasi yang ramah pembaca layar (*screen reader*) dan keyboard navigation.
4. **Variatif & Tidak Monoton (Dinamika Tata Letak):**
   - Tata letak antarmuka bervariasi dengan ritme visual yang seimbang: mengombinasikan kartu telemetri modern (seperti kartu cuaca & lingkungan bernuansa dark teal yang elegan dengan ramalan per jam), tab metrik mingguan untuk multi-indikator (*Water Level*, *Temperature*, *Precipitation*), modular card grid, banner informasi darurat, dan infografik edukatif.
   - Menghindari tata letak kartu yang seragam/monoton atau tampilan tabel data mentah yang menjemukan.
5. **Profesional & Berwibawa (Civic-Tech Credibility):**
   - Antarmuka mempertahankan estetika produk teknologi sipil yang matang, berwibawa, dan tenang.
   - Tidak menggunakan ilustrasi kartun kekanak-kanakan atau gaya visual main-main yang dapat mereduksi keseriusan dan urgensi mitigasi keselamatan jiwa.
6. **Optimal & Berkinerja Tinggi (High-Performance Assets):**
   - Seluruh aset grafis dan ilustrasi dioptimasi secara ketat: menggunakan format SVG modern untuk vektor dan WebP terkompresi untuk raster/ilustrasi lanskap.
   - Waktu muat awal (*Largest Contentful Paint* / LCP) ditargetkan < 1.5 detik pada koneksi internet seluler, tanpa membebani performa browser atau menimbulkan lag saat interaksi peta.

---

# 2. Pengguna dan Hak Akses

## 2.1 Persona

### A. Masyarakat / Resident
Membutuhkan informasi kondisi sekitar, panduan kesiapsiagaan, notifikasi relevan, dan cara melaporkan kejadian.

### B. Relawan / Community Contributor
Membutuhkan sarana mengirim laporan, melihat tugas atau aktivitas komunitas yang diizinkan, dan memberikan pembaruan lapangan.

### C. Moderator / Verifikator
Memeriksa laporan warga, mendeteksi duplikasi, meminta klarifikasi, dan mengubah status laporan dengan jejak audit.

### D. Administrator
Mengelola pengguna, role, sumber data, kategori bahaya, konten, konfigurasi sistem, dan pemantauan operasional.

### E. Operator Data / Analyst
Memantau integrasi data, kualitas data, hasil sinkronisasi, layer peta, serta hasil analisis risiko. Hak akses ini dapat digabung dengan admin untuk MVP jika jumlah personel terbatas.

## 2.2 Matriks akses minimum

| Fitur / Layanan Kebencanaan | Pengunjung (Guest) | Warga Terdaftar (User) | Relawan Komunitas | Moderator / Intelligence | Administrator |
|---|---:|---:|---:|---:|---:|
| Melihat landing page & visual katalog | Ya | Ya | Ya | Ya | Ya |
| Melihat peta publik interaktif multi-hazard | Ya | Ya | Ya | Ya | Ya |
| Melihat insight & feed peringatan dini publik (CAP) | Ya | Ya | Ya | Ya | Ya |
| Akses panduan kesiapsiagaan & checklist tas siaga | Ya | Ya | Ya | Ya | Ya |
| Cek risiko mandiri lokasi (SIAGA PERSONAL) | Ya | Ya | Ya | Ya | Ya |
| Akses peta rute evakuasi & shelter darurat | Ya | Ya | Ya | Ya | Ya |
| Akses direktori kontak darurat 24/7 (112, BPBD, SAR) | Ya | Ya | Ya | Ya | Ya |
| Mengirim laporan darurat (*Fast-Track Guest*) | Ya (Anti-Spam OTP/Captcha) | Ya | Ya | Ya | Ya |
| Melihat & melacak riwayat laporan pribadi | Tidak | Ya | Ya | Ya | Ya |
| Personalisasi preferensi lokasi & push notifikasi | Tidak | Ya | Ya | Ya | Ya |
| Mengelola kontribusi relawan | Tidak | Tidak | Ya | Ya | Ya |
| Triage cepat & verifikasi laporan lapangan | Tidak | Tidak | Tidak | Ya | Ya |
| Eskalasi laporan menjadi Hazard Event aktif | Tidak | Tidak | Tidak | Ya | Ya |
| Diseminasi darurat (Broadcast CAP Warning) | Tidak | Tidak | Tidak | Ya | Ya |
| Mengelola sumber data & konfigurasi sistem | Tidak | Tidak | Tidak | Tidak | Ya |
| Melihat audit log penuh | Tidak | Tidak | Tidak | Terbatas | Ya |

Semua izin wajib ditegakkan di backend. Menyembunyikan tombol di frontend bukan mekanisme otorisasi.

## 2.3 Prinsip Akses Kesiapsiagaan & Tanggap Darurat Tanpa Hambatan (Emergency Zero-Barrier for Citizens)

Dalam situasi krisis dan bencana alam, setiap detik sangat berharga untuk menyelamatkan nyawa (*life-saving seconds*). SENTRAVAX menganut prinsip **Zero-Barrier Access**: seluruh fitur keselamatan, mitigasi, informasi evakuasi, dan pelaporan darurat dapat digunakan langsung oleh masyarakat—baik warga yang belum memiliki akun (guest) maupun yang sudah login—tanpa terhalang oleh *login wall* atau birokrasi registrasi yang memperlambat penyelamatan.

### A. Fitur Akses Bebas untuk Seluruh Warga (Guest & Authenticated)
1. **Persiapan (Preparedness):**
   - Evaluasi risiko instan lokasi via **SIAGA PERSONAL** (cukup memilih lokasi dari dropdown atau mengizinkan GPS perangkat, langsung menghasilkan profil risiko tanpa perlu login).
   - Akses interaktif checklist tas siaga bencana (*Go-Bag interactive checklist*) dengan penyimpanan status otomatis pada local storage browser warga.
   - Direktori hotline darurat nasional dan regional yang dapat langsung dihubungi dengan 1-klik (112, 115, 117, BPBD provinsi/kabupaten, SAR, Pemadam Kebakaran, dan RS Rujukan terdekat).
2. **Antisipasi (Anticipation & Early Warning):**
   - Live stream peringatan dini resmi CAP (*Common Alerting Protocol*) terverifikasi dengan banner status bahaya yang mencolok dan jelas.
   - Indikator telemetri lingkungan dan cuaca lokal real-time (suhu, curah hujan, tinggi muka air, status seismik).
3. **Mitigasi (Mitigation):**
   - Edukasi keselamatan multi-hazard kontekstual yang mudah dipahami seluruh kelompok usia.
   - Peta zonasi kerentanan wilayah dan rekomendasi langkah mitigasi mandiri sebelum ancaman memburuk.
4. **Evakuasi (Evacuation):**
   - Visualisasi peta rute evakuasi resmi, lokasi titik kumpul aman (*assembly points*), posko logistik pengungsian, dan fasilitas kesehatan rujukan terdekat.
5. **Pelaporan Darurat Tanpa Hambatan (*Fast-Track Guest Reporting*):**
   - Warga yang belum login dapat langsung melaporkan insiden darurat melalui alur ringkas (kategori bahaya, foto bukti, deskripsi singkat, koordinat otomatis/pin peta).
   - Dilindungi mekanisme anti-spam ringan (*invisible captcha* / rate-limiting ketat / verifikasi OTP instan via SMS/WhatsApp) tanpa memaksa pendaftaran akun baru.
   - Setelah pelaporan berhasil, sistem memberikan *tracking token* atau opsi 1-klik membuat akun/klaim laporan agar warga dapat memantau penanganan oleh petugas.

### B. Nilai Tambah Warga Terdaftar (Authenticated Citizens)
Warga yang melakukan login/registrasi memperoleh kapabilitas personalisasi lanjutan:
- Pemantauan multi-lokasi tersimpan secara simultan (misal: rumah tempat tinggal, rumah orang tua di daerah, tempat kerja).
- Notifikasi darurat proaktif via browser push notification dan integrasi pesan instan.
- Riwayat pelaporan terpadu dengan pelacakan status penanganan oleh tim verifikator dan petugas lapangan secara real-time.
- Kontribusi terverifikasi dalam jaringan relawan ketahanan komunitas (*Community Resilience Contributor*).

## 2.4 Arsitektur Respons Terhubung & Ekosistem Lintas-Role (Connected Response Ecosystem)

SENTRAVAX bukan sekadar katalog informasi statis atau dashboard terpisah, melainkan sebuah platform dengan **alur komunikasi dan respons tertutup (*closed-loop emergency response*)** yang saling terhubung antara empat area utama:

1. **Public & Guest:** Ruang publik bebas hambatan untuk mencari informasi, memahami risiko, menerima peringatan dini, dan melapor darurat secara cepat.
2. **User Portal:** Ruang personal bagi warga untuk mengelola kesiapsiagaan keluarga, melacak histori laporan, dan berlangganan notifikasi wilayah prioritas.
3. **Intelligence Center:** Meja komando operasional bagi petugas/analis untuk menganalisis risiko geospasial, memverifikasi laporan masyarakat, mengoordinasikan penanganan lapangan, dan menerbitkan peringatan resmi.
4. **Admin Workspace:** Pengelolaan menyeluruh terhadap tata kelola pengguna, integritas sumber data, kurasi edukasi, dan audit trail sistem.
5. **AI Proactive Intelligence:** Lapisan analitik dan otomasi yang menjembatani data: melakukan auto-clustering spasial PostGIS ($\le 2$ km, $\le 2$ jam), mendeteksi lonjakan insiden (*incident surge*), dan menyusun rekomendasi prioritas tanggap darurat bagi tim intelijen.

Rincian alur kerja operasional, transisi status, dan matriks integrasi lintas-role diatur dalam dokumen arsitektur [`CROSS_ROLE_WORKFLOW.md`](./CROSS_ROLE_WORKFLOW.md).

---

# 3. Prinsip Produk dan Keselamatan

1. **AI-centered, not AI-only:** AI menghubungkan konteks dan menjelaskan hasil analisis; perhitungan risiko terukur dilakukan oleh Risk Engine.
2. **Multi-hazard:** arsitektur mendukung berbagai bahaya, bukan hanya kebakaran hutan/lahan.
3. **Proactive:** sistem dapat memproses event dan menghasilkan insight tanpa menunggu pengguna bertanya.
4. **Location-aware:** hasil disesuaikan dengan lokasi pilihan pengguna atau lokasi perangkat setelah persetujuan eksplisit.
5. **Human-verified:** laporan masyarakat dan keputusan kritis memerlukan pemeriksaan manusia atau otoritas terkait.
6. **Traceable:** setiap informasi memiliki sumber, waktu observasi, waktu pengambilan, status kesegaran, dan metode pemrosesan.
7. **Graceful degradation:** fitur inti tetap berguna ketika satu API eksternal gagal.
8. **Privacy by design:** lokasi presisi dan identitas pelapor tidak dibuka ke publik secara default.
9. **No false certainty:** skor risiko dan insight bukan kepastian bahwa bencana akan terjadi.
10. **Actionable:** informasi harus membantu pengguna memahami tindakan yang masuk akal, bukan hanya menampilkan angka.

## 3.1 Klasifikasi informasi yang wajib terlihat

- **Official Warning:** peringatan yang diterbitkan otoritas resmi. Tampilkan nama sumber dan waktu penerbitan.
- **Observed Data:** hasil observasi atau data sensor/satelit/cuaca. Bukan otomatis peringatan.
- **Community Report:** laporan masyarakat yang status verifikasinya harus terlihat.
- **SENTRAVAX Insight:** hasil analisis internal berbasis data dan aturan yang tersedia.
- **Simulated/Demo Data:** data demonstrasi yang harus diberi label permanen dan tidak boleh bercampur seolah-olah data aktual.

Jangan menggunakan satu warna atau satu label untuk semua jenis informasi.

## 3.2 Delapan Prinsip UX Lintas Platform (Unified UX Standards)

Setiap modul dan interaksi dalam ekosistem SENTRAVAX wajib mematuhi 8 prinsip UX universal:
1. **Minimum Steps:** Tindakan penting (melihat rute evakuasi, membaca peringatan, melapor darurat) diselesaikan dalam maksimal 2–3 interaksi tanpa langkah berulang.
2. **One Clear Action:** Setiap layar memiliki tindakan utama (*Primary CTA*) yang jelas dan dominan; pengguna selalu tahu langkah berikutnya.
3. **Fast Access:** Fitur darurat mudah ditemukan seketika; tombol hotline 24/7 dan pelaporan darurat tidak boleh tersembunyi di dalam menu bertingkat.
4. **Real-Time Feedback:** Status laporan, pembaruan risiko, dan eksekusi tindakan ditampilkan dengan jelas melalui toast notifikasi, skeleton shimmer, dan pembaruan badge instan.
5. **No Dead Ends:** Kondisi error, data kosong, atau koneksi terputus selalu menyertakan penjelasan yang mudah dipahami serta aksi pemulihan konkret (misal: "Coba lagi", "Unduh panduan offline", atau "Hubungi 112").
6. **Role-Based Simplicity:** Setiap role hanya melihat kontrol yang memang dibutuhkan sesuai tugasnya tanpa gangguan visual yang tidak relevan.
7. **Human Verification:** AI bertindak sebagai asisten pengelompok dan pemberi konteks; keputusan krusial seperti penerbitan peringatan darurat publik dan eskalasi evakuasi wajib disetujui manusia.
8. **Accessible Everywhere:** Sangat nyaman digunakan melalui ponsel maupun desktop, ramah bagi pengguna awam dan warga lansia, serta mematuhi standar aksesibilitas WCAG 2.1 AA.

---

# 4. Cakupan Multi-Hazard

Sistem harus memiliki model data generik untuk tipe bahaya sehingga kategori baru dapat ditambahkan tanpa menulis ulang seluruh aplikasi.

Kategori awal:
1. Banjir dan genangan.
2. Cuaca ekstrem: hujan lebat, angin kencang, petir, dan kondisi cuaca signifikan.
3. Kebakaran hutan/lahan dan anomali termal.
4. Longsor.
5. Gempa bumi.
6. Kekeringan dan kondisi lingkungan.

### 4.1 Batas analisis per kategori

- **Banjir:** dapat menggunakan curah hujan, riwayat banjir, elevasi, topografi, data genangan, dan laporan warga jika tersedia. Jangan mengklaim prediksi banjir presisi tanpa model dan validasi.
- **Cuaca ekstrem:** gunakan data dan peringatan dari penyedia resmi yang tersedia. Cantumkan periode berlaku.
- **Kebakaran:** hotspot satelit adalah anomali termal, bukan bukti pasti kebakaran. Gabungkan dengan sumber lain dan verifikasi.
- **Longsor:** faktor dapat mencakup curah hujan, kemiringan lereng, kondisi geologi/permukaan, riwayat kejadian, dan laporan. Jika hanya data statis tersedia, tampilkan sebagai kerentanan relatif, bukan kondisi real-time.
- **Gempa:** tampilkan kejadian yang telah terdeteksi/dilaporkan, magnitudo, kedalaman, dan episentrum jika disediakan sumber. Jangan membuat prediksi gempa.
- **Kekeringan:** gunakan tren curah hujan dan indikator lingkungan yang tersedia; jelaskan rentang waktu analisis.

---

# 5. Modul dan Persyaratan Fungsional

## 5.1 Public Landing Page & Visual Catalog

**Tujuan:** Menjelaskan nilai produk, menyajikan intelijen kebencanaan visual yang atraktif dan mudah dipahami, serta memberikan jalur masuk darurat instan tanpa hambatan bagi masyarakat.

Konten & Komposisi Visual:
- **Hero Section Visual-Rich:** Menampilkan ilustrasi lanskap 3D isometrik multi-hazard (terrain lembah, lereng berbukit, perairan, dan permukiman warga) yang dipadukan dengan pin status risiko interaktif (*High-risk*, *Medium-risk*, *Low-risk*) untuk mendemonstrasikan kapabilitas spasial platform secara langsung.
- **Kartu Telemetri Cuaca & Lingkungan:** Komponen kartu dark teal elegan dengan data cuaca lokal real-time, ringkasan sumber resmi (BMKG/Penyedia Cuaca), ramalan cuaca per jam (ikon matahari, hujan, awan), badge status risiko hasil survei lokasi, serta tab mingguan untuk pemantauan indikator *Water level*, *Temperature*, dan *Precipitation*.
- **Emergency Action Bar (Jalur Cepat Darurat):** Tombol aksi cepat untuk Cek Risiko Mandiri (SIAGA PERSONAL), Peta Evakuasi & Titik Kumpul, serta Pelaporan Bencana Cepat tanpa wajib login.
- **Preview Peta Intelijen Kebencanaan:** Peta interaktif ringkas dengan filter layer bahaya dan label data simulasi/aktual yang transparan.
- **Alur Kerja Transparan:** Infografik alur Data → Analysis → Insight → Action yang mudah dimengerti warga awam.
- **Katalog Edukasi & Aksi Multi-Hazard:** Kartu edukasi visual-rich berisi ikon grafis menarik untuk banjir, cuaca ekstrem, kebakaran, gempa bumi, dan tanah longsor.
- **Transparansi Sumber Data & Batasan Sistem:** Penjelasan tegas atribusi sumber data resmi dan batasan teknologi.

Kriteria:
- Responsif optimal di desktop, tablet, dan ponsel dengan layout variatif dan tidak monoton.
- Memenuhi standar universal WCAG 2.1 AA (kontras teks tinggi, navigasi ramah segala umur).
- Tidak menampilkan statistik dampak yang tidak memiliki sumber terverifikasi.
- Semua tombol navigasi dan CTA memiliki fungsi nyata yang dapat diakses langsung.

## 5.2 Authentication dan User Profile

Fitur:
- Registrasi, login, logout.
- Verifikasi email jika infrastruktur email tersedia.
- Reset password.
- Profil dasar.
- Preferensi lokasi (dapat diisi manual).
- Persetujuan penggunaan lokasi perangkat.
- Preferensi notifikasi per kategori dan tingkat urgensi.
- Riwayat laporan milik pengguna.

Persyaratan:
- Gunakan Laravel Sanctum atau mekanisme autentikasi yang konsisten dengan arsitektur backend.
- Hash password menggunakan mekanisme standar framework.
- Terapkan rate limit untuk login dan endpoint sensitif.
- Jangan menyimpan token rahasia di source code frontend.

## 5.3 Overview Dashboard

Dashboard harus menjawab:
1. Bagaimana kondisi lokasi yang saya pilih?
2. Apakah ada peringatan resmi yang berlaku?
3. Apa insight terbaru yang relevan?
4. Apa yang berubah sejak pembaruan sebelumnya?
5. Apa tindakan atau informasi lanjutan yang dapat saya akses?

Komponen prioritas:
- Ringkasan lokasi aktif dan waktu pembaruan data.
- Peringatan resmi aktif, jika ada.
- Proactive insight terpenting.
- Peta ringkas dengan kejadian/layer relevan.
- Perubahan kondisi terbaru.
- Aktivitas laporan masyarakat.
- Akses cepat ke lapor kejadian dan panduan kesiapsiagaan.

Hindari dashboard yang dipenuhi kartu statistik tanpa konteks.

## 5.4 Earth Intelligence — Peta Interaktif

Fitur:
- Pan, zoom, pencarian lokasi, dan geolocation dengan izin pengguna.
- Pemilihan layer berdasarkan kategori bahaya.
- Filter waktu, sumber, status verifikasi, dan tingkat urgensi.
- Marker untuk kejadian dan laporan.
- Polygon/choropleth/heatmap hanya jika data dan metode mendukung.
- Panel detail saat marker atau area dipilih.
- Legenda yang konsisten.
- Informasi sumber, waktu observasi, waktu sinkronisasi, status freshness, dan batasan.
- Tampilan lokasi fasilitas publik jika data valid tersedia.

Layer awal:
- Cuaca dan kondisi hujan.
- Kejadian gempa.
- Hotspot/anomali termal.
- Zona kerentanan banjir/longsor jika dataset tersedia.
- Laporan masyarakat.
- Peringatan resmi.
- Fasilitas publik.

Kriteria:
- Layer yang gagal dimuat menampilkan pesan dan opsi mencoba kembali.
- Pengguna dapat mematikan layer.
- Jangan memuat seluruh dataset sekaligus; gunakan bounding box, pagination, clustering, vector tiles, atau strategi yang sesuai.
- Data lama harus tetap diberi label stale/delayed.
- Jangan menyamarkan layer simulasi sebagai data aktual.

## 5.5 AI Intelligence — AI Proactive Intelligence

AI adalah lapisan interpretasi dan orkestrasi, bukan sumber kebenaran tunggal.

### A. Contextual AI Assistant
Pengguna dapat bertanya dengan bahasa alami, misalnya:
- “Bagaimana kondisi cuaca dan risiko di area yang saya pilih?”
- “Apa arti data yang muncul pada peta ini?”
- “Mengapa sistem memberikan insight ini?”
- “Apa yang perlu saya persiapkan jika hujan deras berlanjut?”

AI harus:
- Mengambil konteks lokasi, waktu, data, dan status sumber yang relevan.
- Mengutip atau menyebut sumber dan waktu data yang digunakan.
- Membedakan observasi, laporan, inferensi, dan rekomendasi.
- Menyampaikan ketidakpastian dan data yang belum tersedia.
- Menolak membuat kepastian palsu atau instruksi berbahaya.
- Mengarahkan pengguna ke otoritas resmi untuk informasi darurat.

### B. Proactive Insight Generator
Sistem menghasilkan insight ketika:
- Data baru memenuhi kondisi pemicu yang telah ditentukan.
- Nilai indikator berubah secara material.
- Peringatan resmi baru diterima atau berubah status.
- Beberapa sumber memberikan sinyal relevan pada area dan periode yang sama.
- Laporan masyarakat meningkat pada area tertentu, setelah mempertimbangkan kualitas dan verifikasi.

Setiap insight minimal berisi:
- ID dan judul.
- Kategori bahaya.
- Area terdampak atau area relevan.
- Waktu dibuat dan rentang waktu data.
- Tingkat urgensi dengan definisi yang terdokumentasi.
- Ringkasan kondisi.
- Alasan pemicu.
- Sumber dan waktu sumber.
- Rekomendasi tindakan.
- Batasan analisis.
- Status: Draft, Published, Updated, Expired, atau Retracted.
- Versi aturan/model yang digunakan.

### C. AI Report Assistance
AI boleh:
- Mengklasifikasikan kategori laporan.
- Mengekstrak lokasi/waktu dari deskripsi jika tersedia.
- Menyarankan kemungkinan laporan duplikat.
- Merangkum laporan untuk moderator.

AI tidak boleh:
- Menetapkan status Verified secara otomatis.
- Menghapus laporan secara permanen tanpa aturan dan otorisasi.
- Menyimpulkan identitas pelapor atau menyebarkan data privat.

### D. AI Guardrails
- LLM tidak boleh menghitung atau mengarang skor risiko numerik.
- Risk Engine menghasilkan nilai terukur; AI menjelaskan nilai tersebut.
- Prompt dan output harus diuji terhadap prompt injection dan input tidak tepercaya.
- Batasi data pribadi yang dikirim ke penyedia model.
- Simpan metadata analisis, bukan rahasia internal model atau data pribadi yang tidak diperlukan.
- Jika konteks tidak cukup, AI harus mengatakan tidak cukup data.

## 5.6 Risk Engine

Risk Engine adalah layanan/domain backend yang menghasilkan penilaian berdasarkan aturan terukur.

Persyaratan:
- Aturan disimpan dalam konfigurasi atau tabel berversi.
- Setiap aturan memiliki nama, kategori bahaya, input, ambang, bobot jika digunakan, periode validitas, versi, dan penjelasan.
- Simpan nilai input dan hasil evaluasi yang diperlukan untuk audit.
- Bedakan hazard, exposure, vulnerability, dan risk jika metodologi mendukung.
- Skor tidak boleh ditampilkan tanpa penjelasan skala dan metode.
- Data hilang tidak boleh dianggap bernilai nol.
- Risk Engine harus dapat mengembalikan status `insufficient_data`.

Untuk MVP, mulai dari rules-based assessment yang sederhana, terdokumentasi, dan dapat diuji. Jangan mengklaim model prediksi ilmiah jika belum dilatih dan divalidasi.

## 5.7 Community Network — Laporan Masyarakat

### A. Alur Pelaporan Ganda (Authenticated User & Fast-Track Guest)
SENTRAVAX menyediakan dua jalur pelaporan insiden bencana:

1. **Jalur Warga Terdaftar (Authenticated User Reporting):**
   - Pengguna memilih kategori bahaya.
   - Menulis deskripsi kejadian dan detail dampak yang diamati.
   - Memilih lokasi via GPS otomatis atau pin peta interaktif.
   - Melampirkan foto bukti lapangan (divalidasi format, ukuran, dan sanitasi metadata EXIF privat).
   - Sistem menetapkan status `Submitted` dan mengaitkannya ke profil akun pengguna.
   - Pengguna dapat memantau linimasa perkembangan verifikasi laporan di dashboard pribadinya.

2. **Jalur Darurat Cepat Warga Belum Login (*Fast-Track Guest Emergency Reporting*):**
   - Dirancang untuk situasi kritis saat warga membutuhkan pelaporan instan tanpa terhambat proses pembuatan akun.
   - Formulir darurat ringkas satu layar: Kategori Bahaya → Foto Lapangan → Lokasi GPS / Alamat → Nomor Kontak / WhatsApp (untuk validasi).
   - Pengamanan anti-spam berlapis: IP rate-limiting cerdas, sanitasi input, dan verifikasi ringan (misal OTP SMS/WhatsApp instan atau invisible captcha).
   - Sistem memberikan *Public Tracking Token* yang memungkinkan pelapor mengecek status tindak lanjut tanpa perlu login.
   - Opsi 1-klik untuk mendaftarkan akun baru dan mengklaim laporan tersebut ke dalam riwayat permanen.

### B. Siklus Pemrosesan Laporan
1. Pengguna (guest atau login) mengirimkan laporan.
2. Sistem memvalidasi payload, tipe file, dan keamanan lampiran.
3. Sistem memberi status awal `Submitted`.
4. Sistem / AI melakukan ekstraksi entitas, klasifikasi bahaya awal, serta pengecekan klaster spasial terhadap laporan lain yang berdekatan.
5. Petugas moderator / analis intelijen memeriksa laporan di Live Triage Board.
6. Moderator memperbarui status: `Under Review`, `Need More Information`, `Verified`, `Rejected`, atau `Resolved`.
7. Jika laporan diverifikasi memiliki dampak kritis, analis intelijen dapat melakukan 1-klik eskalasi menjadi *Active Hazard Event* pada peta publik.
8. Pelapor menerima pembaruan status (via in-app notification bagi pengguna login, atau via halaman tracking token bagi guest).

Status:
- Submitted
- Under Review
- Need More Information
- Verified
- Rejected
- Resolved

Persyaratan:
- Simpan waktu laporan dan waktu kejadian jika berbeda.
- Simpan koordinat presisi secara terbatas.
- Publik hanya melihat lokasi yang telah digeneralisasi sesuai kebijakan privasi.
- Foto harus divalidasi tipe, ukuran, dan keamanannya.
- Moderator wajib memiliki alasan untuk penolakan atau perubahan status.
- Semua perubahan status masuk audit log.
- Laporan tidak boleh ditampilkan sebagai kejadian terkonfirmasi sebelum diverifikasi.

## 5.8 Early Warning & Preparedness (Peringatan Dini, Mitigasi & Evakuasi)

Modul ini merupakan garda terdepan perlindungan warga masyarakat dengan menyediakan empat pilar aksi keselamatan terintegrasi:

### A. Empat Pilar Aksi Keselamatan
1. **Persiapan (Preparedness):**
   - **SIAGA PERSONAL:** Kalkulasi risiko mandiri berbasis lokasi yang mudah digunakan oleh seluruh kelompok usia tanpa harus login.
   - **Checklist Tas Siaga Bencana (Go-Bag):** Daftar perlengkapan darurat interaktif (dokumen penting, P3K, makanan tahan lama, senter, air minum) dengan penyimpanan progres lokal di peramban warga.
   - **Direktori Hotline Darurat 24/7:** Kontak instan layanan tanggap darurat nasional dan regional (112 panggilan darurat terpadu, 115 Basarnas, 117 BNPB/BPBD, Damkar, PMI, Polisi, dan RS Rujukan).
2. **Antisipasi (Anticipation / Early Warning Center):**
   - **Feed Peringatan Dini Publik (CAP-Compliant):** Menampilkan peringatan resmi dari otoritas (BMKG/BPBD) dan advisory platform dengan pemisahan visual tegas dan transparansi verifikasi penerbit (*issuer verification*).
   - Banner status darurat dengan kode warna standar kebencanaan internasional (Minor, Moderate, Severe, Extreme).
   - Pembaruan kondisi telemetri real-time (curah hujan harian/mingguan, tinggi muka air sungai, aktivitas gempa terkini).
3. **Mitigasi (Mitigation):**
   - Panduan aksi mitigasi terstruktur dalam tiga fase: *Sebelum Kejadian (Pra-Bencana)*, *Saat Kejadian (Tanggap Darurat)*, dan *Setelah Kejadian (Pasca-Bencana)*.
   - Infografik visual-rich langkah mitigasi per tipe bahaya yang mudah dipahami warga lansia maupun anak-anak tanpa istilah teknis berbelit.
4. **Evakuasi (Evacuation):**
   - Peta visual rute evakuasi resmi menuju titik kumpul aman (*assembly points* / shelter).
   - Informasi fasilitas shelter darurat: kapasitas daya tampung, ketersediaan fasilitas sanitasi, aksesibilitas kursi roda/lansia, dan kontak posko logistik.

Semua konten keselamatan harus bersumber dari panduan otoritas resmi tepercaya (BNPB/BPBD/Kemenkes) dan ditinjau secara berkala. Sistem dilarang mengeluarkan instruksi evakuasi buatan sendiri tanpa dasar otoritas resmi.

## 5.9 Impact & Recovery

Untuk MVP, modul ini dapat berupa pencatatan aktivitas yang benar-benar terjadi:
- Aktivitas bantuan atau relawan.
- Proyek pemulihan yang terdaftar.
- Pembaruan progres.
- Dokumentasi kegiatan.
- Kontribusi komunitas.

Jangan menampilkan jumlah bantuan, penerima, atau dampak sebagai fakta jika belum ada catatan yang dapat diaudit. Fitur distribusi dana/barang yang kompleks dapat ditunda sampai tata kelola dan verifikasi tersedia.

## 5.10 Admin & Moderation Workspace

Admin:
- Mengelola akun, role, kategori, sumber data, layer, konten, dan konfigurasi.
- Melihat status koneksi sumber data.
- Melihat histori sinkronisasi dan error.
- Mengaktifkan/nonaktifkan integrasi.
- Melihat audit log.

Moderator:
- Melihat antrean laporan.
- Memfilter laporan berdasarkan kategori, lokasi, waktu, dan status.
- Membandingkan kemungkinan duplikasi.
- Melihat lampiran dengan aman.
- Memverifikasi, menolak, meminta informasi tambahan, atau menandai selesai.
- Menambahkan catatan internal.

## 5.11 Rapid Incident Triage & Emergency Response System for Admin & Intelligence

Untuk merespon bencana dan anomali lapangan secara cepat, tanggap, dan akurat, modul Admin & Intelligence dilengkapi dengan subsistem tanggap darurat berkecepatan tinggi:

### A. Situational Command Stream & Live Triage Board
- Antrean laporan insiden masuk dan sinyal telemetri darurat ditampilkan dalam feed real-time dengan pengurutan otomatis berdasarkan tingkat keparahan (*Critical/High priority first*).
- Indikator visual mencolok untuk anomali sensor ekstrem atau lonjakan laporan masyarakat pada area spesifik (*incident surge indicator*).
- Mode layar penuh (*Situational Room View*) untuk kebutuhan posko komando operasi darurat bencana.

### B. Hotkeys & Quick Actions untuk Triage Cepat
Moderator dan analis intelijen dapat melakukan verifikasi dan penanganan laporan hanya dalam hitungan detik menggunakan tombol pintas keyboard (*keyboard shortcuts*):
- `V`: **Verify** — Menyetujui keabsahan laporan warga dan menandainya sebagai terverifikasi.
- `R`: **Request Info** — Mengirimkan permintaan klarifikasi atau bukti tambahan kepada pelapor.
- `J`: **Reject / Duplicate** — Menandai laporan sebagai tidak valid, spam, atau duplikat dengan alasan terstandarisasi.
- `E`: **Escalate** — Meneruskan insiden mendesak ke meja koordinator darurat / administrator.

### C. Auto-Spatial Clustering & Deduplication
- Memanfaatkan fungsi geospasial PostGIS (`ST_DWithin` dan `ST_ClusterDBSCAN`) untuk mengelompokkan laporan warga yang masuk dalam radius $\le 2$ km dan jendela waktu $\le 2$ jam.
- Mendeteksi lonjakan insiden (*incident surge*) secara otomatis ketika $\ge 3$ laporan serupa terdeteksi di klaster yang sama, memberikan alert prioritas kepada intelijen untuk verifikasi cepat.
- Mencegah kelelahan operator (*operator fatigue*) akibat banjir laporan kembar pada satu titik kejadian bencana.

### D. One-Click Incident Escalation to Active Hazard Event
- Petugas intelijen dan admin dapat mengubah laporan warga terverifikasi (atau klaster laporan) menjadi **Active Hazard Event** di peta publik hanya dengan satu kali klik.
- Sistem secara otomatis mengisi parameter bahaya, koordinat episentrum/dampak, tingkat keparahan awal, dan mengaitkan riwayat laporan warga sebagai bukti pendukung (*evidence trail*).

### E. Rapid CAP Warning Broadcast (<30 Detik Dissemination)
- Menyediakan formulir broadcast peringatan darurat berstandar CAP (*Common Alerting Protocol*) dengan templat siap pakai untuk tipe bahaya utama (misal: "Siaga 1 Banjir Lahar", "Peringatan Dini Cuaca Ekstrem", "Evakuasi Bahaya Longsor").
- Diseminasi peringatan darurat ke seluruh kanal publik (banner darurat web, sirene digital, broadcast notifikasi) dapat dieksekusi dalam waktu **< 30 detik** oleh operator berwenang.

### F. Audit Trail & Provenance Integrity
- Setiap aksi triage, perubahan status laporan, eskalasi insiden, dan penerbitan peringatan darurat dicatat secara permanen dalam `audit_logs` dengan stempel waktu UTC presisi tinggi, ID personil pelaksana, koordinat, dan alasan justifikasi operasional.

### G. Alur Penanganan Insiden 6 Tahap (The 6-Stage Incident Lifecycle)
Platform mengikat siklus hidup insiden dari hulu ke hilir dalam alur tertutup:
1. **Laporan Masuk (Ingestion):** Multi-source stream dari laporan warga (Guest fast-track & User), telemetri sensor lingkungan, dan feed resmi otoritas (BMKG/BPBD).
2. **AI Proactive Intelligence & Spatial Processing:** PostGIS auto-clustering (radius $\le 2$ km, waktu $\le 2$ jam), deteksi surge ($\ge 3$ laporan serupa), ekstraksi entitas, dan scoring keparahan awal.
3. **Triage & Verifikasi (Intelligence Center):** Peninjauan bukti foto, lokasi spasial, dan validasi via Priority Inbox dengan hotkeys `V` (Verify), `R` (Request Info), `J` (Reject), `E` (Escalate).
4. **Penugasan & Koordinasi (Assignment & Notes):** Penugasan penanganan ke petugas lapangan (`assigned_to`) dan ruang koordinasi tertutup via *Internal Notes*.
5. **Tindakan & Publikasi (Escalation & Broadcast):** 1-klik eskalasi laporan ke *Active Hazard Event* publik dan diseminasi peringatan darurat CAP dalam waktu < 30 detik.
6. **Monitoring, Evaluasi & Resolusi (Response Monitoring & Timeline):** Pemantauan SLA waktu tanggap, pencatatan linimasa kronologis (*Incident Timeline*), dan penutupan status laporan menjadi `resolved`.

### H. Delapan Fitur Operasional Kunci Admin & Intelligence Center
1. **Priority Inbox:** Antrean laporan mendesak yang langsung terlihat di puncak daftar.
2. **Live Incident Map:** Peta situasional multi-hazard real-time dengan cluster marker dan layer telemetri.
3. **Quick Actions / Hotkeys:** Eksekusi keputusan triage cepat tanpa dialog bertingkat.
4. **Incident Timeline:** Seluruh riwayat penanganan tercatat secara kronologis.
5. **Internal Notes:** Kolaborasi internal antarpetugas tanpa terlihat oleh publik.
6. **Notification Center:** Alert proaktif untuk insiden kritis baru dan anomali sensor.
7. **Response Monitoring:** Pemantauan laporan yang belum ditangani dan metrik SLA respons.
8. **Tamper-Evident Audit Trail:** Rekaman forensik akuntabilitas siapa melakukan apa dan kapan.

### I. Pembagian Peran Operasional Tegas
- **Administrator:** Tata kelola pengguna & role, registry sumber data & pemantauan sinkronisasi, kurasi konten edukasi mitigasi, konfigurasi sistem global, dan tinjauan kepatuhan audit log.
- **Intelligence:** Pemantauan peta geospasial real-time, evaluasi risk engine, eksekusi triage laporan masyarakat, koordinasi respons kedaruratan, dan penerbitan peringatan darurat publik (CAP).

---

# 6. Persyaratan Real-Time dan Operasional

## 6.1 Definisi real-time yang jujur

Tidak semua sumber data menyediakan streaming. Karena itu, SENTRAVAX harus menggunakan model **near-real-time dan source-aware freshness**:
- Streaming/webhook jika sumber resmi memang menyediakannya.
- Polling terjadwal untuk API yang hanya menyediakan pembaruan berkala.
- Manual refresh untuk sumber yang tidak mendukung sinkronisasi otomatis.
- Data historis/statis diberi label sebagai data historis/statis.

Jangan menjanjikan seluruh data diperbarui setiap detik. UI harus menunjukkan kapan data terakhir diperbarui dan seberapa segar data tersebut.

## 6.2 Pipeline data

Alur wajib:

`Source Adapter → Fetch/Receive → Validate → Normalize → Deduplicate → Persist → Geospatial Enrichment → Risk Evaluation → Event Detection → AI Insight → Notification → Audit`

Setiap sumber memiliki adapter sendiri agar perubahan API tidak merusak seluruh sistem.

## 6.3 Data Source Registry

Setiap sumber data harus memiliki:
- Nama dan organisasi penyedia.
- Kategori data.
- Dokumentasi/endpoint.
- Metode autentikasi (tanpa menyimpan secret di log).
- Interval sinkronisasi.
- Batas rate limit dan kebijakan penggunaan.
- Lisensi/ketentuan penggunaan.
- Field mapping.
- Waktu fetch terakhir.
- Waktu data terakhir terobservasi.
- Status koneksi.
- Status freshness.
- Pesan error terakhir yang telah disanitasi.

## 6.4 Freshness state

Gunakan status:
- `FRESH`
- `DELAYED`
- `STALE`
- `UNAVAILABLE`
- `SIMULATED`
- `UNKNOWN`

Ambang setiap status harus spesifik per sumber dan jenis data, bukan satu nilai global.

## 6.5 Event-driven processing

Event internal yang disarankan:
- `DataSourceUpdated`
- `DataSourceSyncFailed`
- `ObservationCreated`
- `CommunityReportSubmitted`
- `ReportVerificationChanged`
- `RiskThresholdExceeded`
- `OfficialWarningReceived`
- `InsightGenerated`
- `NotificationRequested`
- `InsightExpired`

Proses berat harus berjalan melalui queue/background worker, bukan menahan request HTTP pengguna.

## 6.6 Notifikasi

Saluran:
- In-app notification sebagai prioritas MVP.
- Email/push notification dapat ditambahkan setelah infrastruktur dan izin tersedia.

Aturan:
- Deduplication menggunakan event fingerprint.
- Cooldown per jenis insight dan area.
- Gabungkan event serupa.
- Kirim pembaruan bila tingkat urgensi atau informasi berubah secara material.
- Hormati preferensi pengguna.
- Simpan delivery log dan status.
- Sediakan mute/disable per kategori.
- Jangan mengirim notifikasi untuk setiap data polling.

## 6.7 Target operasional awal

Target berikut adalah sasaran engineering untuk diuji, bukan klaim performa yang sudah tercapai:
- Dashboard API p95: ≤ 1.5 detik pada beban uji MVP yang disepakati.
- Endpoint sederhana p95: ≤ 800 ms pada beban uji yang disepakati.
- Event internal yang memenuhi trigger masuk antrean: ≤ 30 detik setelah data berhasil diproses.
- Notifikasi in-app dibuat: ≤ 60 detik setelah insight dipublikasikan.
- Tidak ada kehilangan event yang sudah tersimpan karena worker restart; gunakan queue persisten dan retry.
- Semua proses sinkronisasi memiliki timeout, retry terbatas, dan pencatatan kegagalan.
- Target uptime MVP dapat ditetapkan setelah hosting dan monitoring dipilih; jangan mengklaim SLA sebelum ada pengukuran.

---

# 7. Arsitektur Teknis

## 7.1 Stack rekomendasi

- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS.
- Backend: Laravel REST API.
- Authentication: Laravel Sanctum.
- Database: PostgreSQL + PostGIS.
- Queue/cache: Redis jika tersedia; gunakan driver yang sesuai untuk development dan production.
- Map: MapLibre GL JS atau Leaflet. Pilih satu setelah evaluasi kebutuhan layer dan lisensi.
- Realtime transport: Laravel Broadcasting/WebSocket atau Server-Sent Events sesuai kebutuhan hosting.
- File storage: object storage atau storage lokal terproteksi untuk development.
- AI: LLM API melalui backend service.
- Testing: PHPUnit/Pest untuk backend; Vitest/React Testing Library untuk frontend; Playwright untuk alur end-to-end jika waktu memungkinkan.

Jangan menambahkan teknologi hanya agar terlihat canggih. Gunakan modular monolith Laravel untuk MVP kecuali audit repository menunjukkan alasan kuat untuk pendekatan lain.

## 7.2 Batas domain

Pisahkan tanggung jawab:
- `DataIngestion`: konektor dan sinkronisasi.
- `Geospatial`: query spasial dan fitur peta.
- `Hazard`: event dan observasi bahaya.
- `Risk`: aturan dan penilaian.
- `AI`: konteks, prompt, insight, dan penjelasan.
- `Community`: laporan dan moderasi.
- `Notification`: preferensi dan pengiriman.
- `Preparedness`: panduan dan checklist.
- `Administration`: role, konfigurasi, audit.

AI Core boleh mengorkestrasi layanan ini, tetapi jangan membuat satu kelas AI raksasa yang menangani seluruh business logic.

## 7.3 Alur sistem

`External/Internal Sources → Ingestion → Validation & Normalization → PostgreSQL/PostGIS → Risk Engine → Event Bus/Queue → AI Insight Service → Human Review (when required) → Notification Service → Web Client`

Peta membaca data dari API backend yang sudah menerapkan filter, otorisasi, dan batas akses.

## 7.4 Integrasi data potensial

Evaluasi, jangan langsung mengasumsikan endpoint tersedia:
- BMKG: informasi cuaca/peringatan/gempa sesuai layanan yang dapat diakses.
- BNPB: informasi kejadian bencana sesuai portal/API yang tersedia.
- NASA FIRMS: data anomali termal/hotspot dengan ketentuan aksesnya.
- InaRISK: referensi risiko jika akses dan ketentuan memungkinkan.
- OpenStreetMap: data geografi dan fasilitas dengan memperhatikan kebijakan penggunaan.
- Dataset elevasi/DEM: topografi dan elevasi dengan atribusi serta lisensi sesuai.
- Community reports: data internal platform.

Sebelum integrasi, Agent harus memeriksa dokumentasi aktual, autentikasi, rate limit, lisensi, format, cakupan wilayah, frekuensi pembaruan, dan stabilitas. Jika tidak dapat diakses, dokumentasikan alasan dan buat adapter mock yang jelas diberi label `SIMULATED`, bukan berpura-pura terhubung.

---

# 8. Database — Entitas Konseptual

Agent harus membuat ERD sebelum migration final. Tentukan tipe kolom, nullability, foreign key, unique constraint, index, retention, dan relasi.

Entitas minimum:
- `users`
- `user_profiles`
- `roles`
- `permissions` atau role-permission mapping
- `user_locations`
- `notification_preferences`
- `hazard_types`
- `hazard_events`
- `environmental_observations`
- `data_sources`
- `data_source_sync_runs`
- `data_ingestion_logs`
- `regions`
- `geographic_features`
- `map_layers`
- `risk_rules`
- `risk_assessments`
- `ai_insights`
- `ai_analysis_logs`
- `ai_conversations`
- `ai_messages`
- `community_reports`
- `report_attachments`
- `report_verifications`
- `moderation_actions`
- `official_warnings`
- `educational_contents`
- `preparedness_checklists`
- `user_notifications`
- `notification_delivery_logs`
- `recovery_projects`
- `recovery_activities`
- `audit_logs`

Ketentuan:
- Gunakan PostGIS geometry/geography untuk data spasial yang memang memerlukan query geospasial.
- Tambahkan spatial index.
- Tentukan SRID secara konsisten dan dokumentasikan konversi.
- Simpan timestamp dalam UTC; tampilkan ke zona waktu pengguna.
- Simpan `observed_at`, `fetched_at`, dan `created_at` secara terpisah.
- Hindari menyimpan koordinat presisi laporan warga di endpoint publik.
- Gunakan soft delete hanya jika sesuai kebutuhan audit dan kebijakan retensi.
- Jangan membuat tabel atau kolom tanpa tujuan penggunaan yang jelas.

---

# 9. API Contract Awal

Semua endpoint di bawah adalah rancangan. Agent harus menyesuaikan prefix, format response, pagination, dan standar error secara konsisten.

## Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `PATCH /api/v1/me/profile`
- `PUT /api/v1/me/location`
- `PUT /api/v1/me/notification-preferences`

## Dashboard
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/dashboard/insights`
- `GET /api/v1/dashboard/official-warnings`

## Map
- `GET /api/v1/map/layers`
- `GET /api/v1/map/features`
- `GET /api/v1/map/risk-zones`
- `GET /api/v1/map/locations/search`

Parameter spasial perlu mendukung bounding box dan filter waktu/kategori. Validasi batas luas query agar tidak membebani database.

## AI
- `POST /api/v1/ai/chat`
- `GET /api/v1/ai/insights`
- `GET /api/v1/ai/insights/{id}`
- `POST /api/v1/ai/insights/{id}/feedback`

## Community
- `GET /api/v1/reports`
- `POST /api/v1/reports`
- `GET /api/v1/reports/{id}`
- `GET /api/v1/me/reports`

## Moderation
- `GET /api/v1/moderation/reports`
- `PATCH /api/v1/moderation/reports/{id}/status`
- `POST /api/v1/moderation/reports/{id}/verification`

## Preparedness & Notifications
- `GET /api/v1/preparedness/guides`
- `GET /api/v1/preparedness/checklists`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`

Standar response:
- Format JSON konsisten.
- Error memiliki kode, pesan aman, dan detail validasi yang sesuai.
- Pagination untuk koleksi.
- Filter dan sort di-allowlist.
- Jangan mengembalikan stack trace atau secret ke client.
- Dokumentasikan API menggunakan OpenAPI jika memungkinkan.

---

# 10. UI/UX Requirements

## 10.1 Arah visual & Visual-Rich Design Standards

- **Karakter Visual Utama:** Premium, modern, intelligent, data-driven, dan berwibawa (*civic-tech credibility*).
- **Public Area Experience:** Light theme yang bersih, ramah, terbuka, dan kaya elemen visual (ilustrasi 3D isometrik lanskap multi-hazard, kartu telemetri cuaca dark teal elegan, infografik mitigasi, dan badge risiko yang mudah dipahami seluruh kalangan).
- **Admin & Intelligence Workspace:** Dark / charcoal theme yang tegas, fokus, dan dioptimasi untuk monitoring data intensif dan respon cepat.
- **Palet Warna Status Terstandarisasi:**
  - *Deep Navy / Charcoal*: Latar belakang workspace intelijen dan elemen struktural utama.
  - *Electric Blue / Cyan*: Aksen interaktif utama dan tautan navigasi.
  - *Emerald Green*: Status aman / normal (*Low Risk*).
  - *Amber / Amber-Gold*: Peringatan waspada (*Moderate / Advisory*).
  - *Crimson Red / Vermilion*: Kondisi darurat / bahaya kritis (*Severe / Extreme Hazard*).
  - *Slate Gray*: Status tidak diketahui / data belum tersedia.
- **Tipografi Universal:** Inter atau Geist dengan hierarki kontras tinggi, font size minimal 16px untuk keterbacaan nyaman lintas usia (khususnya warga lanjut usia).
- **Dinamika Tata Letak (Anti-Monoton):** Mengombinasikan kartu telemetri cuaca dengan ramalan per jam, tab metrik mingguan (*Water level, Temperature, Precipitation*), modular card grids, dan grafis interaktif.
- **Ilustrasi & Dekorasi Grafis Bermakna:** Setiap elemen grafis dan ilustrasi harus memiliki nilai fungsional dalam menjelaskan risiko, bukan sekadar hiasan kosong.

## 10.2 Navigasi workspace

- Overview
- Earth Intelligence
- AI Intelligence
- Community Network
- Preparedness
- Impact & Recovery

Halaman pendukung:
- Login/Register
- Profile
- Notification Center
- Settings
- Admin Dashboard
- Moderator Dashboard

## 10.3 Responsive, Ergonomi Mobile & Aksesibilitas Universal

- **Desktop Experience:** Peta dan panel informasi intelijen dapat tampil berdampingan (*split-screen layout*), dilengkapi pintasan keyboard untuk kebutuhan operasional cepat.
- **Tablet Experience:** Panel informasi fleksibel sebagai drawer geser atau modal terfokus tanpa menutupi seluruh visual peta.
- **Mobile Experience & Thumb-Zone Ergonomics:**
  - Navigasi ringkas dengan bilah bawah (*bottom navigation bar*) yang mudah dijangkau ibu jari satu tangan (Home, Incident Report, Map, Warning Center).
  - Target sentuh (*touch target*) minimal 44×44 px untuk seluruh tombol dan kontrol interaktif.
  - Kartu telemetri dan ramalan cuaca mendukung gesture geser horizontal (*swipeable horizontal carousel*) yang halus.
- **Universal Accessibility (WCAG 2.1 Level AA):**
  - Rasio kontras teks minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar/elemen UI penting.
  - Status risiko tidak boleh hanya dibedakan oleh warna; wajib disertai ikon dan label teks eksplisit.
  - Semantic HTML penuh, dukungan navigasi keyboard komprehensif, ARIA attributes, dan alt-text deskriptif untuk seluruh gambar dan grafik.
  - Menghormati pengaturan sistem pengguna untuk `prefers-reduced-motion`.

## 10.4 Semua kontrol harus berfungsi

Tidak boleh ada tombol dekoratif tanpa aksi. Untuk fitur yang belum tersedia, tampilkan status “Belum tersedia” dan jangan membuatnya seolah berfungsi.

---

# 11. Keamanan, Privasi, dan Tata Kelola

Wajib:
- Server-side authorization pada setiap endpoint privat.
- Validasi input dan output encoding.
- Rate limiting untuk autentikasi, AI, laporan, dan endpoint mahal.
- Perlindungan SQL injection melalui query parameterized/ORM.
- Proteksi XSS dan CSRF sesuai model autentikasi.
- Validasi MIME, ukuran, dan ekstensi file upload; nama file acak; penyimpanan non-public.
- Secret hanya di environment/backend secret manager.
- Audit log untuk perubahan role, verifikasi, konfigurasi sumber, dan tindakan admin.
- Consent sebelum mengakses lokasi perangkat.
- Opsi lokasi manual.
- Minimisasi data pribadi pada prompt AI.
- Kebijakan retensi dan penghapusan data.
- Backup database dan uji pemulihan.
- Sanitasi log agar tidak menyimpan token, password, atau data sensitif.
- Kebijakan moderasi dan pelaporan penyalahgunaan.

Untuk insiden atau kondisi darurat, tampilkan instruksi untuk menghubungi layanan darurat/otoritas resmi yang relevan. Jangan menjanjikan bahwa SENTRAVAX memantau atau mengirim bantuan darurat kecuali integrasi operasionalnya benar-benar ada.

---

# 12. Reliability, Observability, dan Pemulihan

Implementasikan:
- Health check backend, database, queue, dan integrasi utama.
- Log terstruktur dengan correlation/request ID.
- Monitoring error dan latency.
- Status sinkronisasi per data source.
- Timeout untuk panggilan eksternal.
- Retry dengan exponential backoff dan batas percobaan.
- Circuit breaker atau mekanisme disable sementara untuk sumber yang gagal berulang.
- Idempotency untuk ingestion dan event processing.
- Queue persisten.
- Dead-letter/failure queue atau mekanisme pencatatan job gagal.
- Backup terjadwal dan prosedur restore.
- Graceful fallback ketika AI provider gagal: dashboard, peta, dan data dasar tetap dapat digunakan.

Sistem tidak boleh bergantung pada LLM agar seluruh aplikasi dapat dibuka. Jika AI down, fitur non-AI tetap berjalan.

---

# 13. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Query spasial dibatasi, diindeks, dan dipaginasi; peta tidak memuat semua data sekaligus |
| Reliability | Timeout, retry terbatas, queue persisten, health checks |
| Security | Auth, authorization, validation, rate limit, audit log, secret management |
| Privacy | Consent lokasi, minimisasi data, generalisasi koordinat laporan publik |
| Scalability | Modular domain, queue untuk pekerjaan berat, index spasial |
| Maintainability | Service layer, reusable components, migration terkontrol, dokumentasi |
| Accessibility | Keyboard, label, kontras, reduced motion, status non-color-only |
| Data integrity | Provenance, timestamp, freshness, deduplication, validasi |
| Usability | Bahasa yang mudah dipahami seluruh kalangan, istilah teknis dijelaskan, rekomendasi kontekstual |
| Visual Performance | Aset SVG & WebP terkompresi efisien, LCP < 1.5s, 60fps scrolling tanpa frame drops |
| Universal Accessibility | Kepatuhan penuh WCAG 2.1 Level AA, kontras minimal 4.5:1, touch targets ≥ 44×44 px, modular font ≥ 16px body |
| Rapid Emergency SLA | Diseminasi broadcast CAP Warning < 30 detik; triage time target < 60 detik per laporan prioritas tinggi |
| Emergency Zero-Barrier | Fitur kesiapsiagaan, mitigasi, evakuasi & lapor darurat dapat diakses 100% tanpa hambatan login wall |

---

# 14. Scope dan Prioritas MVP

## P0 — Fondasi
- Audit repository.
- Setup environment dan dokumentasi.
- Design system dan routing.
- Database dan ERD.
- Authentication dan role.
- API foundation.
- Logging dan error handling.

## P1 — Produk inti
- Dashboard overview.
- Peta interaktif.
- Registry sumber data.
- Minimal dua atau tiga integrasi/data layer yang benar-benar dapat diakses.
- Data freshness dan provenance.
- Community report submission.
- Moderator verification workflow.

## P2 — Intelligence
- Risk Engine rules-based.
- AI contextual assistant.
- Proactive insight dari event/rule.
- Insight detail dengan sumber dan alasan.
- In-app notifications dengan deduplication dan cooldown.

## P3 — Kesiapsiagaan
- Official warning feed jika sumber tersedia.
- Panduan dan checklist.
- Riwayat notifikasi.
- User preferences.
- Admin data source monitoring.

## P4 — Stabilization
- Automated tests.
- Security review.
- Performance review.
- Responsive polish.
- Deployment.
- README, API documentation, demo video, dan submission checklist.

Fitur lanjutan seperti volunteer matching, bantuan kompleks, recovery case management, dan simulasi lanjutan tidak boleh menghambat MVP inti.

---

# 15. Acceptance Criteria / Definition of Done

MVP dapat dinyatakan memenuhi baseline jika:

1. Pengguna dapat membuat akun, login, dan mengelola profil dasar.
2. Dashboard menampilkan lokasi/konteks dan waktu pembaruan.
3. Peta dapat di-zoom, digeser, dan menampilkan beberapa kategori layer.
4. Pengguna dapat mengaktifkan dan menonaktifkan layer.
5. Setiap data menampilkan sumber, waktu, dan freshness state.
6. Sumber gagal tidak membuat aplikasi crash.
7. Data simulasi diberi label jelas.
8. Risk Engine dapat mengevaluasi aturan yang terdokumentasi.
9. Sistem menghasilkan insight dari event/rule tanpa harus menunggu pertanyaan pengguna.
10. Insight menampilkan alasan, sumber, waktu, rekomendasi, dan batasan.
11. AI assistant menggunakan konteks internal yang relevan dan tidak mengarang sumber.
12. Pengguna dapat mengirim laporan dengan kategori, deskripsi, dan lokasi.
13. Moderator dapat memeriksa dan mengubah status laporan.
14. Pengguna dapat melihat status laporannya.
15. Notifikasi in-app tidak mengirim duplikasi berulang untuk event yang sama.
16. AI tidak dapat memverifikasi laporan sendirian.
17. Endpoint privat memiliki otorisasi backend.
18. UI utama dapat digunakan pada desktop dan mobile.
19. Test penting berjalan dan build tidak memiliki error yang diketahui.
20. README menjelaskan setup, environment variables, integrasi, keterbatasan, dan akun demo jika diperlukan.

---

# 16. Testing Strategy

## Unit tests
- Risk rule evaluation.
- Freshness classification.
- Event fingerprint/deduplication.
- Notification cooldown.
- Permission policies.
- Data normalization.

## Integration tests
- Data source adapter.
- Database/PostGIS queries.
- Queue dispatch dan retry.
- AI service failure/fallback.
- Report lifecycle.
- Moderator authorization.

## End-to-end tests
- Register/login.
- Melihat dashboard.
- Mengubah layer peta.
- Membuka detail kejadian.
- Mengirim laporan.
- Moderator memverifikasi laporan.
- Pengguna melihat perubahan status.
- Insight muncul setelah event test diproses.

## Failure tests
- API eksternal timeout.
- Data tidak valid.
- Database sementara tidak tersedia.
- Queue worker restart.
- AI provider gagal.
- File upload tidak valid.
- Pengguna mencoba akses endpoint tanpa izin.

---

# 17. Deployment dan Environment

Sediakan environment terpisah:
- Local development.
- Staging/demo.
- Production jika platform dilanjutkan setelah kompetisi.

Wajib:
- `.env.example` tanpa secret.
- Database migration dan seeding terkontrol.
- Queue worker dan scheduler aktif di environment yang memerlukannya.
- HTTPS pada deployment publik.
- CORS dibatasi ke domain yang diperlukan.
- Backup dan prosedur restore.
- Monitoring log dan error.
- Dokumentasi proses deploy dan rollback.

Demo publik harus menjelaskan apakah data live, delayed, historical, atau simulated. Jangan menaruh API key di bundle frontend atau repository.

---

# 18. Instruksi Kerja untuk AI Agent Antigravity

## 18.1 Tahap pertama — Audit, jangan langsung coding

Sebelum mengubah file:
1. Audit seluruh repository dan struktur folder.
2. Identifikasi framework, versi runtime, dependencies, dan fitur yang sudah berfungsi.
3. Periksa konfigurasi environment tanpa menampilkan secret.
4. Jalankan build/test yang sudah ada.
5. Identifikasi bagian yang dapat dipertahankan.
6. Catat risiko perubahan dan dependency yang hilang.
7. Periksa dokumentasi dan akses aktual setiap API eksternal yang akan digunakan.
8. Jangan menghapus atau menimpa implementasi yang ada tanpa menjelaskan dampaknya.

Hasil tahap audit harus berupa:
- `PROJECT_AUDIT.md`
- `IMPLEMENTATION_PLAN.md`
- `SYSTEM_ARCHITECTURE.md`
- `ERD.md`
- `DATA_SOURCE_ASSESSMENT.md`
- `API_SPECIFICATION.md`

Jangan mulai implementasi penuh sebelum hasil audit dan rencana tersedia.

## 18.2 Tahap kedua — Rencana dan fondasi

- Buat struktur domain yang jelas.
- Definisikan kontrak API.
- Rancang database dan migration.
- Buat design tokens dan komponen dasar.
- Siapkan autentikasi dan otorisasi.
- Siapkan logging dan error handling.
- Buat seed data demo yang secara eksplisit diberi label simulasi.

## 18.3 Tahap ketiga — Implementasi bertahap

Implementasikan per fase P0 sampai P4. Setelah setiap fase:
- Jalankan test.
- Jalankan build.
- Periksa browser console dan network errors.
- Periksa database migration.
- Uji responsive layout.
- Uji alur pengguna.
- Perbarui dokumentasi.
- Laporkan fitur yang selesai, belum selesai, dan masih disimulasikan.

## 18.4 Aturan implementasi

- Ikuti stack yang sudah ada jika tidak ada alasan kuat untuk mengubahnya.
- Jangan melakukan rewrite total hanya demi preferensi pribadi.
- Jangan menambahkan library tanpa kebutuhan jelas.
- Pisahkan UI, business logic, dan data access.
- Validasi dan otorisasi backend adalah sumber keputusan.
- Semua tombol/interaksi harus berfungsi.
- Jangan menggunakan data palsu tanpa label.
- Jangan mengarang endpoint atau response API eksternal.
- Jangan membiarkan LLM menentukan skor risiko numerik.
- Jangan mengizinkan AI mengesahkan laporan.
- Buat loading, empty, error, stale, unavailable, dan simulated states.
- Jangan menampilkan data lama seolah-olah terbaru.
- Pertahankan aksesibilitas dan responsivitas.

## 18.5 Laporan setiap fase

Agent wajib melaporkan:
1. File yang dibuat/diubah.
2. Fitur yang selesai.
3. Test dan build yang dijalankan beserta hasilnya.
4. Integrasi eksternal yang benar-benar aktif.
5. Bagian yang masih mock/simulated.
6. Kendala dan keputusan teknis.
7. Risiko yang belum ditangani.
8. Langkah berikutnya.

---

# 19. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| API sumber data tidak tersedia | Layer kosong/tidak aktual | Validasi akses lebih awal; adapter; fallback berlabel |
| Data memiliki jeda pembaruan | Pengguna mengira data live | Freshness state dan timestamp yang jelas |
| AI menghasilkan klaim salah | Keputusan pengguna keliru | Grounding, sumber, guardrails, human review |
| Laporan palsu/duplikat | Peta menyesatkan | Moderasi, duplicate detection, rate limit |
| Koordinat warga terekspos | Risiko privasi | Generalisasi lokasi publik dan pembatasan akses |
| Beban query peta tinggi | Aplikasi lambat | Spatial index, bounding box, clustering, cache |
| Queue/worker berhenti | Insight/notifikasi tertunda | Monitoring, retry, failure queue |
| Ruang lingkup terlalu besar | MVP tidak selesai | Prioritas P0–P4 dan pembatasan fitur |
| AI provider gagal | Assistant tidak tersedia | Graceful fallback; fitur non-AI tetap berjalan |

---

# 20. Metrik Keberhasilan

Ukur:
- Persentase keberhasilan sinkronisasi per sumber.
- Umur data terakhir per sumber.
- Latency ingestion dan insight generation.
- Jumlah insight yang diproses dan dipublikasikan.
- Rasio duplikasi notifikasi.
- Jumlah laporan yang diproses dan waktu moderasi.
- Persentase laporan yang memiliki tindak lanjut.
- Keberhasilan pengguna menemukan informasi lokasi.
- API error rate dan p95 latency.
- Keberhasilan alur utama berdasarkan pengujian.

Jangan mengklaim akurasi prediksi atau penurunan korban tanpa dataset, metodologi evaluasi, dan bukti yang sah.

---

# 21. Rencana Implementasi yang Disarankan

1. **Discovery & Audit:** audit repo, konfirmasi stack, validasi sumber data, dan batas MVP.
2. **Architecture:** ERD, API contract, domain boundaries, data pipeline, threat model.
3. **Foundation:** auth, roles, database, design system, dashboard shell.
4. **Geospatial:** peta, layer, data source registry, provenance, freshness.
5. **Community:** laporan, upload aman, moderasi, audit log.
6. **Risk & AI:** rule engine, event processing, contextual AI, proactive insights.
7. **Notifications & Preparedness:** in-app notifications, preferences, guides, checklists.
8. **Stabilization:** tests, security, performance, deployment, documentation, demo.

Urutan dapat disesuaikan berdasarkan audit repository, tetapi jangan membangun UI yang mengklaim kemampuan backend yang belum tersedia.

---

# 22. Definisi Akhir Produk

SENTRAVAX harus dibangun sebagai **satu platform intelijen dan ketahanan masyarakat yang saling terhubung**, bukan kumpulan halaman atau mini-aplikasi yang berdiri sendiri.

Keberhasilan bukan diukur dari banyaknya menu, animasi, atau seberapa sering kata “AI” digunakan. Keberhasilan diukur dari kemampuan sistem untuk:

- Mengumpulkan data yang dapat dipertanggungjawabkan.
- Memahami konteks lokasi dan waktu.
- Menilai indikator risiko secara transparan.
- Menjelaskan hasil analisis dengan sumber dan keterbatasannya.
- Menghasilkan insight secara proaktif.
- Mengirimkan informasi yang relevan tanpa spam.
- Menghubungkan masyarakat dengan proses pelaporan dan tindakan yang aman.
- Tetap stabil ketika layanan eksternal atau AI sedang gagal.

**Core workflow:**

`Data → Validation → Geospatial Context → Risk Analysis → Event Detection → AI Insight → Human Review (when needed) → Notification → Community Action`

**Instruksi final untuk Agent:** Prioritaskan sistem yang benar-benar berjalan, dapat diuji, aman, dan jujur terhadap kondisi data. Jangan mengorbankan reliabilitas dan keselamatan demi tampilan demo yang terlihat canggih.
