# SENTRAVAX — MASTER PROJECT EXECUTION PLAN
## Roadmap dari Persiapan hingga Pengumpulan TRASPAC Competition 2027

**Nama proyek:** SENTRAVAX  
**Produk:** AI-Powered Geospatial Intelligence & Community Resilience Platform  
**Periode pengerjaan:** 8 November – 30 Desember 2026  
**Deadline pengumpulan:** 30 Desember 2026  
**Target:** Web/Mobile Apps — TRASPAC Competition 2027  
**Status dokumen:** Rencana kerja utama (execution roadmap)

---

# 1. Tujuan dan Prinsip Pengerjaan

Dokumen ini menjadi rencana kerja utama untuk menyelesaikan SENTRAVAX dari tahap persiapan, desain, pengembangan, integrasi data, pengujian, deployment, dokumentasi, sampai pengumpulan lomba.

Target akhirnya bukan sekadar website yang terlihat bagus. SENTRAVAX harus memiliki alur inti yang benar-benar berjalan:

`Data Source → Data Validation → Geospatial Context → Risk Analysis → AI Insight → Notification → User Action`

Prinsip yang wajib dijaga:

1. **Fungsional lebih penting daripada banyak fitur.** Selesaikan alur inti secara end-to-end sebelum menambahkan fitur tambahan.
2. **Real-time harus jujur.** Tampilkan waktu pembaruan dan status freshness. Jika sumber hanya menyediakan pembaruan berkala, sebut near-real-time atau periodic update, bukan live streaming.
3. **Multi-hazard sejak awal, kedalaman implementasi bertahap.** Arsitektur mendukung banyak bahaya, tetapi MVP hanya perlu beberapa kategori dengan sumber dan analisis yang benar-benar dapat dipertanggungjawabkan.
4. **AI bukan pengganti Risk Engine.** Risk Engine menghasilkan penilaian terukur; AI menjelaskan konteks, menghubungkan informasi, dan menyusun rekomendasi.
5. **Jangan memalsukan data.** Data demo harus diberi label `SIMULATED` di UI dan dokumentasi.
6. **Jangan mengorbankan keamanan.** Auth, role, validasi, proteksi upload, dan pembatasan akses harus diuji.
7. **Sisakan waktu untuk pengujian dan pengumpulan.** Jangan coding sampai menit terakhir tanggal 30 Desember.

## Hasil akhir yang harus tersedia pada 30 Desember

- Aplikasi SENTRAVAX dapat dijalankan dari instruksi README.
- Demo publik dapat diakses atau tersedia prosedur demo lokal yang telah diuji.
- Repository GitHub berisi source code yang rapi dan dapat diakses juri.
- Minimal satu atau lebih integrasi eksternal benar-benar aktif dan telah diuji; integrasi lain yang belum tersedia diberi label yang jujur.
- Peta multi-hazard menampilkan data, sumber, waktu pembaruan, dan status freshness.
- Risk Engine menghasilkan analisis berbasis aturan yang terdokumentasi.
- AI dapat menjelaskan konteks dan menghasilkan proactive insight dari trigger yang benar-benar berjalan.
- Pengguna dapat membuat laporan dan moderator dapat memverifikasinya.
- Alur utama lulus pengujian.
- Pitch deck, video demo, dan dokumentasi teknis siap dikumpulkan.

---

# 2. Cara Menggunakan Tiga Dokumen Utama

Tempatkan tiga dokumen berikut di folder `docs/` pada repository:

```text
docs/
├── PRD.md
├── DESIGN.md
└── GUIDEBOOK.md
```

Jika nama file yang sekarang berbeda, tidak perlu memaksakan nama di atas; yang penting perannya jelas.

## 2.1 PRD — sumber kebenaran kebutuhan produk

Gunakan PRD untuk menentukan:
- masalah dan tujuan SENTRAVAX;
- pengguna dan hak akses;
- modul dan fitur;
- alur bisnis;
- aturan AI dan Risk Engine;
- kebutuhan data, API, dan database;
- acceptance criteria;
- prioritas MVP.

Jangan menambah fitur besar yang tidak ada di PRD tanpa menilai manfaat, waktu, dan risiko scope.

## 2.2 DESIGN — sumber kebenaran pengalaman visual

Gunakan dokumen Design untuk menentukan:
- visual identity;
- warna, typography, spacing, radius, dan elevation;
- komponen UI;
- layout tiap halaman;
- responsive behavior;
- interaksi, state, dan motion;
- accessibility.

Jika implementasi teknis memerlukan penyesuaian desain, catat alasannya. Jangan mengubah arah visual secara acak di setiap halaman.

## 2.3 GUIDE BOOK — sumber kebenaran kompetisi

Gunakan Guide Book untuk memastikan:
- kategori dan ketentuan lomba;
- orisinalitas karya;
- format dan berkas pengumpulan;
- timeline;
- aspek penilaian;
- kewajiban administrasi peserta.

Jika ada konflik antara dokumen, gunakan urutan keputusan:
1. Ketentuan resmi panitia/Guide Book untuk aturan lomba.
2. PRD untuk ruang lingkup dan perilaku produk.
3. Design document untuk tampilan dan interaksi.
4. Keputusan implementasi teknis yang didokumentasikan.

**Catatan:** file Design belum berhasil ditemukan pada berkas yang tersedia saat penyusunan roadmap ini. Karena itu, rencana ini memakai struktur dan arah desain yang tercantum di PRD. Sebelum fase UI dimulai, pastikan Agent membaca file Design milikmu dan membuat daftar konsistensi/konflik terhadap PRD.

---

# 3. Strategi Scope: Apa yang Wajib dan Apa yang Ditunda

## 3.1 P0 — wajib selesai untuk MVP kompetisi

| Area | Target minimum yang dapat didemonstrasikan |
|---|---|
| Product foundation | Repository rapi, setup terdokumentasi, arsitektur dan ERD |
| Authentication | Register/login, logout, profil dasar, role |
| Dashboard | Ringkasan lokasi, insight, peringatan, aktivitas, freshness |
| Earth Intelligence | Peta interaktif dan beberapa layer multi-hazard |
| Data integration | Minimal satu integrasi eksternal nyata; targetkan 2–3 sumber/layer yang feasible |
| Data quality | Source, observed time, fetched time, freshness, status error |
| Risk Engine | Aturan terukur, hasil dapat dijelaskan, dan dapat diuji |
| AI Intelligence | Contextual assistant dan proactive insight dari event/rule nyata |
| Community | Submit laporan, status, moderasi/verifikasi |
| Notifications | In-app notification dengan deduplication/cooldown |
| Admin/moderator | Alur dasar pengelolaan sumber dan verifikasi laporan |
| Quality | Responsive, security baseline, tests, build bersih |
| Submission | GitHub, demo, video, pitch deck, README |

## 3.2 P1 — dikerjakan jika P0 stabil

- Panduan kesiapsiagaan yang lebih lengkap.
- Checklist per kategori bahaya.
- Filter dan preferensi notifikasi lebih detail.
- Analisis spasial tambahan.
- Riwayat insight dan laporan yang lebih kaya.
- Admin monitoring lebih lengkap.

## 3.3 P2 — jangan dikerjakan sebelum MVP inti aman

- Volunteer matching kompleks.
- Manajemen distribusi bantuan/dana.
- Recovery case management skala penuh.
- Prediksi machine learning yang belum memiliki dataset dan evaluasi.
- Mobile app native terpisah.
- Fitur sosial/komunitas yang tidak mendukung alur utama.
- Banyak integrasi eksternal yang belum jelas akses dan lisensinya.

**Aturan scope:** apabila sebuah fitur tidak memperkuat alur `Data → Risk → Insight → Action`, tidak wajib untuk demo utama, dan berisiko menghabiskan waktu, pindahkan ke backlog.

---

# 4. Jadwal Utama 8 November – 30 Desember 2026

## Ringkasan milestone

| Periode | Milestone | Output wajib |
|---|---|---|
| 8–10 Nov | M0 — Project alignment & audit | Scope terkunci, audit repo, daftar risiko |
| 11–15 Nov | M1 — Architecture & technical foundation plan | Arsitektur, ERD, API contract, data-source matrix |
| 16–22 Nov | M2 — Application foundation | Frontend/backend berjalan, auth, database, design system |
| 23–29 Nov | M3 — Earth Intelligence | Peta, layer, detail data, freshness |
| 30 Nov–6 Des | M4 — Data pipeline & Risk Engine | Ingestion terjadwal, normalisasi, rules-based assessment |
| 7–13 Des | M5 — AI Proactive Intelligence | AI context, event trigger, insight, in-app notification |
| 14–18 Des | M6 — Community & moderation | Laporan warga, status, verifikasi moderator |
| 19–22 Des | M7 — Product integration & preparedness | Dashboard terpadu, panduan, admin, alur end-to-end |
| 23–26 Des | M8 — Stabilization & deployment | QA, security, performance, demo deployment |
| 27–28 Des | M9 — Submission materials | README final, pitch deck, video demo |
| 29 Des | M10 — Freeze & rehearsal | Release candidate, rehearsal, backup |
| 30 Des | M11 — Submission day | Pengumpulan diverifikasi |

---

# 5. Rincian Pekerjaan per Fase

## M0 — Project Alignment & Repository Audit
**8–10 November 2026**

### Tujuan
Memastikan Agent memahami tiga dokumen, mengetahui kondisi repository, dan tidak langsung mengubah project secara membabi buta.

### Pekerjaan
- [ ] Masukkan PRD, Design, dan Guide Book ke `docs/`.
- [ ] Minta Antigravity membaca ketiga dokumen secara penuh.
- [ ] Minta Agent membuat matriks requirement: PRD → halaman/fitur → API → database → test.
- [ ] Audit struktur repository, branch, framework, dependency, environment, dan fitur yang sudah ada.
- [ ] Jalankan baseline install/build/test.
- [ ] Catat bagian yang sudah berfungsi dan jangan ditimpa tanpa alasan.
- [ ] Kunci MVP dan backlog.
- [ ] Buat GitHub repository dan branch strategy jika belum tersedia.

### Output
- `docs/PROJECT_AUDIT.md`
- `docs/REQUIREMENT_TRACEABILITY.md`
- `docs/IMPLEMENTATION_PLAN.md`
- Issue/task list berdasarkan prioritas.
- Repository baseline yang dapat dijalankan.

### Gate kelulusan
Jangan lanjut jika belum diketahui cara menjalankan project, struktur yang dipakai, dan fitur yang sudah ada.

---

## M1 — Architecture & Technical Foundation Plan
**11–15 November 2026**

### Tujuan
Menyelesaikan keputusan teknis penting sebelum implementasi besar.

### Pekerjaan
- [ ] Tentukan struktur frontend dan backend berdasarkan audit.
- [ ] Buat diagram arsitektur.
- [ ] Buat ERD PostgreSQL/PostGIS.
- [ ] Definisikan role dan permission.
- [ ] Buat API contract awal.
- [ ] Buat data-source feasibility matrix.
- [ ] Verifikasi dokumentasi, akses, rate limit, lisensi, dan frekuensi update sumber data.
- [ ] Pilih library peta: MapLibre GL JS atau Leaflet; gunakan satu.
- [ ] Tentukan mekanisme queue dan scheduler.
- [ ] Tentukan transport update client: SSE/WebSocket jika sesuai, dengan polling fallback.
- [ ] Buat threat model sederhana untuk auth, upload, lokasi, dan AI.

### Prioritas sumber data
Evaluasi BMKG, BNPB, NASA FIRMS, InaRISK, OpenStreetMap, dan dataset elevasi sesuai akses aktual. Jangan menganggap semua sumber memiliki API publik yang stabil.

Buat tabel:
| Source | Data | Access verified? | Update interval | License/terms | Fallback | Decision |
|---|---|---|---|---|---|---|

Pilih sumber yang paling mungkin diintegrasikan secara nyata, bukan yang paling banyak namanya.

### Output
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/ERD.md`
- `docs/API_SPECIFICATION.md`
- `docs/DATA_SOURCE_ASSESSMENT.md`
- `docs/THREAT_MODEL.md`

### Gate kelulusan
Minimal satu sumber data eksternal harus terbukti dapat diakses secara teknis sebelum UI diberi label “Live”.

---

## M2 — Application Foundation
**16–22 November 2026**

### Tujuan
Membangun fondasi aplikasi yang stabil dan konsisten dengan Design document.

### Frontend
- [ ] Setup React + Vite + TypeScript sesuai repository.
- [ ] Setup Tailwind dan design tokens.
- [ ] Buat typography, color, spacing, radius, shadow, dan responsive rules.
- [ ] Buat reusable button, input, select, badge, modal/drawer, toast, skeleton, empty state, error state.
- [ ] Setup routing dan protected routes.
- [ ] Buat application shell dan navigasi workspace.
- [ ] Implementasikan Login/Register.
- [ ] Implementasikan layout dashboard dasar.

### Backend
- [ ] Setup Laravel dan konfigurasi environment.
- [ ] Setup PostgreSQL dan PostGIS.
- [ ] Buat migration awal dan seed role.
- [ ] Implementasikan auth dengan Sanctum atau pola yang disetujui.
- [ ] Terapkan authorization policy/middleware.
- [ ] Buat response/error format API konsisten.
- [ ] Setup logging dan validasi.
- [ ] Setup queue/scheduler dasar.

### Output
- Frontend dan backend berjalan lokal.
- Database migration berhasil.
- Register/login/logout berfungsi.
- Role dasar bekerja.
- UI shell sesuai Design document.
- `.env.example` tersedia tanpa secret.

### Gate kelulusan
User dapat register/login, masuk workspace, dan endpoint privat terlindungi.

---

## M3 — Earth Intelligence: Interactive Map
**23–29 November 2026**

### Tujuan
Menyelesaikan peta sebagai fitur utama SENTRAVAX, bukan peta dekoratif.

### Pekerjaan
- [ ] Integrasikan MapLibre atau Leaflet.
- [ ] Implementasikan pan, zoom, locate me dengan consent, dan search lokasi.
- [ ] Buat layer control dan legend.
- [ ] Buat filter kategori/waktu.
- [ ] Buat marker dan detail panel.
- [ ] Buat endpoint map dengan bounding box/filter.
- [ ] Tambahkan clustering atau strategi performa yang sesuai.
- [ ] Tampilkan source, observed time, fetched time, freshness, dan verification state.
- [ ] Tambahkan error/empty/stale/unavailable states.
- [ ] Uji desktop, tablet, dan mobile.

### Layer yang disarankan
Mulai dari layer yang memiliki data yang dapat diakses. Contoh kategori:
- Cuaca/peringatan cuaca.
- Gempa bumi.
- Hotspot/anomali termal.
- Laporan masyarakat.
- Zona kerentanan statis jika dataset dan metodologinya tersedia.

Jangan memaksakan seluruh kategori memiliki data live pada minggu ini.

### Output
- Peta interaktif.
- Layer control berfungsi.
- Detail marker/area.
- API map berjalan.
- Metadata sumber dan freshness terlihat.

### Gate kelulusan
Pengguna dapat memilih layer, melihat data, membuka detail, dan mengetahui kapan serta dari mana data berasal.

---

## M4 — Data Pipeline & Risk Engine
**30 November – 6 Desember 2026**

### Tujuan
Membuat sistem dapat menerima dan mengolah data secara berulang, bukan hanya mengambil data sekali untuk screenshot.

### Pekerjaan data pipeline
- [ ] Buat adapter terpisah untuk setiap provider.
- [ ] Implementasikan scheduled ingestion.
- [ ] Validasi schema dan field wajib.
- [ ] Normalisasi format waktu, kategori, koordinat, dan satuan.
- [ ] Implementasikan deduplication.
- [ ] Simpan provenance.
- [ ] Simpan sync logs dan status sumber.
- [ ] Terapkan timeout, bounded retry, dan error handling.
- [ ] Buat freshness classifier per sumber.
- [ ] Buat fallback saat provider gagal.

### Pekerjaan Risk Engine
- [ ] Tentukan indikator per kategori bahaya yang benar-benar memiliki input data.
- [ ] Buat aturan berversi.
- [ ] Definisikan skala dan threshold.
- [ ] Simpan input dan hasil evaluasi untuk audit.
- [ ] Tangani `insufficient_data`.
- [ ] Buat unit test untuk setiap aturan.
- [ ] Tampilkan alasan hasil analisis.

### Output
- Minimal satu integrasi eksternal berjalan otomatis dan diuji berulang.
- Target 2–3 sumber/layer jika akses dan waktu memungkinkan.
- Data tersimpan dan dapat ditelusuri.
- Risk Engine menghasilkan assessment dari aturan terdokumentasi.
- Data stale/unavailable ditangani dengan benar.

### Gate kelulusan
Data yang masuk dapat ditelusuri ke sumber dan waktunya; analisis tidak menggunakan nilai yang dikarang.

---

## M5 — AI Proactive Intelligence
**7–13 Desember 2026**

### Tujuan
Mewujudkan pembeda utama SENTRAVAX: sistem dapat menghasilkan insight dari event tanpa harus menunggu pengguna membuka chatbot.

### Pekerjaan
- [ ] Buat AI service di backend.
- [ ] Buat context builder yang mengambil lokasi, periode, data, risk assessment, dan sumber relevan.
- [ ] Buat prompt/version management.
- [ ] Buat contextual assistant.
- [ ] Buat event trigger dari perubahan data atau threshold Risk Engine.
- [ ] Buat proactive insight generator.
- [ ] Simpan insight beserta sumber, alasan trigger, waktu, batasan, dan versi aturan/model.
- [ ] Buat insight detail dan filter.
- [ ] Buat in-app notification.
- [ ] Implementasikan fingerprint, deduplication, aggregation, dan cooldown.
- [ ] Buat fallback ketika provider AI gagal.
- [ ] Uji prompt injection dan jawaban tanpa sumber.

### Alur wajib
`New Data → Risk Rule Evaluated → Event Triggered → Context Built → AI Explanation → Insight Stored → Notification Created`

### Output
- Chat assistant memahami konteks data SENTRAVAX.
- Minimal satu event/rule memicu insight secara otomatis.
- Insight menampilkan alasan dan sumber.
- Notifikasi in-app muncul tanpa duplikasi berlebihan.
- Peta dan dashboard tetap berfungsi ketika AI provider gagal.

### Gate kelulusan
Demonstrasikan satu skenario dari data masuk hingga proactive insight muncul. Jangan hanya mendemonstrasikan chat.

---

## M6 — Community Network & Moderation
**14–18 Desember 2026**

### Tujuan
Menghubungkan informasi sistem dengan kontribusi masyarakat secara aman dan terverifikasi.

### Pekerjaan
- [ ] Form laporan kategori, deskripsi, waktu, dan lokasi.
- [ ] Upload foto dengan validasi tipe/ukuran dan penyimpanan aman.
- [ ] Status Submitted, Under Review, Need More Information, Verified, Rejected, Resolved.
- [ ] Halaman detail laporan.
- [ ] Riwayat laporan milik pengguna.
- [ ] Dashboard antrean moderator.
- [ ] Aksi verifikasi dan catatan moderator.
- [ ] Audit log perubahan status.
- [ ] AI bantu klasifikasi dan duplicate suggestion, bukan menetapkan Verified.
- [ ] Generalisasi koordinat pada tampilan publik.

### Output
- Pengguna dapat mengirim laporan.
- Moderator dapat memeriksa dan mengubah status.
- Pengguna dapat melihat status laporan.
- Laporan belum diverifikasi ditandai secara jelas.

### Gate kelulusan
Satu laporan dapat ditelusuri dari submit sampai keputusan moderator, termasuk audit trail.

---

## M7 — Product Integration, Preparedness & Admin
**19–22 Desember 2026**

### Tujuan
Menghubungkan modul menjadi satu pengalaman produk yang utuh.

### Pekerjaan
- [ ] Integrasikan data peta, dashboard, risk assessment, insight, dan notifikasi.
- [ ] Buat overview dashboard dengan prioritas informasi yang jelas.
- [ ] Tambahkan official warning feed jika sumber valid tersedia.
- [ ] Bedakan Official Warning, Observed Data, Community Report, dan SENTRAVAX Insight.
- [ ] Tambahkan preparedness guides dan checklist dari sumber tepercaya.
- [ ] Buat preferensi notifikasi.
- [ ] Buat admin source monitoring sederhana.
- [ ] Pastikan setiap tombol dan navigasi berfungsi.
- [ ] Rapikan loading, empty, error, stale, dan unavailable state.

### Output
- Alur utama dari dashboard → map → insight → report → moderation berjalan.
- Preparedness dapat digunakan.
- Admin dapat melihat status sumber data.
- Tidak ada halaman inti yang hanya berupa placeholder.

### Gate kelulusan
Lakukan satu demonstrasi end-to-end tanpa perlu mengubah database secara manual di tengah demo.

---

## M8 — Stabilization, QA, Security & Deployment
**23–26 Desember 2026**

### Tujuan
Mengubah aplikasi yang sudah selesai dikembangkan menjadi release candidate yang stabil.

### Functional QA
- [ ] Register/login/logout.
- [ ] Role dan akses endpoint.
- [ ] Dashboard load.
- [ ] Peta dan layer.
- [ ] Detail data dan freshness.
- [ ] Data ingestion dan retry.
- [ ] Risk Engine.
- [ ] AI assistant.
- [ ] Proactive insight.
- [ ] Notification deduplication.
- [ ] Submit report dan upload.
- [ ] Moderator verification.
- [ ] Preparedness.
- [ ] Admin source status.

### Security QA
- [ ] Coba akses endpoint privat tanpa login.
- [ ] Coba akses fitur admin dengan akun biasa.
- [ ] Validasi input dan upload.
- [ ] Periksa rate limit.
- [ ] Periksa secret tidak masuk Git.
- [ ] Periksa CORS/HTTPS pada deployment.
- [ ] Periksa lokasi presisi dan data pribadi tidak terbuka ke publik.
- [ ] Periksa audit log untuk aksi sensitif.

### Performance QA
- [ ] Uji peta dengan volume data realistis.
- [ ] Uji pagination/filter.
- [ ] Periksa query lambat dan spatial index.
- [ ] Periksa bundle frontend dan asset.
- [ ] Periksa console/network errors.
- [ ] Uji saat API eksternal timeout.
- [ ] Uji saat AI provider gagal.
- [ ] Uji queue worker restart.

### Deployment
- [ ] Siapkan environment demo/staging.
- [ ] Jalankan migration production.
- [ ] Setup scheduler dan queue worker.
- [ ] Aktifkan HTTPS.
- [ ] Setup health check dan log.
- [ ] Siapkan akun demo dengan role berbeda.
- [ ] Uji dari browser/perangkat lain, bukan hanya komputer developer.
- [ ] Catat URL demo dan instruksi fallback lokal.

### Output
- Release candidate.
- URL demo atau prosedur demo lokal.
- QA report.
- Security checklist.
- Known limitations list.

### Gate kelulusan
Aplikasi dapat dibuka dari lingkungan bersih dan alur demo utama dapat diselesaikan tanpa error kritis.

---

## M9 — Dokumentasi, Pitch Deck & Video Demo
**27–28 Desember 2026**

### README dan dokumentasi
- [ ] Deskripsi masalah dan solusi.
- [ ] Fitur MVP yang benar-benar aktif.
- [ ] Arsitektur sistem.
- [ ] Tech stack.
- [ ] ERD atau ringkasan database.
- [ ] Data source dan batasan integrasi.
- [ ] Cara install frontend/backend.
- [ ] Cara konfigurasi `.env`.
- [ ] Cara migration dan seeding.
- [ ] Cara menjalankan queue/scheduler.
- [ ] Akun demo dan role (jangan gunakan password pribadi).
- [ ] URL deployment.
- [ ] Screenshot aplikasi.
- [ ] Known limitations dan fitur yang masih simulasi.

### Pitch deck
Susunan yang disarankan:
1. Judul SENTRAVAX dan tagline.
2. Permasalahan nyata yang ingin diselesaikan.
3. Target pengguna dan konteks Indonesia.
4. Solusi dan proposisi nilai.
5. Cara kerja sistem end-to-end.
6. Arsitektur dan teknologi.
7. Demo fitur utama.
8. AI Proactive Intelligence dan pembeda.
9. Data source, keamanan, dan transparansi.
10. Dampak/manfaat yang dapat dibuktikan.
11. Status implementasi dan pengembangan berikutnya.
12. GitHub repository dan demo URL.

Jangan mengisi pitch deck dengan klaim dampak atau akurasi yang belum diuji.

### Video demo
Alur video yang disarankan:
1. Perkenalkan masalah dan SENTRAVAX.
2. Tampilkan dashboard dan lokasi.
3. Buka peta dan aktifkan layer.
4. Tunjukkan sumber serta waktu pembaruan data.
5. Perlihatkan risk assessment dan alasan.
6. Demonstrasikan proactive insight yang dipicu event.
7. Tunjukkan laporan warga dan proses verifikasi.
8. Tunjukkan rekomendasi/panduan.
9. Tutup dengan manfaat, GitHub, dan demo URL.

Rekam alur yang benar-benar berjalan. Siapkan data demo yang sudah di-seed agar hasil presentasi konsisten, tetapi beri label simulasi pada data tersebut. Jika menggunakan data aktual, tunjukkan sumber dan waktu update.

**Catatan lomba:** Guide Book meminta video, pitch deck, dan software sistem/GitHub. Konfirmasi kembali instruksi teknis pengumpulan dari panitia menjelang deadline. Berdasarkan klarifikasi admin yang pernah diterima, format/durasi video dan format pitch deck tidak ditentukan secara khusus; hosting atau demo lokal dapat digunakan, tetapi GitHub harus dapat diakses juri.

### Output
- README final.
- Pitch deck PDF.
- Video demo final.
- Daftar link pengumpulan.

---

## M10 — Freeze, Rehearsal & Backup
**29 Desember 2026**

### Pekerjaan
- [ ] Freeze fitur; jangan menambah fitur baru.
- [ ] Pull/fetch dan pastikan branch final benar.
- [ ] Jalankan install/build/test dari awal.
- [ ] Uji demo dari browser incognito/perangkat lain.
- [ ] Uji akun demo.
- [ ] Periksa seluruh link GitHub dan deployment.
- [ ] Periksa video dan pitch deck dapat dibuka.
- [ ] Latihan presentasi dan siapkan jawaban pertanyaan teknis.
- [ ] Buat backup source code dan database demo.
- [ ] Buat checklist final pengumpulan.

### Output
- Release tag, misalnya `v1.0.0-competition`.
- Backup final.
- Demo script.
- Checklist submission yang sudah ditandai.

### Aturan freeze
Setelah freeze, hanya perbaiki bug kritis. Jangan melakukan refactor besar atau mengganti library.

---

## M11 — Submission Day
**30 Desember 2026**

### Checklist
- [ ] Pastikan akun/pendaftaran peserta benar.
- [ ] Pastikan link GitHub dapat diakses juri.
- [ ] Pastikan repository berisi source code final.
- [ ] Pastikan pitch deck mencantumkan link repository.
- [ ] Pastikan video final dapat dibuka.
- [ ] Pastikan demo URL aktif atau instruksi demo lokal jelas.
- [ ] Pastikan semua berkas sesuai instruksi form panitia.
- [ ] Submit sebelum batas waktu, jangan menunggu menit terakhir.
- [ ] Simpan bukti submit dan salinan semua berkas.

**Target internal:** selesaikan seluruh materi paling lambat 29 Desember. Tanggal 30 Desember digunakan untuk pemeriksaan dan pengumpulan, bukan menyelesaikan fitur.

---

# 6. Alur Demo Utama yang Harus Menjadi Prioritas

Jangan mencoba mendemonstrasikan semua menu. Bangun satu cerita yang menunjukkan nilai SENTRAVAX.

## Skenario demo utama

1. Pengguna membuka SENTRAVAX dan memilih lokasi.
2. Dashboard menampilkan kondisi serta waktu pembaruan sumber.
3. Pengguna membuka Earth Intelligence dan mengaktifkan satu atau beberapa layer.
4. Pengguna memilih satu kejadian/area dan melihat sumber serta detailnya.
5. Data baru atau event uji masuk ke pipeline.
6. Risk Engine mengevaluasi aturan yang relevan.
7. SENTRAVAX AI menghasilkan insight, menjelaskan alasan dan sumber.
8. Pengguna menerima in-app notification.
9. Pengguna membuka insight dan membaca rekomendasi.
10. Pengguna mengirim laporan kondisi lapangan.
11. Moderator memeriksa laporan dan mengubah status.
12. Pengguna melihat status terbaru.

Skenario ini memperlihatkan bahwa SENTRAVAX adalah sistem terpadu, bukan kumpulan halaman.

## Skenario cadangan demo

Siapkan data simulasi yang stabil untuk demo jika API eksternal sedang down. Data simulasi harus:
- diberi label `SIMULATED`;
- memiliki timestamp demo yang jelas;
- tidak dicampur dengan data live;
- tidak digunakan untuk mengklaim kondisi bencana aktual.

Jangan mengandalkan API publik yang tidak stabil sebagai satu-satunya cara untuk menjalankan demo.

---

# 7. Pembagian Fokus Berdasarkan Bobot Penilaian

Guide Book Web/Mobile Apps mencantumkan aspek penilaian berikut:

| Aspek | Bobot | Fokus pengerjaan |
|---|---:|---|
| Logika Code | 15% | Risk rules, data pipeline, validasi, event, workflow |
| User Interface | 15% | Hierarki visual, peta, responsivitas, konsistensi design |
| Keamanan Aplikasi | 10% | Session/auth, role, validasi, upload, privasi |
| Easy Development | 10% | README, setup mudah, `.env.example`, migration, seed |
| Kreativitas Ide | 10% | Integrasi AI, geospatial intelligence, multi-hazard, community |
| Performa Sistem | 10% | Query, map loading, caching, error handling |
| Pengetahuan Dasar Code | 10% | Pahami kode dan keputusan teknis yang ditulis |
| Penggunaan Database | 10% | Relasi, query, migration, PostGIS, index |
| Kerapihan Code | 10% | Struktur, naming, linting, komentar seperlunya |

Gunakan bobot ini untuk menentukan prioritas. Jangan hanya mengejar UI karena UI bernilai 15% dan logika code juga 15%. Database, keamanan, performa, dan kemudahan instalasi masing-masing memiliki bobot yang nyata.

---

# 8. Ritme Kerja Harian

Gunakan ritme sederhana agar pekerjaan tetap terukur:

### Awal sesi — 10 menit
- Buka task board.
- Pilih maksimal 1–3 task utama.
- Tentukan definisi selesai untuk tiap task.

### Sesi implementasi
- Kerjakan satu vertical slice sampai berfungsi.
- Hindari membuat banyak halaman placeholder.
- Commit perubahan kecil dan jelas.

### Akhir sesi — 15–20 menit
- Jalankan build/test yang relevan.
- Cek console dan network.
- Catat file yang berubah.
- Catat bug dan blocker.
- Update task board.
- Commit/push jika perubahan stabil.

### Format laporan harian
```text
Tanggal:
Milestone:
Selesai:
Belum selesai:
File yang berubah:
Test/build:
Bug atau blocker:
Integrasi live:
Data simulasi:
Rencana sesi berikutnya:
```

---

# 9. Cara Menggunakan Antigravity dengan Aman

Jangan memberi instruksi “buat seluruh SENTRAVAX sekarang”. Gunakan Agent per fase dan minta bukti hasil.

## Prompt pembuka — memahami tiga dokumen

```text
Baca seluruh dokumen berikut sampai selesai:
- docs/PRD.md
- docs/DESIGN.md
- docs/GUIDEBOOK.md

Jangan mengubah kode dulu.

Buat:
1. REQUIREMENT_TRACEABILITY.md
2. PROJECT_AUDIT.md
3. IMPLEMENTATION_PLAN.md
4. daftar konflik/ketidakjelasan antar dokumen
5. daftar pertanyaan teknis yang benar-benar menghambat implementasi

Petakan setiap requirement ke halaman, komponen, API, tabel database,
dan test yang dibutuhkan. Bedakan must-have MVP, should-have, dan
deferred. Jangan mengarang integrasi data atau kemampuan real-time.
```

## Prompt untuk setiap milestone

```text
Kerjakan hanya milestone [NAMA MILESTONE] sesuai
docs/IMPLEMENTATION_PLAN.md dan PRD.

Sebelum coding:
- cek kondisi repository terbaru;
- identifikasi file yang akan diubah;
- jelaskan dampak perubahan;
- pertahankan fitur yang sudah berfungsi.

Saat coding:
- implementasikan alur end-to-end, bukan UI placeholder;
- ikuti docs/DESIGN.md;
- validasi di backend;
- buat loading, empty, error, dan unavailable states;
- jangan menggunakan data palsu tanpa label SIMULATED.

Setelah coding:
- jalankan build dan test;
- periksa console/network;
- uji responsive;
- laporkan file yang berubah;
- sebutkan fitur yang benar-benar aktif, mock, dan pending;
- berikan langkah verifikasi manual.

Jangan mulai milestone berikutnya sebelum milestone ini diverifikasi.
```

## Prompt code review

```text
Lakukan review terhadap perubahan milestone ini.

Periksa:
1. bug dan alur yang tidak selesai;
2. keamanan dan authorization;
3. validasi input;
4. query database dan performa;
5. responsive dan accessibility;
6. error/loading/empty states;
7. data live vs simulated;
8. konsistensi dengan PRD dan Design;
9. test yang belum ada.

Jangan melakukan rewrite besar. Berikan temuan berdasarkan tingkat
severity: Critical, High, Medium, Low. Perbaiki Critical dan High
setelah menjelaskan perubahan yang diperlukan.
```

---

# 10. Definition of Done untuk Setiap Fitur

Sebuah fitur belum dianggap selesai hanya karena tampil di browser.

Fitur dinyatakan selesai apabila:
- [ ] Tujuan dan alurnya sesuai PRD.
- [ ] UI sesuai Design document.
- [ ] Data berasal dari backend atau sumber yang jelas.
- [ ] Validasi dan authorization diterapkan.
- [ ] Loading, empty, error, dan unavailable state tersedia.
- [ ] Semua tombol dan interaksi berfungsi.
- [ ] Tidak ada data simulasi yang disamarkan sebagai data live.
- [ ] Test relevan dijalankan.
- [ ] Tidak merusak fitur yang sudah ada.
- [ ] Responsif pada ukuran layar utama.
- [ ] Dokumentasi diperbarui.
- [ ] Dapat didemonstrasikan tanpa manipulasi manual yang tidak terdokumentasi.

---

# 11. Risiko Utama dan Rencana Mitigasi

| Risiko | Dampak | Tindakan |
|---|---|---|
| Scope terlalu besar | MVP tidak selesai | Kunci P0; pindahkan fitur tambahan ke backlog |
| API tidak dapat diakses | Data live gagal | Validasi di M1; siapkan adapter dan demo data berlabel |
| Data provider terlambat | Insight tidak aktual | Source-specific freshness dan status delayed/stale |
| AI memberi jawaban keliru | Informasi menyesatkan | Grounding, sumber, batasan, Risk Engine deterministik |
| Antigravity mengubah banyak file | Fitur lama rusak | Audit, branch, commit kecil, review diff |
| Integrasi terlalu banyak | Waktu habis untuk debugging | Target 1 sumber nyata dahulu, lalu tambah bila stabil |
| Peta lambat | Demo terganggu | Bounding box, pagination, clustering, spatial index |
| Deployment gagal | Juri tidak dapat mengakses | Deploy dan uji paling lambat 26 Desember |
| Demo bergantung internet/API | Demo tidak konsisten | Siapkan mode demo berlabel SIMULATED |
| Dokumentasi terlambat | Pengumpulan tidak siap | README mulai dibuat sejak awal, finalisasi 27–28 Desember |

---

# 12. Dashboard Progres Proyek

Gunakan daftar ini sebagai checklist utama. Tandai hanya setelah hasilnya diverifikasi.

## Planning
- [ ] Tiga dokumen sudah berada di `docs/`.
- [ ] Agent telah membaca ketiganya.
- [ ] Repository audit selesai.
- [ ] Requirement traceability selesai.
- [ ] Scope MVP dikunci.
- [ ] Arsitektur dan ERD disetujui.
- [ ] Data source feasibility selesai.

## Foundation
- [ ] Frontend berjalan.
- [ ] Backend berjalan.
- [ ] Database dan migration berjalan.
- [ ] Authentication berjalan.
- [ ] Role dan permission berjalan.
- [ ] Design system terimplementasi.

## Core intelligence
- [ ] Peta interaktif berjalan.
- [ ] Layer control berjalan.
- [ ] Minimal satu sumber eksternal nyata terintegrasi.
- [ ] Source metadata dan freshness berjalan.
- [ ] Risk Engine berjalan.
- [ ] Event trigger berjalan.
- [ ] AI contextual assistant berjalan.
- [ ] Proactive insight berjalan.
- [ ] In-app notification berjalan.

## Community
- [ ] Submit report berjalan.
- [ ] Upload aman.
- [ ] Moderator queue berjalan.
- [ ] Verification workflow berjalan.
- [ ] Report status pengguna berjalan.
- [ ] Audit log berjalan.

## Release
- [ ] Dashboard terpadu selesai.
- [ ] Preparedness content tersedia.
- [ ] Functional QA selesai.
- [ ] Security QA selesai.
- [ ] Performance QA selesai.
- [ ] Deployment berhasil.
- [ ] Demo lintas perangkat berhasil.
- [ ] README final.
- [ ] GitHub final.
- [ ] Pitch deck final.
- [ ] Video demo final.
- [ ] Rehearsal selesai.
- [ ] Bukti pengumpulan tersimpan.

---

# 13. Aturan Keputusan Jika Terlambat

Jika jadwal mulai meleset, gunakan urutan pengurangan scope berikut:

1. Hentikan fitur P2 dan fitur kosmetik.
2. Sederhanakan Impact & Recovery menjadi halaman informasi/rekap aktivitas yang datanya valid.
3. Batasi jumlah layer pada layer yang benar-benar dapat diakses.
4. Batasi kategori analisis mendalam pada kategori yang memiliki input data memadai, tetapi pertahankan struktur multi-hazard.
5. Gunakan demo dataset berlabel untuk skenario presentasi, tanpa menyebutnya live.
6. Pertahankan auth, peta inti, provenance/freshness, Risk Engine, satu proactive insight workflow, laporan/verifikasi, keamanan, dan dokumentasi.

**Jangan mengurangi:** keamanan dasar, transparansi sumber, status data, kemampuan menjalankan aplikasi, dan waktu untuk pengujian/pengumpulan.

---

# 14. Target Akhir

Pada 29 Desember 2026, SENTRAVAX harus berada pada kondisi **Release Candidate**:
- fitur wajib selesai;
- build/test utama lolos;
- deployment atau demo lokal teruji;
- GitHub siap dinilai;
- video dan pitch deck selesai;
- dokumentasi cukup untuk instalasi dan pemeriksaan.

Pada 30 Desember 2026, fokus hanya pada pengecekan akhir dan pengumpulan.

**Ukuran keberhasilan SENTRAVAX:**

Bukan berapa banyak halaman yang dibuat, melainkan apakah sistem mampu mengambil data yang dapat dipercaya, memahami konteks lokasi dan waktu, menganalisis indikator secara transparan, menghasilkan insight yang berguna, dan membantu masyarakat mengambil tindakan yang lebih siap.

`Reliable Data → Explainable Risk → Proactive Intelligence → Community Action`
