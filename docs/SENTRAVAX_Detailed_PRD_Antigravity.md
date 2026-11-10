444444444444444444444444# SENTRAVAX — Product Requirements Document (PRD)
## AI-Powered Geospatial Intelligence & Community Resilience Platform

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

| Fitur | Pengunjung | Pengguna | Relawan | Moderator | Admin |
|---|---:|---:|---:|---:|---:|
| Melihat landing page | Ya | Ya | Ya | Ya | Ya |
| Melihat peta publik | Ya | Ya | Ya | Ya | Ya |
| Melihat insight publik | Terbatas | Ya | Ya | Ya | Ya |
| Mengirim laporan | Tidak | Ya | Ya | Ya | Ya |
| Melihat laporan pribadi | Tidak | Ya | Ya | Ya | Ya |
| Mengelola kontribusi relawan | Tidak | Tidak | Ya | Ya | Ya |
| Memverifikasi laporan | Tidak | Tidak | Tidak | Ya | Ya |
| Mengelola sumber data | Tidak | Tidak | Tidak | Tidak | Ya |
| Mengelola role dan konfigurasi | Tidak | Tidak | Tidak | Tidak | Ya |
| Melihat audit log | Tidak | Tidak | Tidak | Terbatas | Ya |

Semua izin wajib ditegakkan di backend. Menyembunyikan tombol di frontend bukan mekanisme otorisasi.

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

## 5.1 Public Landing Page

**Tujuan:** menjelaskan nilai produk dan mengarahkan pengguna ke workspace.

Konten:
- Hero dengan proposisi nilai yang jelas.
- Preview peta intelijen (data demo harus diberi label).
- Penjelasan alur Data → Analysis → Insight → Action.
- Cakupan multi-hazard.
- Fitur inti dan manfaat untuk masyarakat.
- Transparansi sumber data dan batasan sistem.
- CTA untuk membuka peta, membuat akun, atau mempelajari kesiapsiagaan.

Kriteria:
- Responsif di desktop, tablet, dan ponsel.
- Tidak menampilkan statistik dampak yang tidak memiliki sumber.
- Semua tombol navigasi memiliki tujuan yang berfungsi.

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

Alur laporan:
1. Pengguna memilih kategori.
2. Pengguna menulis deskripsi.
3. Pengguna memilih lokasi di peta atau memasukkan lokasi manual.
4. Pengguna dapat melampirkan foto jika diizinkan.
5. Sistem memvalidasi input dan file.
6. Sistem memberi status `Submitted`.
7. AI membantu klasifikasi dan deteksi duplikasi.
8. Moderator memeriksa laporan.
9. Moderator mengubah status dan menambahkan catatan internal.
10. Pengguna menerima pembaruan status.

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

## 5.8 Early Warning & Preparedness

Fitur:
- Daftar peringatan resmi.
- Daftar SENTRAVAX Insight yang terpisah secara visual.
- Filter area, kategori, status, dan periode.
- Panduan sebelum, saat, dan setelah kejadian.
- Checklist kesiapsiagaan.
- Riwayat notifikasi.
- Preferensi notifikasi.

Semua konten keselamatan harus berasal dari sumber tepercaya dan ditinjau. Jangan menghasilkan instruksi evakuasi spesifik tanpa konteks dan otoritas resmi.

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

## 10.1 Arah visual

- Premium, modern, intelligent, data-driven.
- Dasar warna deep navy/charcoal.
- Cyan/electric blue sebagai aksen utama.
- Teal sebagai aksen sekunder.
- Amber untuk peringatan.
- Red untuk kondisi kritis.
- Gray untuk unknown/unavailable.
- Tipografi Inter atau Geist.
- Animasi halus dan fungsional.
- Peta dan AI insight menjadi fokus visual utama.
- Hindari terlalu banyak gradient, kartu seragam, glassmorphism berlebihan, dan dekorasi yang mengganggu keterbacaan.

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

## 10.3 Responsive dan aksesibilitas

- Desktop: peta dan panel informasi dapat tampil berdampingan.
- Tablet: panel dapat menjadi drawer.
- Mobile: navigasi ringkas, kontrol peta mudah disentuh, konten tidak overflow.
- Gunakan semantic HTML, label input, keyboard navigation, kontras cukup, alt text, dan status yang tidak hanya dibedakan dengan warna.
- Hormati `prefers-reduced-motion`.

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
| Usability | Bahasa yang mudah dipahami, istilah teknis dijelaskan, rekomendasi kontekstual |

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
