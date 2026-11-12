<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\AiInsight;
use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use App\Models\EducationContent;
use App\Models\EmergencyScenario;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\PreparednessChecklistItem;
use App\Models\PreparednessContact;
use App\Models\PreparednessPlan;
use App\Models\Region;
use App\Models\RiskAssessment;
use App\Models\ScenarioQuestion;
use App\Models\User;
use App\Models\UserSavedRegion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SentravaxMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Idempotent: safe to run multiple times without duplicating data.
     */
    public function run(): void
    {
        $this->seedUsers();
        $this->seedHazardTypes();
        $this->seedDataSources();
        $this->seedRegions();
        $this->seedInitialHazardEvents();
        $this->seedPreparednessChecklistItems();
        $this->seedEmergencyScenarios();
        $this->seedEducationContents();
        $this->seedAlertsAndRiskAssessments();
        $this->seedSampleUserPreparedness();
    }

    /**
     * Seed Development Accounts for each role.
     */
    private function seedUsers(): void
    {
        $defaultPassword = Hash::make('Sentravax2026!');

        $users = [
            [
                'name' => 'Administrator SENTRAVAX',
                'email' => 'admin@sentravax.go.id',
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Analis Intelijen Kebencanaan',
                'email' => 'intelligence@sentravax.go.id',
                'role' => User::ROLE_INTELLIGENCE,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Warga Siaga Mandiri',
                'email' => 'user@sentravax.id',
                'role' => User::ROLE_USER,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, ['password' => $defaultPassword])
            );
        }
    }

    /**
     * Seed Master Hazard Types.
     */
    private function seedHazardTypes(): void
    {
        $hazards = [
            [
                'slug' => 'flood',
                'name' => 'Banjir dan Genangan',
                'category' => 'natural',
                'description' => 'Luapan sungai, curah hujan ekstrem, dan genangan air permukaan kawasan perkotaan.',
                'icon' => 'waves',
                'severity_levels' => ['low' => 'Waspada (< 30 cm)', 'medium' => 'Siaga (30 - 80 cm)', 'high' => 'Awas (> 80 cm)'],
                'is_active' => true,
            ],
            [
                'slug' => 'landslide',
                'name' => 'Tanah Longsor',
                'category' => 'natural',
                'description' => 'Gerakan tanah pada lereng kritis yang dipicu curah hujan tinggi atau deformasi geologi.',
                'icon' => 'mountain',
                'severity_levels' => ['low' => 'Pergerakan Minor', 'medium' => 'Retakan Lereng Aktif', 'high' => 'Longsor Masif'],
                'is_active' => true,
            ],
            [
                'slug' => 'extreme_weather',
                'name' => 'Cuaca Ekstrem & Angin Kencang',
                'category' => 'natural',
                'description' => 'Hujan lebat disertai angin puting beliung atau petir yang mengancam struktur bangunan.',
                'icon' => 'cloud-lightning',
                'severity_levels' => ['low' => 'Hujan Sedang', 'medium' => 'Hujan Lebat & Angin', 'high' => 'Badai Konvektif Ekstrem'],
                'is_active' => true,
            ],
            [
                'slug' => 'earthquake',
                'name' => 'Gempa Bumi',
                'category' => 'natural',
                'description' => 'Getaran seismik tektonik yang berpotensi merusak infrastruktur pemukiman.',
                'icon' => 'activity',
                'severity_levels' => ['low' => '< 5.0 M', 'medium' => '5.0 - 6.5 M', 'high' => '> 6.5 M'],
                'is_active' => true,
            ],
            [
                'slug' => 'coastal_flood',
                'name' => 'Banjir Rob Pesisir',
                'category' => 'natural',
                'description' => 'Intrusi pasang maksimum air laut yang menggenangi wilayah pesisir dan muara.',
                'icon' => 'anchor',
                'severity_levels' => ['low' => 'Pasang Waspada', 'medium' => 'Rob Masuk Pemukiman', 'high' => 'Rob Ekstrem & Gelombang Tinggi'],
                'is_active' => true,
            ],
        ];

        foreach ($hazards as $hz) {
            HazardType::updateOrCreate(['slug' => $hz['slug']], $hz);
        }
    }

    /**
     * Seed Master Data Sources.
     */
    private function seedDataSources(): void
    {
        $sources = [
            [
                'name' => 'BMKG Weather Radar & Observation API',
                'provider' => 'Badan Meteorologi, Klimatologi, dan Geofisika',
                'source_type' => 'api',
                'category' => 'weather',
                'endpoint_url' => 'https://api.bmkg.go.id/public/weather',
                'status' => 'active',
                'last_fetched_at' => now()->subMinutes(5),
                'last_successful_at' => now()->subMinutes(5),
                'notes' => 'Sumber resmi pengamatan radar cuaca nasional dan prakiraan peringatan dini cuaca ekstrem.',
            ],
            [
                'name' => 'PVMBG Geological & Volcanic Stream',
                'provider' => 'Pusat Vulkanologi dan Mitigasi Bencana Geologi',
                'source_type' => 'stream',
                'category' => 'geology',
                'endpoint_url' => 'https://magma.vsi.esdm.go.id/api/v1',
                'status' => 'active',
                'last_fetched_at' => now()->subMinutes(12),
                'last_successful_at' => now()->subMinutes(12),
                'notes' => 'Pemantauan deformasi lereng, status gunung api, dan zona kerentanan gerakan tanah.',
            ],
            [
                'name' => 'InSAR Sentinel-1 Ground Deformation',
                'provider' => 'European Space Agency (ESA) Copernicus',
                'source_type' => 'satellite',
                'category' => 'satellite',
                'endpoint_url' => 'https://dataspace.copernicus.eu/api',
                'status' => 'active',
                'last_fetched_at' => now()->subHours(2),
                'last_successful_at' => now()->subHours(2),
                'notes' => 'Citra radar sintetis untuk deteksi penurunan tanah (land subsidence) dan akumulasi elevasi basah.',
            ],
        ];

        foreach ($sources as $src) {
            DataSource::updateOrCreate(['name' => $src['name']], $src);
        }
    }

    /**
     * Seed Verified Pilot Regions with Real Coordinates.
     */
    private function seedRegions(): void
    {
        $regions = [
            [
                'code' => 'ID-JK',
                'name' => 'Provinsi DKI Jakarta',
                'level' => 'province',
                'lon' => 106.8456,
                'lat' => -6.2088,
            ],
            [
                'code' => 'ID-JK-JU',
                'name' => 'Jakarta Utara (Tanjung Priok & Pesisir)',
                'level' => 'regency',
                'lon' => 106.8827,
                'lat' => -6.1214,
            ],
            [
                'code' => 'ID-JK-JT',
                'name' => 'Jakarta Timur (Cakung & DAS Ciliwung Hilir)',
                'level' => 'regency',
                'lon' => 106.9004,
                'lat' => -6.2250,
            ],
            [
                'code' => 'ID-JB-BGR',
                'name' => 'Jawa Barat (DAS Hulu Puncak Bogor)',
                'level' => 'regency',
                'lon' => 106.9744,
                'lat' => -6.6972,
            ],
            [
                'code' => 'ID-BT-ANY',
                'name' => 'Banten (Pesisir Anyer & Selat Sunda)',
                'level' => 'regency',
                'lon' => 105.9000,
                'lat' => -6.0500,
            ],
        ];

        foreach ($regions as $r) {
            $reg = Region::updateOrCreate(
                ['code' => $r['code']],
                [
                    'name' => $r['name'],
                    'level' => $r['level'],
                ]
            );

            // Update PostGIS Point using ST_SetSRID and ST_MakePoint(lon, lat)
            DB::statement('
                UPDATE regions 
                SET center_point = ST_SetSRID(ST_MakePoint(?, ?), 4326)
                WHERE id = ?
            ', [$r['lon'], $r['lat'], $reg->id]);
        }
    }

    /**
     * Seed Initial Live Hazard Events for testing.
     */
    private function seedInitialHazardEvents(): void
    {
        $floodType = HazardType::where('slug', 'flood')->first();
        $weatherType = HazardType::where('slug', 'extreme_weather')->first();
        $landslideType = HazardType::where('slug', 'landslide')->first();
        $bmkgSource = DataSource::where('source_type', 'api')->first();
        $regionNorth = Region::where('code', 'ID-JK-JU')->first();
        $regionEast = Region::where('code', 'ID-JK-JT')->first();
        $regionBogor = Region::where('code', 'ID-JB-BGR')->first();

        if (! $floodType || ! $bmkgSource || ! $regionNorth) {
            return;
        }

        $events = [
            [
                'title' => 'Banjir Luapan Sungai Ciliwung dan Genangan Pemukiman',
                'description' => 'Kenaikan debit air sungai mencapai status Siaga 2 menyusul hujan intensitas tinggi di kawasan hulu. Genangan air 40-70 cm dilaporkan di beberapa rukun warga hilir.',
                'hazard_type_id' => $floodType->id,
                'data_source_id' => $bmkgSource->id,
                'region_id' => $regionEast?->id,
                'severity' => 'medium',
                'status' => 'active',
                'occurred_at' => now()->subHours(3),
                'reported_at' => now()->subHours(2),
                'lon' => 106.8712,
                'lat' => -6.2234,
                'source_metadata' => ['water_level_cm' => 65, 'flow_rate_m3s' => 480],
            ],
            [
                'title' => 'Peringatan Angin Kencang dan Potensi Pohon Tumbang',
                'description' => 'Peningkatan kecepatan angin lokal hingga 45 km/jam disertai awan cumulonimbus aktif di sepanjang koridor utara ibu kota.',
                'hazard_type_id' => $weatherType?->id ?? $floodType->id,
                'data_source_id' => $bmkgSource->id,
                'region_id' => $regionNorth->id,
                'severity' => 'low',
                'status' => 'active',
                'occurred_at' => now()->subHours(1),
                'reported_at' => now()->subMinutes(40),
                'lon' => 106.8827,
                'lat' => -6.1214,
                'source_metadata' => ['wind_speed_kmh' => 45, 'gust_kmh' => 58],
            ],
            [
                'title' => 'Anomali Retakan Tanah Lereng Perbukitan',
                'description' => 'Saturasi air tanah tinggi memicu indikasi pergerakan tanah di kawasan lereng jalan penghubung puncak.',
                'hazard_type_id' => $landslideType?->id ?? $floodType->id,
                'data_source_id' => $bmkgSource->id,
                'region_id' => $regionBogor?->id,
                'severity' => 'high',
                'status' => 'active',
                'occurred_at' => now()->subHours(6),
                'reported_at' => now()->subHours(5),
                'lon' => 106.9744,
                'lat' => -6.6972,
                'source_metadata' => ['slope_gradient_deg' => 38, 'saturation_pct' => 88],
            ],
        ];

        foreach ($events as $ev) {
            $event = HazardEvent::updateOrCreate(
                ['title' => $ev['title']],
                [
                    'description' => $ev['description'],
                    'hazard_type_id' => $ev['hazard_type_id'],
                    'data_source_id' => $ev['data_source_id'],
                    'region_id' => $ev['region_id'],
                    'severity' => $ev['severity'],
                    'status' => $ev['status'],
                    'occurred_at' => $ev['occurred_at'],
                    'reported_at' => $ev['reported_at'],
                    'source_metadata' => $ev['source_metadata'],
                ]
            );

            DB::statement('
                UPDATE hazard_events 
                SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)
                WHERE id = ?
            ', [$ev['lon'], $ev['lat'], $event->id]);
        }
    }

    /**
     * Seed Master Items for Disaster Emergency Go-Bag (Tas Siaga Bencana).
     */
    private function seedPreparednessChecklistItems(): void
    {
        $items = [
            // Dokumen
            ['category' => 'dokumen', 'name' => 'Dokumen Kependudukan (KTP, KK, Akta Lahir)', 'description' => 'Salinan terlegalisir atau fotokopi yang dimasukkan dalam kantong plastik kedap air (ziplock).', 'sort_order' => 1, 'is_essential' => true],
            ['category' => 'dokumen', 'name' => 'Buku Tabungan, Sertifikat & Polis Asuransi', 'description' => 'Dokumen aset berharga dan nomor rekening penting disimpan di folder aman.', 'sort_order' => 2, 'is_essential' => true],
            ['category' => 'dokumen', 'name' => 'Daftar Kontak Darurat Tertulis', 'description' => 'Nomor telepon keluarga, tetangga, RT/RW, dan posko darurat saat baterai ponsel habis.', 'sort_order' => 3, 'is_essential' => true],
            // Medis
            ['category' => 'medis', 'name' => 'Kotak P3K Lengkap & Antiseptik', 'description' => 'Kasa steril, perban elastis, plester, gunting kecil, dan cairan antiseptik luka.', 'sort_order' => 4, 'is_essential' => true],
            ['category' => 'medis', 'name' => 'Obat-Obatan Rutin Pribadi (Persediaan 7 Hari)', 'description' => 'Obat hipertensi, diabetes, inhaler asma, atau obat rutin anggota keluarga.', 'sort_order' => 5, 'is_essential' => true],
            ['category' => 'medis', 'name' => 'Masker Medis & Hand Sanitizer', 'description' => 'Perlindungan pernapasan dari debu runtuhan, asap, atau transmisi penyakit di pengungsian.', 'sort_order' => 6, 'is_essential' => false],
            // Logistik
            ['category' => 'logistik', 'name' => 'Air Minum Kemasan (Minimal 3 Liter/Jiwa/Hari)', 'description' => 'Persediaan hidrasi darurat minimal untuk 3x24 jam pertama pasca bencana.', 'sort_order' => 7, 'is_essential' => true],
            ['category' => 'logistik', 'name' => 'Makanan Siap Saji Tahan Lama (Biskuit/Ransum/Kornet)', 'description' => 'Makanan berenergi tinggi yang tidak memerlukan pemanasan atau memasak.', 'sort_order' => 8, 'is_essential' => true],
            // Peralatan
            ['category' => 'peralatan', 'name' => 'Senter LED & Cadangan Baterai / Senter Putar', 'description' => 'Alat penerangan utama saat jaringan listrik padam total.', 'sort_order' => 9, 'is_essential' => true],
            ['category' => 'peralatan', 'name' => 'Peluit Darurat Frekuensi Tinggi', 'description' => 'Alat panggil bantuan regu penolong SAR jika terjebak reruntuhan tanpa menguras energi suara.', 'sort_order' => 10, 'is_essential' => true],
            ['category' => 'peralatan', 'name' => 'Power Bank Terisi Penuh & Kabel Pengisi Daya', 'description' => 'Sumber daya darurat ponsel untuk komunikasi status darurat.', 'sort_order' => 11, 'is_essential' => true],
            // Proteksi
            ['category' => 'proteksi', 'name' => 'Jas Hujan / Ponco & Selimut Termal Aluminium', 'description' => 'Menjaga suhu tubuh dari hipotermia saat evakuasi di tengah hujan lebat malam hari.', 'sort_order' => 12, 'is_essential' => true],
            ['category' => 'proteksi', 'name' => 'Pakaian Ganti (1 Pasang) & Pakaian Dalam', 'description' => 'Pakaian berbahan cepat kering di tempat penampungan sementara.', 'sort_order' => 13, 'is_essential' => false],
        ];

        foreach ($items as $it) {
            PreparednessChecklistItem::updateOrCreate(
                ['name' => $it['name']],
                $it
            );
        }
    }

    /**
     * Seed Interactive Preparedness Scenarios & Action Choices.
     */
    private function seedEmergencyScenarios(): void
    {
        $floodType = HazardType::where('slug', 'flood')->first();
        $earthquakeType = HazardType::where('slug', 'earthquake')->first();

        // Skenario 1: Gempa Bumi
        $scen1 = EmergencyScenario::updateOrCreate(
            ['slug' => 'skenario-gempa-rumah'],
            [
                'hazard_type_id' => $earthquakeType?->id,
                'title' => 'Guncangan Gempa Mendadak Saat Berada di Rumah',
                'difficulty' => 'pemula',
                'description' => 'Uji respon refleks dan keselamatan Anda ketika merasakan getaran gempa tektonik kuat di dalam rumah tinggal.',
                'context_brief' => 'Pukul 14.30 WIB, Anda sedang berada di ruang keluarga rumah lantai 1. Tiba-tiba lampu gantung bergoyang kencang dan dinding berderit kuat. Guncangan awal terasa keras selama 15 detik.',
                'estimated_minutes' => 5,
                'is_active' => true,
            ]
        );

        $q1 = [
            [
                'question' => 'Apa tindakan keselamatan pertama yang paling tepat Anda lakukan pada detik-detik awal guncangan?',
                'points' => 10,
                'sort_order' => 1,
                'options' => [
                    ['id' => 'A', 'text' => 'Langsung berlari kencang menerobos pintu keluar menuju jalan.', 'is_correct' => false, 'explanation' => 'Berlari saat guncangan aktif berisiko tinggi jatuh atau tertimpa pecahan kaca/genteng dari atap.'],
                    ['id' => 'B', 'text' => 'Lakukan Drop, Cover, Hold On (Berlutut, Lindungi Kepala di Bawah Meja Kokoh).', 'is_correct' => true, 'explanation' => 'Prinsip standar keselamatan dunia adalah melindungi kepala dan leher di bawah meja kokoh serta memegangi kakinya sampai guncangan reda.'],
                    ['id' => 'C', 'text' => 'Berdiri di tengah ruangan sambil merekam video menggunakan ponsel.', 'is_correct' => false, 'explanation' => 'Sangat berbahaya dan menunda langkah penyelamatan diri vital.'],
                ],
            ],
            [
                'question' => 'Setelah guncangan utama gempa berhenti, apa langkah prioritas Anda berikutnya?',
                'points' => 10,
                'sort_order' => 2,
                'options' => [
                    ['id' => 'A', 'text' => 'Matikan kompor/gas dan sakelar listrik utama, ambil Tas Siaga, lalu keluar tertib ke ruang terbuka.', 'is_correct' => true, 'explanation' => 'Mencegah potensi kebakaran sekunder akibat kebocoran gas/korsleting listrik dan evakuasi ke titik kumpul aman.'],
                    ['id' => 'B', 'text' => 'Segera menyalakan korek api untuk memeriksa sudut ruangan yang gelap.', 'is_correct' => false, 'explanation' => 'Menyalakan api sangat berbahaya jika ada kebocoran pipa gas elpiji yang tidak tercium.'],
                    ['id' => 'C', 'text' => 'Kembali tidur karena merasa bahaya sudah lewat.', 'is_correct' => false, 'explanation' => 'Gempa susulan sering terjadi beberapa menit setelah gempa utama.'],
                ],
            ],
        ];

        foreach ($q1 as $qData) {
            ScenarioQuestion::updateOrCreate(
                ['scenario_id' => $scen1->id, 'sort_order' => $qData['sort_order']],
                $qData
            );
        }

        // Skenario 2: Banjir Luapan
        $scen2 = EmergencyScenario::updateOrCreate(
            ['slug' => 'skenario-banjir-luapan-sungai'],
            [
                'hazard_type_id' => $floodType?->id,
                'title' => 'Peringatan Dini Kenaikan Muka Air Sungai Hilir',
                'difficulty' => 'menengah',
                'description' => 'Kesiapsiagaan menghadapi luapan air sungai yang meningkat bertahap pada musim hujan lebat.',
                'context_brief' => 'Sirine pos pemantau debit air berbunyi tanda Siaga 2. Genangan air mulai masuk ke pekarangan rumah setinggi 20 cm dan terus bertambah.',
                'estimated_minutes' => 5,
                'is_active' => true,
            ]
        );

        $q2 = [
            [
                'question' => 'Sebelum genangan mencapai stopkontak listrik, tindakan preventif apa yang wajib segera diselesaikan?',
                'points' => 10,
                'sort_order' => 1,
                'options' => [
                    ['id' => 'A', 'text' => 'Putuskan Miniature Circuit Breaker (MCB) di meteran listrik utama rumah.', 'is_correct' => true, 'explanation' => 'Mencegah bahaya sengatan arus listrik fatal yang merambat melalui media air genangan.'],
                    ['id' => 'B', 'text' => 'Memompa air keluar menggunakan pompa listrik portable tanpa pelindung.', 'is_correct' => false, 'explanation' => 'Mengoperasikan alat listrik di tengah genangan basah tanpa isolasi berisiko tersetrum.'],
                    ['id' => 'C', 'text' => 'Mengabaikannya karena menganggap air tidak akan naik lebih tinggi.', 'is_correct' => false, 'explanation' => 'Sikap pasif membahayakan seluruh penghuni rumah.'],
                ],
            ],
        ];

        foreach ($q2 as $qData) {
            ScenarioQuestion::updateOrCreate(
                ['scenario_id' => $scen2->id, 'sort_order' => $qData['sort_order']],
                $qData
            );
        }
    }

    /**
     * Seed Educational Mitigation & Preparedness Content.
     */
    private function seedEducationContents(): void
    {
        $floodType = HazardType::where('slug', 'flood')->first();
        $earthquakeType = HazardType::where('slug', 'earthquake')->first();

        $contents = [
            [
                'hazard_type_id' => $floodType?->id,
                'title' => 'Panduan Tanggap Darurat & Mitigasi Banjir Luapan',
                'slug' => 'panduan-tanggap-darurat-banjir-luapan',
                'category' => 'mitigasi',
                'summary' => 'Langkah-langkah terstruktur sebelum, saat, dan sesudah banjir melanda kawasan pemukiman warga.',
                'content_body' => "## Sebelum Banjir\n- Simpan dokumen penting dalam kantong plastik kedap air.\n- Ketahui jalur evakuasi dan lokasi posko pengungsian terdekat.\n- Amankan instalasi listrik dan letakkan perabotan penting di tempat lebih tinggi.\n\n## Saat Banjir\n- Matikan sakelar meteran listrik utama (MCB).\n- Segera evakuasi ke tempat tinggi atau posko aman saat air mulai naik.\n- Jangan berjalan atau mengemudikan kendaraan menerobos arus air deras (arus setinggi 15 cm sudah mampu menjatuhkan orang dewasa).\n\n## Sesudah Banjir\n- Waspadai kabel listrik yang terendam atau binatang berbisa yang terbawa arus.\n- Bersihkan perabot dan lantai rumah menggunakan cairan desinfektan sebelum dihuni kembali.",
                'content_type' => 'article',
                'is_published' => true,
                'published_at' => now(),
                'sort_order' => 1,
            ],
            [
                'hazard_type_id' => $earthquakeType?->id,
                'title' => 'Protokol Evakuasi Mandiri Saat Terjadi Gempa Bumi Tektonik',
                'slug' => 'protokol-evakuasi-mandiri-gempa-bumi',
                'category' => 'kesiapsiagaan',
                'summary' => 'Refleks penyelamatan diri efektif di dalam rumah, gedung bertingkat, maupun area luar ruangan.',
                'content_body' => "## Di Dalam Ruangan\n- Jangan panik dan jangan berlari berebut pintu.\n- Terapkan Drop, Cover, Hold On di bawah meja yang kuat.\n- Jauhi jendela kaca, cermin, dan lemari yang belum tertambat ke dinding.\n\n## Di Luar Ruangan\n- Jauhi tiang listrik, papan reklame, pohon tinggi, dan dinding bata rapuh.\n- Cari lapangan terbuka dan lindungi kepala menggunakan tas siaga atau tangan.\n\n## Pasca Guncangan\n- Matikan api kompor dan gas.\n- Keluar tertib melalui tangga darurat (jangan pernah gunakan lift).\n- Pantau informasi resmi hanya dari BMKG atau BNPB melalui platform SENTRAVAX.",
                'content_type' => 'article',
                'is_published' => true,
                'published_at' => now(),
                'sort_order' => 2,
            ],
        ];

        foreach ($contents as $c) {
            EducationContent::updateOrCreate(
                ['slug' => $c['slug']],
                $c
            );
        }
    }

    /**
     * Seed Active Alerts and Regional Risk Assessments.
     */
    private function seedAlertsAndRiskAssessments(): void
    {
        $floodType = HazardType::where('slug', 'flood')->first();
        $bmkgSource = DataSource::first();
        $regionEast = Region::where('code', 'ID-JK-JT')->first();
        $floodEvent = HazardEvent::where('hazard_type_id', $floodType?->id)->first();
        $admin = User::where('role', User::ROLE_ADMIN)->first();

        if ($floodType && $regionEast) {
            // Seed Alert
            Alert::updateOrCreate(
                ['title' => 'Peringatan Siaga 2 Luapan Sungai Ciliwung Hilir'],
                [
                    'hazard_event_id' => $floodEvent?->id,
                    'region_id' => $regionEast->id,
                    'hazard_type_id' => $floodType->id,
                    'created_by' => $admin?->id,
                    'message' => 'Status kenaikan tinggi muka air di pintu air hilir mencapai 210 cm (Siaga 2). Warga bantaran sungai diminta meningkatkan kewaspadaan banjir genangan.',
                    'alert_class' => 'official_warning',
                    'broadcast_level' => 'warning',
                    'status' => 'active',
                    'starts_at' => now()->subHours(2),
                    'expires_at' => now()->addHours(12),
                ]
            );

            // Seed Risk Assessment
            $riskAssessment = RiskAssessment::updateOrCreate(
                ['region_id' => $regionEast->id, 'hazard_type_id' => $floodType->id],
                [
                    'hazard_event_id' => $floodEvent?->id,
                    'title' => 'Penilaian Kerentanan Banjir Luapan Jakarta Timur',
                    'risk_level' => 'high',
                    'risk_score' => 78.50,
                    'methodology_version' => 'v1.0-rules',
                    'impact_radius_meters' => 2500,
                    'affected_population_estimate' => 42150,
                    'calculation_factors' => [
                        'rainfall_intensity_mm' => 110,
                        'river_water_level_cm' => 210,
                        'slope_vulnerability' => 'low',
                        'population_exposure' => 'dense',
                        'historical_frequency' => 'high',
                    ],
                    'assessed_at' => now(),
                ]
            );

            // Seed AI Insight
            AiInsight::updateOrCreate(
                ['title' => 'Proyeksi Kenaikan Genangan DAS Ciliwung 6 Jam Ke Depan'],
                [
                    'risk_assessment_id' => $riskAssessment->id,
                    'region_id' => $regionEast->id,
                    'hazard_type_id' => $floodType->id,
                    'insight_type' => 'risk_analysis',
                    'summary' => 'Kombinasi curah hujan intensitas 110 mm/hari di kawasan hulu dan kenaikan muka air 210 cm mengindikasikan potensi luapan air mencapai kawasan pemukiman dalam radius 300 meter dari sempadan sungai.',
                    'recommendations' => [
                        'Evakuasi mandiri dokumen berharga ke lantai 2 atau tas siaga.',
                        'Simpan nomor kontak posko darurat kelurahan terdekat.',
                        'Lakukan pemadaman sakelar listrik rumah jika genangan memasuki pekarangan.',
                    ],
                    'confidence_score' => 0.920,
                    'generation_mode' => 'rule_based',
                    'evidence' => [
                        'sensor_node' => 'Ciliwung-Hilir-04',
                        'water_level_threshold_exceeded' => true,
                    ],
                ]
            );
        }

        // Seed Ingestion sync run
        if ($bmkgSource) {
            DataSourceSyncRun::create([
                'data_source_id' => $bmkgSource->id,
                'status' => 'SUCCESS',
                'freshness_state' => 'LIVE',
                'items_fetched' => 4,
                'items_persisted' => 4,
                'duration_ms' => 340,
                'provenance_metadata' => ['api_version' => 'v1.2', 'source' => 'BMKG Open Data'],
                'synced_at' => now()->subMinutes(10),
            ]);
        }
    }

    /**
     * Seed Sample User Preparedness Plan for the development user account.
     */
    private function seedSampleUserPreparedness(): void
    {
        $user = User::where('email', 'user@sentravax.id')->first();
        $bekasi = Region::where('code', 'ID-JB-BKS')->first();

        if ($user && $bekasi) {
            // Save preferred region
            UserSavedRegion::updateOrCreate(
                ['user_id' => $user->id, 'region_id' => $bekasi->id],
                ['label' => 'Rumah Tinggal', 'is_primary' => true, 'notify_alerts' => true]
            );

            // Preparedness Plan
            PreparednessPlan::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'title' => 'Rencana Kesiapsiagaan Keluarga Slamet Riyadi',
                    'primary_meeting_point' => 'Balai Warga RW 08 Kelurahan Harapan Baru',
                    'secondary_meeting_point' => 'Halaman Masjid Al-Muhajirin Kompleks',
                    'evacuation_notes' => 'Ibu mertua berusia 68 tahun memerlukan bantuan jalan dan obat tensi rutin. Tas siaga diletakkan di lemari depan.',
                    'custom_provisions' => ['Susu formula anak', 'Dokumen tanah sertifikat asli'],
                ]
            );

            // Preparedness Contacts
            PreparednessContact::updateOrCreate(
                ['user_id' => $user->id, 'phone_number' => '081298765432'],
                ['name' => 'Siti Aminah', 'relationship' => 'Istri', 'is_emergency_priority' => true]
            );
            PreparednessContact::updateOrCreate(
                ['user_id' => $user->id, 'phone_number' => '081387654321'],
                ['name' => 'Bambang Sudibyo (Ketua RT 04)', 'relationship' => 'Pengurus Lingkungan', 'is_emergency_priority' => true]
            );

            // Check off a few checklist items
            $docItem = PreparednessChecklistItem::where('category', 'dokumen')->first();
            if ($docItem) {
                \App\Models\PreparednessChecklistProgress::updateOrCreate(
                    ['user_id' => $user->id, 'checklist_item_id' => $docItem->id],
                    ['is_completed' => true, 'completed_at' => now()]
                );
            }
        }
    }
}

