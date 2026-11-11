<?php

namespace Database\Seeders;

use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
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
}

