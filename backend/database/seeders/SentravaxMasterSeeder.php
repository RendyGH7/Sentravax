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
use App\Models\Shelter;
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
        $this->seedShelters();
        $this->seedSampleUserPreparedness();
        $this->seedBaselineCommunityReports();
        $this->syncPostgresSequences();
    }

    /**
     * Synchronize PostgreSQL auto-increment sequences to max(id) to prevent primary key collision.
     */
    private function syncPostgresSequences(): void
    {
        $tables = ['ai_insights', 'risk_assessments', 'shelters', 'community_reports', 'data_sources', 'hazard_events'];
        foreach ($tables as $t) {
            $seq = DB::selectOne("SELECT pg_get_serial_sequence('{$t}', 'id') as seq_name");
            if ($seq && $seq->seq_name) {
                $maxId = DB::table($t)->max('id') ?? 1;
                DB::statement("SELECT setval('{$seq->seq_name}', {$maxId})");
            }
        }
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
            $existing = User::where('email', $userData['email'])->first();
            if (! $existing) {
                User::create(array_merge($userData, ['password' => $defaultPassword]));
            }
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
            if (! HazardType::where('slug', $hz['slug'])->exists()) {
                HazardType::create($hz);
            }
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
                'status' => 'pending',
                'sync_interval_minutes' => 15,
                'rate_limit_rpm' => 60,
                'terms_of_service' => 'BMKG Open Data Policy - Attribution Required',
                'is_simulated' => false,
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Sumber resmi pengamatan radar cuaca nasional dan prakiraan peringatan dini cuaca ekstrem.',
                'metadata' => [
                    'docs_url' => 'https://data.bmkg.go.id',
                    'contact' => 'pusdatin@bmkg.go.id',
                    'freshness_threshold_minutes' => 60,
                ],
            ],
            [
                'name' => 'BMKG TEWS Open Data API',
                'provider' => 'Badan Meteorologi, Klimatologi, dan Geofisika',
                'source_type' => 'api',
                'category' => 'seismology',
                'endpoint_url' => 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
                'status' => 'pending',
                'sync_interval_minutes' => 5,
                'rate_limit_rpm' => 120,
                'terms_of_service' => 'InaTEWS Open Public Protocol - Realtime Seismic Stream',
                'is_simulated' => false,
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Layanan real-time Indonesia Tsunami Early Warning System (InaTEWS) BMKG untuk pengamatan gempa bumi terkini.',
                'metadata' => [
                    'docs_url' => 'https://data.bmkg.go.id/gempabumi',
                    'contact' => 'inatews@bmkg.go.id',
                    'freshness_threshold_minutes' => 30,
                ],
            ],
            [
                'name' => 'PVMBG Geological & Volcanic Stream',
                'provider' => 'Pusat Vulkanologi dan Mitigasi Bencana Geologi',
                'source_type' => 'stream',
                'category' => 'geology',
                'endpoint_url' => 'https://magma.vsi.esdm.go.id/api/v1',
                'status' => 'pending',
                'sync_interval_minutes' => 30,
                'rate_limit_rpm' => 60,
                'terms_of_service' => 'MAGMA Indonesia Open API Policy',
                'is_simulated' => false,
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Pemantauan deformasi lereng, status gunung api, dan zona kerentanan gerakan tanah.',
                'metadata' => [
                    'docs_url' => 'https://magma.esdm.go.id',
                    'contact' => 'pvmbg@esdm.go.id',
                    'freshness_threshold_minutes' => 180,
                ],
            ],
            [
                'name' => 'InSAR Sentinel-1 Ground Deformation',
                'provider' => 'European Space Agency (ESA) Copernicus',
                'source_type' => 'satellite',
                'category' => 'satellite',
                'endpoint_url' => 'https://dataspace.copernicus.eu/api',
                'status' => 'pending',
                'sync_interval_minutes' => 720,
                'rate_limit_rpm' => 30,
                'terms_of_service' => 'Copernicus Open Access Hub Terms of Use',
                'is_simulated' => false,
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Citra radar sintetis untuk deteksi penurunan tanah (land subsidence) dan akumulasi elevasi basah.',
                'metadata' => [
                    'docs_url' => 'https://dataspace.copernicus.eu',
                    'contact' => 'eosupport@copernicus.eu',
                    'freshness_threshold_minutes' => 1440,
                ],
            ],
            [
                'name' => 'Data Observasi Terkurasi SENTRAVAX',
                'provider' => 'SENTRAVAX Local Baseline Observation',
                'source_type' => 'curated',
                'category' => 'curated',
                'endpoint_url' => 'https://sentravax.id/data/curated-baseline',
                'status' => 'active',
                'sync_interval_minutes' => 1440,
                'rate_limit_rpm' => 300,
                'terms_of_service' => 'SENTRAVAX Internal Benchmark & Demonstration License',
                'is_simulated' => true,
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Katalog observasi kejadian bencana lokal terkurasi untuk pengujian kesiapsiagaan dan analisis wilayah.',
                'metadata' => [
                    'docs_url' => 'https://sentravax.id/docs/data-baseline',
                    'contact' => 'intel@sentravax.go.id',
                    'freshness_threshold_minutes' => 2880,
                    'simulation_tag' => 'DEMONSTRATION_CURATED_DATA',
                ],
            ],
            [
                'name' => 'BMKG Common Alerting Protocol (CAP) Inbound Feed',
                'provider' => 'Badan Meteorologi, Klimatologi, dan Geofisika',
                'source_type' => 'cap',
                'category' => 'warning',
                'endpoint_url' => 'https://www.bmkg.go.id/alerts/nowcast/id',
                'status' => 'active',
                'sync_interval_minutes' => 5,
                'rate_limit_rpm' => 60,
                'terms_of_service' => 'Data Terbuka BMKG (UU No. 31/2009 tentang Meteorologi, Klimatologi, dan Geofisika)',
                'is_simulated' => false,
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Feed resmi peringatan dini cuaca ekstrem dan bencana hidrometeorologis nasional dalam standar OASIS CAP v1.2.',
                'metadata' => [
                    'docs_url' => 'https://www.bmkg.go.id/alerts/nowcast/id',
                    'contact' => 'cuaca.ekstrem@bmkg.go.id',
                    'freshness_threshold_minutes' => 30,
                    'protocol_standard' => 'OASIS CAP v1.2 / ITU-T X.1303',
                ],
            ],
        ];

        foreach ($sources as $src) {
            if (! DataSource::where('name', $src['name'])->exists()) {
                DataSource::create($src);
            }
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
            $reg = Region::where('code', $r['code'])->first();
            if (! $reg) {
                $reg = Region::create([
                    'code' => $r['code'],
                    'name' => $r['name'],
                    'level' => $r['level'],
                ]);

                // Update PostGIS Point using ST_SetSRID and ST_MakePoint(lon, lat)
                DB::statement('
                    UPDATE regions 
                    SET center_point = ST_SetSRID(ST_MakePoint(?, ?), 4326)
                    WHERE id = ?
                ', [$r['lon'], $r['lat'], $reg->id]);
            }
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
        $earthquakeType = HazardType::where('slug', 'earthquake')->first();

        // Dynamically resolve BMKG TEWS Data Source strictly by unique endpoint or unique name
        $bmkgTewsSource = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first()
            ?? DataSource::where('name', 'BMKG TEWS Open Data API')->first();

        if (! $bmkgTewsSource) {
            $bmkgTewsSource = DataSource::create([
                'name' => 'BMKG TEWS Open Data API',
                'provider' => 'Badan Meteorologi, Klimatologi, dan Geofisika',
                'source_type' => 'api',
                'category' => 'seismology',
                'endpoint_url' => 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
                'status' => 'pending',
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Layanan real-time Indonesia Tsunami Early Warning System (InaTEWS) BMKG untuk pengamatan gempa bumi terkini.',
            ]);
        }

        // Dynamically resolve Curated Data Source strictly by unique name or unique curated endpoint
        $curatedSource = DataSource::where('name', 'Data Observasi Terkurasi SENTRAVAX')->first()
            ?? DataSource::where('endpoint_url', 'https://sentravax.id/data/curated-baseline')->first();

        if (! $curatedSource) {
            $curatedSource = DataSource::create([
                'name' => 'Data Observasi Terkurasi SENTRAVAX',
                'provider' => 'SENTRAVAX Local Baseline Observation',
                'source_type' => 'curated',
                'category' => 'curated',
                'endpoint_url' => 'https://sentravax.id/data/curated-baseline',
                'status' => 'active',
                'last_fetched_at' => null,
                'last_successful_at' => null,
                'notes' => 'Katalog observasi kejadian bencana lokal terkurasi untuk pengujian kesiapsiagaan dan analisis wilayah.',
            ]);
        }

        $regionNorth = Region::where('code', 'ID-JK-JU')->first();
        $regionEast = Region::where('code', 'ID-JK-JT')->first();
        $regionBogor = Region::where('code', 'ID-JB-BGR')->first();
        $regionBanten = Region::where('code', 'ID-BT-ANY')->first();

        if (! $floodType || ! $bmkgTewsSource || ! $regionNorth) {
            return;
        }

        $events = [
            [
                'title' => 'Banjir Luapan Sungai Ciliwung dan Genangan Pemukiman',
                'description' => 'Kenaikan debit air sungai mencapai status Siaga 2 menyusul hujan intensitas tinggi di kawasan hulu. Genangan air 40-70 cm dilaporkan di beberapa rukun warga hilir.',
                'hazard_type_id' => $floodType->id,
                'data_source_id' => $curatedSource->id,
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
                'data_source_id' => $curatedSource->id,
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
                'data_source_id' => $curatedSource->id,
                'region_id' => $regionBogor?->id,
                'severity' => 'high',
                'status' => 'active',
                'occurred_at' => now()->subHours(6),
                'reported_at' => now()->subHours(5),
                'lon' => 106.9744,
                'lat' => -6.6972,
                'source_metadata' => ['slope_gradient_deg' => 38, 'saturation_pct' => 88],
            ],
            [
                'title' => 'Gempa Bumi Mag 4.1 Pusat gempa berada di laut 24 km selatan Enggano',
                'description' => 'Kedalaman: 24 km. Potensi: Gempa ini dirasakan untuk diteruskan pada masyarakat.',
                'hazard_type_id' => $earthquakeType?->id ?? $floodType->id,
                'data_source_id' => $bmkgTewsSource->id,
                'region_id' => $regionBanten?->id,
                'severity' => 'low',
                'status' => 'active',
                'occurred_at' => now()->subHours(2),
                'reported_at' => now()->subHours(2),
                'lon' => 102.24,
                'lat' => -5.56,
                'source_metadata' => [
                    'Jam' => '14:31:39 WIB',
                    'Bujur' => '102.24 BT',
                    'Lintang' => '5.56 LS',
                    'Potensi' => 'Gempa ini dirasakan untuk diteruskan pada masyarakat',
                    'Tanggal' => now()->format('d M Y'),
                    'Wilayah' => 'Pusat gempa berada di laut 24 km selatan Enggano',
                    'DateTime' => now()->subHours(2)->toIso8601String(),
                    'Shakemap' => '20261113143139.mmi.jpg',
                    'Dirasakan' => 'II - III Enggano',
                    'Kedalaman' => '24 km',
                    'Magnitude' => '4.1',
                    'Coordinates' => '-5.56,102.24',
                ],
            ],
        ];

        foreach ($events as $ev) {
            $event = HazardEvent::where('title', $ev['title'])->first();
            if (! $event) {
                $event = HazardEvent::create([
                    'title' => $ev['title'],
                    'description' => $ev['description'],
                    'hazard_type_id' => $ev['hazard_type_id'],
                    'data_source_id' => $ev['data_source_id'],
                    'region_id' => $ev['region_id'],
                    'severity' => $ev['severity'],
                    'status' => $ev['status'],
                    'occurred_at' => $ev['occurred_at'],
                    'reported_at' => $ev['reported_at'],
                    'source_metadata' => $ev['source_metadata'],
                ]);

                DB::statement('
                    UPDATE hazard_events 
                    SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)
                    WHERE id = ?
                ', [$ev['lon'], $ev['lat'], $event->id]);
            }
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
            if (! PreparednessChecklistItem::where('name', $it['name'])->exists()) {
                PreparednessChecklistItem::create($it);
            }
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
        $scen1 = EmergencyScenario::where('slug', 'skenario-gempa-rumah')->first();
        if (! $scen1) {
            $scen1 = EmergencyScenario::create([
                'slug' => 'skenario-gempa-rumah',
                'hazard_type_id' => $earthquakeType?->id,
                'title' => 'Guncangan Gempa Mendadak Saat Berada di Rumah',
                'difficulty' => 'pemula',
                'description' => 'Uji respon refleks dan keselamatan Anda ketika merasakan getaran gempa tektonik kuat di dalam rumah tinggal.',
                'context_brief' => 'Pukul 14.30 WIB, Anda sedang berada di ruang keluarga rumah lantai 1. Tiba-tiba lampu gantung bergoyang kencang dan dinding berderit kuat. Guncangan awal terasa keras selama 15 detik.',
                'estimated_minutes' => 5,
                'is_active' => true,
            ]);

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
                ScenarioQuestion::create(array_merge($qData, ['scenario_id' => $scen1->id]));
            }
        }

        // Skenario 2: Banjir Luapan
        $scen2 = EmergencyScenario::where('slug', 'skenario-banjir-luapan-sungai')->first();
        if (! $scen2) {
            $scen2 = EmergencyScenario::create([
                'slug' => 'skenario-banjir-luapan-sungai',
                'hazard_type_id' => $floodType?->id,
                'title' => 'Peringatan Dini Kenaikan Muka Air Sungai Hilir',
                'difficulty' => 'menengah',
                'description' => 'Kesiapsiagaan menghadapi luapan air sungai yang meningkat bertahap pada musim hujan lebat.',
                'context_brief' => 'Sirine pos pemantau debit air berbunyi tanda Siaga 2. Genangan air mulai masuk ke pekarangan rumah setinggi 20 cm dan terus bertambah.',
                'estimated_minutes' => 5,
                'is_active' => true,
            ]);

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
                ScenarioQuestion::create(array_merge($qData, ['scenario_id' => $scen2->id]));
            }
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
            if (! EducationContent::where('slug', $c['slug'])->exists()) {
                EducationContent::create($c);
            }
        }
    }

    /**
     * Seed Active Alerts and Regional Risk Assessments.
     */
    private function seedAlertsAndRiskAssessments(): void
    {
        $floodType = HazardType::where('slug', 'flood')->first();
        $bmkgTewsSource = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first()
            ?? DataSource::where('name', 'BMKG TEWS Open Data API')->first();
        $regionEast = Region::where('code', 'ID-JK-JT')->first();
        $floodEvent = HazardEvent::where('hazard_type_id', $floodType?->id)->first();
        $admin = User::where('role', User::ROLE_ADMIN)->first();

        $regionDki = Region::where('code', 'ID-JK')->first();
        $coastalType = HazardType::where('slug', 'coastal_flood')->first() ?? $floodType;

        if ($floodType && $regionEast) {
            // Seed Alert 1
            if (!Alert::where('title', 'Peringatan Siaga 2 Luapan Sungai Ciliwung Hilir')->exists()) {
                Alert::create([
                    'title' => 'Peringatan Siaga 2 Luapan Sungai Ciliwung Hilir',
                    'hazard_event_id' => $floodEvent?->id,
                    'region_id' => $regionEast->id,
                    'hazard_type_id' => $floodType->id,
                    'created_by' => $admin?->id,
                    'message' => 'Status kenaikan tinggi muka air di pintu air hilir mencapai 210 cm (Siaga 2). Warga bantaran sungai diminta meningkatkan kewaspadaan banjir genangan.',
                    'alert_class' => 'official_warning',
                    'broadcast_level' => 'warning',
                    'status' => 'active',
                    'starts_at' => now()->subHours(2),
                    'expires_at' => now()->addDays(7),
                ]);
            }

            // Seed Alert 2 & 3
            if ($regionDki) {
                if (!Alert::where('title', 'PERINGATAN DINI: Potensi Gelombang Pasang & Banjir Rob Pesisir')->exists()) {
                    Alert::create([
                        'title' => 'PERINGATAN DINI: Potensi Gelombang Pasang & Banjir Rob Pesisir',
                        'hazard_event_id' => null,
                        'region_id' => $regionDki->id,
                        'hazard_type_id' => $coastalType?->id,
                        'created_by' => $admin?->id,
                        'message' => 'Fase bulan baru memicu potensi pasang maksimum air laut di kawasan pesisir utara Jakarta. Waspada banjir rob 30-50 cm.',
                        'alert_class' => 'official_warning',
                        'broadcast_level' => 'regional',
                        'status' => 'active',
                        'starts_at' => now()->subHours(1),
                        'expires_at' => now()->addDays(7),
                    ]);
                }

                if (!Alert::where('title', 'DISSEMINASI CAP: Siaga Banjir Luapan DAS Ciliwung Hilir')->exists()) {
                    Alert::create([
                        'title' => 'DISSEMINASI CAP: Siaga Banjir Luapan DAS Ciliwung Hilir',
                        'hazard_event_id' => $floodEvent?->id,
                        'region_id' => $regionDki->id,
                        'hazard_type_id' => $floodType->id,
                        'created_by' => $admin?->id,
                        'message' => 'Protokol Common Alerting Protocol (CAP) aktif: debit kiriman hulu terdeteksi tinggi di pos pantau Depok dan Manggarai.',
                        'alert_class' => 'official_warning',
                        'broadcast_level' => 'regional',
                        'status' => 'active',
                        'starts_at' => now()->subHours(1),
                        'expires_at' => now()->addDays(7),
                    ]);
                }
            }

            // Seed Risk Assessment 1 (Baseline)
            $riskAssessment = RiskAssessment::where('id', 1)->first()
                ?? RiskAssessment::where('region_id', $regionEast->id)->where('hazard_type_id', $floodType->id)->first();

            if (! $riskAssessment) {
                DB::table('risk_assessments')->insert([
                    'id' => 1,
                    'region_id' => $regionEast->id,
                    'hazard_type_id' => $floodType->id,
                    'hazard_event_id' => $floodEvent?->id,
                    'title' => 'Penilaian Kerentanan Banjir Luapan Jakarta Timur',
                    'risk_level' => 'high',
                    'risk_score' => 78.50,
                    'methodology_version' => 'v1.0-rules',
                    'impact_radius_meters' => 2500,
                    'affected_population_estimate' => 42150,
                    'calculation_factors' => json_encode([
                        'rainfall_intensity_mm' => 110,
                        'river_water_level_cm' => 210,
                        'slope_vulnerability' => 'low',
                        'population_exposure' => 'dense',
                        'historical_frequency' => 'high',
                    ]),
                    'assessed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $riskAssessment = RiskAssessment::find(1);
            }

            // Seed AI Insight 1 (Baseline)
            if (! DB::table('ai_insights')->where('id', 1)->exists()) {
                DB::table('ai_insights')->insert([
                    'id' => 1,
                    'title' => 'Proyeksi Kenaikan Genangan DAS Ciliwung 6 Jam Ke Depan',
                    'risk_assessment_id' => $riskAssessment->id,
                    'region_id' => $regionEast->id,
                    'hazard_type_id' => $floodType->id,
                    'insight_type' => 'risk_analysis',
                    'summary' => 'Kombinasi curah hujan intensitas 110 mm/hari di kawasan hulu dan kenaikan muka air 210 cm mengindikasikan potensi luapan air mencapai kawasan pemukiman dalam radius 300 meter dari sempadan sungai.',
                    'recommendations' => json_encode([
                        'Evakuasi mandiri dokumen berharga ke lantai 2 atau tas siaga.',
                        'Simpan nomor kontak posko darurat kelurahan terdekat.',
                        'Lakukan pemadaman sakelar listrik rumah jika genangan memasuki pekarangan.',
                    ]),
                    'confidence_score' => 0.920,
                    'generation_mode' => 'rule_based',
                    'evidence' => json_encode([
                        'sensor_node' => 'Ciliwung-Hilir-04',
                        'water_level_threshold_exceeded' => true,
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
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
            if (! UserSavedRegion::where('user_id', $user->id)->where('region_id', $bekasi->id)->exists()) {
                UserSavedRegion::create([
                    'user_id' => $user->id,
                    'region_id' => $bekasi->id,
                    'label' => 'Rumah Tinggal',
                    'is_primary' => true,
                    'notify_alerts' => true,
                ]);
            }

            // Preparedness Plan
            if (! PreparednessPlan::where('user_id', $user->id)->exists()) {
                PreparednessPlan::create([
                    'user_id' => $user->id,
                    'title' => 'Rencana Kesiapsiagaan Keluarga Slamet Riyadi',
                    'primary_meeting_point' => 'Balai Warga RW 08 Kelurahan Harapan Baru',
                    'secondary_meeting_point' => 'Halaman Masjid Al-Muhajirin Kompleks',
                    'evacuation_notes' => 'Ibu mertua berusia 68 tahun memerlukan bantuan jalan dan obat tensi rutin. Tas siaga diletakkan di lemari depan.',
                    'custom_provisions' => ['Susu formula anak', 'Dokumen tanah sertifikat asli'],
                ]);
            }

            // Preparedness Contacts
            if (! PreparednessContact::where('user_id', $user->id)->where('phone_number', '081298765432')->exists()) {
                PreparednessContact::create([
                    'user_id' => $user->id,
                    'phone_number' => '081298765432',
                    'name' => 'Siti Aminah',
                    'relationship' => 'Istri',
                    'is_emergency_priority' => true,
                ]);
            }
            if (! PreparednessContact::where('user_id', $user->id)->where('phone_number', '081387654321')->exists()) {
                PreparednessContact::create([
                    'user_id' => $user->id,
                    'phone_number' => '081387654321',
                    'name' => 'Bambang Sudibyo (Ketua RT 04)',
                    'relationship' => 'Pengurus Lingkungan',
                    'is_emergency_priority' => true,
                ]);
            }

            // Check off a few checklist items
            $docItem = PreparednessChecklistItem::where('category', 'dokumen')->first();
            if ($docItem && ! \App\Models\PreparednessChecklistProgress::where('user_id', $user->id)->where('checklist_item_id', $docItem->id)->exists()) {
                \App\Models\PreparednessChecklistProgress::create([
                    'user_id' => $user->id,
                    'checklist_item_id' => $docItem->id,
                    'is_completed' => true,
                    'completed_at' => now(),
                ]);
            }
        }
    }

    /**
     * Seed Verified Official Shelters & Assembly Points.
     */
    private function seedShelters(): void
    {
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $regionJkt = Region::where('code', 'ID-JK')->first();
        $regionJktEast = Region::where('code', 'ID-JK-JT')->first() ?? $regionJkt;
        $regionJbr = Region::where('code', 'ID-JB')->first();

        $shelters = [
            [
                'name' => 'Gelanggang Remaja Jakarta Timur (GOR Otista)',
                'facility_type' => 'community_hall',
                'address' => 'Jl. Otto Iskandardinata No. 121, Bidara Cina, Jatinegara, Jakarta Timur',
                'region_id' => $regionJktEast?->id,
                'latitude' => -6.236111,
                'longitude' => 106.867222,
                'capacity' => 1200,
                'current_occupancy' => 45,
                'has_sanitation' => true,
                'sanitation_details' => '8 unit MCK permanen, 4 toren air darurat kapasitas 5000L, posko cuci tangan',
                'wheelchair_accessible' => true,
                'elderly_friendly' => true,
                'contact_person' => 'Pusdalops BPBD Jakarta Timur',
                'contact_phone' => '021-8192000',
                'operational_status' => 'open',
                'verification_status' => 'VERIFIED',
                'verified_at' => '2026-11-18 08:00:00',
                'verified_by_agency' => 'BPBD Provinsi DKI Jakarta',
                'source_name' => 'Katalog Posko Evakuasi Bencana Banjir BPBD DKI Jakarta',
                'source_url' => 'https://bpbd.jakarta.go.id/posko-evakuasi',
                'evacuation_route_info' => [
                    'has_official_route' => true,
                    'route_code' => 'EVAC-JKT-OTISTA-01',
                    'corridor_name' => 'Koridor Jl. Otto Iskandardinata - GOR Otista',
                    'status' => 'AVAILABLE',
                    'verified_at' => '2026-11-18T08:00:00+07:00',
                    'authority' => 'BPBD Provinsi DKI Jakarta & Dishub DKI',
                    'safety_guidance' => 'Akses jalan utama melalui Jl. Otista bebas genangan saat ketinggian air DAS Ciliwung Siaga 2. Gunakan lajur timur.',
                ],
                'provenance_metadata' => [
                    'verified_by' => 'BPBD DKI Jakarta',
                    'verification_method' => 'Survei Geospasial Fisik & Uji Kelayakan Fasilitas Sanitasi',
                ],
                'created_by' => $admin?->id,
            ],
            [
                'name' => 'RPTRA Rawa Badak Selatan & Lapangan Terbuka',
                'facility_type' => 'assembly_point',
                'address' => 'Jl. Alur Laut No. 1, Rawa Badak Selatan, Koja, Jakarta Utara',
                'region_id' => $regionJkt?->id,
                'latitude' => -6.126389,
                'longitude' => 106.899444,
                'capacity' => 800,
                'current_occupancy' => 0,
                'has_sanitation' => true,
                'sanitation_details' => '6 unit toilet, suplai air bersih PAM Jaya, area sanitasi portabel',
                'wheelchair_accessible' => true,
                'elderly_friendly' => true,
                'contact_person' => 'Posko Siaga Kelurahan Rawa Badak Selatan',
                'contact_phone' => '021-43931234',
                'operational_status' => 'standby',
                'verification_status' => 'VERIFIED',
                'verified_at' => '2026-11-18 08:00:00',
                'verified_by_agency' => 'BPBD Provinsi DKI Jakarta & Dinas Sosial DKI',
                'source_name' => 'Peta Titik Kumpul Aman Bencana Banjir Pesisir Jakarta Utara',
                'source_url' => 'https://bpbd.jakarta.go.id/titik-kumpul-pesisir',
                'evacuation_route_info' => [
                    'has_official_route' => true,
                    'route_code' => 'EVAC-JKU-RAWABADAK-02',
                    'corridor_name' => 'Jalur Evakuasi Darat Jl. Alur Laut',
                    'status' => 'AVAILABLE',
                    'verified_at' => '2026-11-18T08:00:00+07:00',
                    'authority' => 'BPBD Provinsi DKI Jakarta',
                    'safety_guidance' => 'Rute darat menuju dataran lebih tinggi di RPTRA. Hindari kolam resapan bawah flyover saat curah hujan ekstrem.',
                ],
                'provenance_metadata' => [
                    'verified_by' => 'BPBD DKI Jakarta & Dinsos DKI',
                    'verification_method' => 'Penetapan Titik Kumpul Kontinjensi Pasang Air Laut',
                ],
                'created_by' => $admin?->id,
            ],
            [
                'name' => 'Stadion Patriot Candrabhaga (Shelter Regional Terpadu)',
                'facility_type' => 'stadium',
                'address' => 'Jl. Jenderal Ahmad Yani No. 2, Kayuringin Jaya, Bekasi Selatan, Kota Bekasi',
                'region_id' => $regionJbr?->id,
                'latitude' => -6.238333,
                'longitude' => 106.993611,
                'capacity' => 5000,
                'current_occupancy' => 0,
                'has_sanitation' => true,
                'sanitation_details' => '24 unit toilet tribun, tangki air bersih mobile PMI, dapur umum lapangan',
                'wheelchair_accessible' => true,
                'elderly_friendly' => true,
                'contact_person' => 'Sekretariat BPBD Kota Bekasi',
                'contact_phone' => '021-88950000',
                'operational_status' => 'open',
                'verification_status' => 'VERIFIED',
                'verified_at' => '2026-11-18 08:00:00',
                'verified_by_agency' => 'BPBD Provinsi Jawa Barat & BNPB',
                'source_name' => 'Katalog Sentra Evakuasi Pengungsian Skala Besar Penyangga Metropolitan',
                'source_url' => 'https://bpbd.jabarprov.go.id/shelter-patriot',
                'evacuation_route_info' => [
                    'has_official_route' => true,
                    'route_code' => 'EVAC-JBR-PATRIOT-01',
                    'corridor_name' => 'Koridor Protokol Jl. Ahmad Yani',
                    'status' => 'AVAILABLE',
                    'verified_at' => '2026-11-18T08:00:00+07:00',
                    'authority' => 'BPBD Kota Bekasi & Dishub Kota Bekasi',
                    'safety_guidance' => 'Lajur evakuasi utama dari bantaran DAS Bekasi Hilir menuju gerbang barat Stadion Patriot.',
                ],
                'provenance_metadata' => [
                    'verified_by' => 'BPBD Provinsi Jawa Barat',
                    'verification_method' => 'Sertifikasi Sentra Pengungsian Bencana Skala Besar',
                ],
                'created_by' => $admin?->id,
            ],
            [
                'name' => 'Balai Warga RW 07 Kampung Melayu (Titik Kumpul Evakuasi Dini)',
                'facility_type' => 'community_hall',
                'address' => 'Jl. Kebon Pala I, RT 04/RW 07, Kampung Melayu, Jatinegara, Jakarta Timur',
                'region_id' => $regionJktEast?->id,
                'latitude' => -6.228889,
                'longitude' => 106.864722,
                'capacity' => 250,
                'current_occupancy' => 60,
                'has_sanitation' => true,
                'sanitation_details' => '4 unit toilet lantai dua, cadangan galon air minum darurat',
                'wheelchair_accessible' => false,
                'elderly_friendly' => false,
                'contact_person' => 'Ketua RW 07 Kampung Melayu',
                'contact_phone' => '0812-3456-7890',
                'operational_status' => 'open',
                'verification_status' => 'VERIFIED',
                'verified_at' => '2026-11-18 08:00:00',
                'verified_by_agency' => 'Kelurahan Kampung Melayu & BPBD DKI Jakarta',
                'source_name' => 'Dokumen Rencana Kontinjensi Komunitas Banjir Ciliwung',
                'source_url' => null,
                'evacuation_route_info' => [
                    'has_official_route' => false,
                    'notes' => 'Rute digital resmi berbasis GIS belum dipublikasikan BPBD. Warga diimbau mematuhi rambu evakuasi vertikal di tiang pemukiman dan arahan petugas posko.',
                    'official_source' => null,
                ],
                'provenance_metadata' => [
                    'verified_by' => 'Satgas BPBD Kelurahan Kampung Melayu',
                    'verification_method' => 'Verifikasi Lapangan Pos Pantau Siaga Tingkat RW',
                ],
                'created_by' => $admin?->id,
            ],
            [
                'name' => 'Lapangan Terbuka Cipinang Melayu (Dalam Proses Verifikasi Kelayakan)',
                'facility_type' => 'assembly_point',
                'address' => 'Jl. Inspeksi Kali Malang, Cipinang Melayu, Makasar, Jakarta Timur',
                'region_id' => $regionJktEast?->id,
                'latitude' => -6.245833,
                'longitude' => 106.902778,
                'capacity' => 400,
                'current_occupancy' => 0,
                'has_sanitation' => false,
                'sanitation_details' => null,
                'wheelchair_accessible' => false,
                'elderly_friendly' => false,
                'contact_person' => 'Forum Kesiapsiagaan Warga Cipinang',
                'contact_phone' => null,
                'operational_status' => 'standby',
                'verification_status' => 'PENDING_VERIFICATION',
                'verified_at' => null,
                'verified_by_agency' => null,
                'source_name' => 'Usulan Warga & Forum Kesiapsiagaan Komunitas',
                'source_url' => null,
                'evacuation_route_info' => [
                    'has_official_route' => false,
                    'notes' => 'Belum tersedia rute evakuasi resmi. Lokasi masih dalam status peninjauan kelayakan tanggap darurat oleh otoritas.',
                    'official_source' => null,
                ],
                'provenance_metadata' => [
                    'verified_by' => null,
                    'verification_method' => 'Pengajuan Fasilitas Komunitas — Belum Tersertifikasi',
                ],
                'created_by' => $admin?->id,
            ],
        ];

        foreach ($shelters as $sData) {
            if (! Shelter::where('name', $sData['name'])->exists()) {
                Shelter::create($sData);
            }
        }
    }

    /**
     * Seed Baseline Community Disaster Reports & Verifications.
     */
    private function seedBaselineCommunityReports(): void
    {
        $citizen = User::where('email', 'user@sentravax.id')->first();
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $hazardFlood = HazardType::where('slug', 'flood')->first() ?? HazardType::first();
        $regionCentral = Region::where('code', 'ID-JK-PST')->first() ?? Region::first();
        $regionNorth = Region::where('code', 'ID-JK-UTR')->first() ?? Region::find(2);

        if ($citizen && $admin && $hazardFlood) {
            // Baseline Report 1: Verified
            if (!DB::table('community_reports')->where('id', 1)->exists()) {
                DB::table('community_reports')->insert([
                    'id' => 1,
                    'user_id' => $citizen->id,
                    'hazard_type_id' => $hazardFlood->id,
                    'region_id' => $regionCentral?->id ?? 1,
                    'title' => 'Genangan Jalur Rel Kereta',
                    'description' => 'Bantalan rel terendam air setinggi 20cm.',
                    'media' => null,
                    'status' => 'verified',
                    'verified_by' => $admin->id,
                    'verified_at' => '2026-11-17 05:52:31',
                    'moderation_notes' => 'Terkonfirmasi dengan stasiun pemantauan terdekat.',
                    'created_at' => '2026-11-17 05:52:31',
                    'updated_at' => '2026-11-17 05:52:31',
                    'location' => DB::raw("'0101000020E6100000D95F764F1EB65A40849ECDAACFD518C0'::geometry"),
                    'photo_path' => null,
                    'cluster_id' => null,
                ]);
            }

            // Baseline Report 9: Pending
            if (!DB::table('community_reports')->where('id', 9)->exists()) {
                DB::table('community_reports')->insert([
                    'id' => 9,
                    'user_id' => $citizen->id,
                    'hazard_type_id' => $hazardFlood->id,
                    'region_id' => $regionNorth?->id ?? 2,
                    'title' => 'Banjir Genangan 40cm Menutupi Akses Jalan',
                    'description' => 'Air meluap cepat dari drainase utama akibat curah hujan lebat.',
                    'media' => null,
                    'status' => 'pending',
                    'verified_by' => null,
                    'verified_at' => null,
                    'moderation_notes' => null,
                    'created_at' => '2026-11-17 05:52:57',
                    'updated_at' => '2026-11-17 05:54:12',
                    'location' => DB::raw("'0101000020E610000060764F1E16B65A40EBE2361AC0DB18C0'::geometry"),
                    'photo_path' => null,
                    'cluster_id' => 'cluster_dpeRuDEXZE',
                ]);
            }

            // Ensure Report Verification 1
            if (!DB::table('report_verifications')->where('id', 1)->exists()) {
                DB::table('report_verifications')->insert([
                    'id' => 1,
                    'community_report_id' => 1,
                    'verified_by' => $admin->id,
                    'previous_status' => 'pending',
                    'new_status' => 'verified',
                    'notes' => 'Terkonfirmasi dengan stasiun pemantauan terdekat.',
                    'evidence_links' => null,
                    'created_at' => '2026-11-17 05:52:31',
                    'updated_at' => '2026-11-17 05:52:31',
                ]);
            }

            // Reset Postgres sequences safely
            DB::statement("SELECT setval('community_reports_id_seq', (SELECT COALESCE(MAX(id), 1) FROM community_reports))");
            DB::statement("SELECT setval('report_verifications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM report_verifications))");
        }
    }
}

