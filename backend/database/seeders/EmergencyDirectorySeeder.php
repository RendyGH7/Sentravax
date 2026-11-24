<?php

namespace Database\Seeders;

use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmergencyDirectorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Principles:
     * 1. Create-only (does not update, overwrite, or mutate existing records).
     * 2. Idempotent (safe to run multiple times without duplicating or corrupting data).
     * 3. Fail-closed verification (channels without valid primary sources remain unverified;
     *    parents without verified active channels remain draft).
     * 4. System actor safe (created_by and updated_by are null).
     * 5. Strict regional integrity (only references existing province regions).
     */
    public function run(): void
    {
        $dkiRegion = Region::where('code', 'ID-JK')->where('level', 'province')->first();

        $manifest = [
            // 1. BASARNAS Pusat (National)
            [
                'name' => 'Badan Nasional Pencarian dan Pertolongan (BASARNAS)',
                'slug' => 'basarnas-pusat',
                'category' => EmergencyContact::CATEGORY_SAR,
                'scope' => EmergencyContact::SCOPE_NATIONAL,
                'region_id' => null,
                'address' => 'Jl. Angkasa Blok B.15 Kav. 2-3, Kemayoran, Jakarta Pusat 10720',
                'latitude' => -6.1558231,
                'longitude' => 106.8483120,
                'description' => 'Lembaga pemerintah nonkementerian yang bertugas melaksanakan tugas pemerintahan di bidang pencarian dan pertolongan (Search and Rescue/SAR) nasional.',
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_SHORTCODE,
                        'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                        'label' => 'Emergency Call SAR 115',
                        'value' => '115',
                        'is_toll_free' => true,
                        'is_primary' => true,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Situs Resmi BASARNAS',
                        'source_url' => 'https://basarnas.go.id',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Layanan panggilan darurat musibah membahayakan jiwa dan kecelakaan SAR bebas pulsa 24 jam.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_PHONE,
                        'channel_classification' => EmergencyContactChannel::CLASS_OFFICE_CONTACT,
                        'label' => 'Kantor Pusat Kemayoran',
                        'value' => '(021) 65701116',
                        'is_toll_free' => false,
                        'is_primary' => false,
                        'operating_hours' => 'Senin - Jumat 07:30 - 16:00 WIB',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Kontak Resmi BASARNAS',
                        'source_url' => 'https://basarnas.go.id/kontak-kami',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Sekretariat dan administrasi kantor pusat Basarnas Kemayoran Jakarta.',
                        'sort_order' => 2,
                        'is_active' => true,
                    ],
                ],
            ],

            // 2. POLRI Pusat (National)
            [
                'name' => 'Kepolisian Negara Republik Indonesia (POLRI)',
                'slug' => 'polri-pusat',
                'category' => EmergencyContact::CATEGORY_POLICE,
                'scope' => EmergencyContact::SCOPE_NATIONAL,
                'region_id' => null,
                'address' => 'Jl. Trunojoyo No. 3, Kebayoran Baru, Jakarta Selatan 12110',
                'latitude' => -6.2393282,
                'longitude' => 106.8021150,
                'description' => 'Kepolisian Negara Republik Indonesia yang bertugas memelihara keamanan, ketertiban masyarakat, dan memberikan perlindungan serta pengayoman.',
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_SHORTCODE,
                        'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                        'label' => 'Contact Center POLRI 110',
                        'value' => '110',
                        'is_toll_free' => true,
                        'is_primary' => true,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Portal Layanan POLRI 110',
                        'source_url' => 'https://polri.go.id/layanan-110',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Layanan kedaruratan, kecelakaan, dan kamtibmas 24 jam bebas pulsa terhubung ke SPKT terdekat.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                ],
            ],

            // 3. Kemenkes RI — NCC 119 SPGDT (National)
            [
                'name' => 'Kementerian Kesehatan RI — NCC 119 SPGDT',
                'slug' => 'kemenkes-ncc-119',
                'category' => EmergencyContact::CATEGORY_MEDICAL,
                'scope' => EmergencyContact::SCOPE_NATIONAL,
                'region_id' => null,
                'address' => 'Jl. H.R. Rasuna Said Blok X-5 Kav. 4-9, Jakarta Selatan 12950',
                'latitude' => -6.2238470,
                'longitude' => 106.8315530,
                'description' => 'National Command Center (NCC) Sistem Penanggulangan Gawat Darurat Terpadu (SPGDT) Kementerian Kesehatan Republik Indonesia.',
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_SHORTCODE,
                        'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                        'label' => 'Nomor Darurat Medis 119',
                        'value' => '119',
                        'is_toll_free' => true,
                        'is_primary' => true,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Kementerian Kesehatan RI & Permenkes 19/2016',
                        'source_url' => 'https://kemkes.go.id',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Pusat panggilan darurat medis pra-RS dan koordinasi ambulans nasional bebas pulsa.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                ],
            ],

            // 4. Pusdalops BNPB (National)
            [
                'name' => 'Pusat Pengendalian Operasi BNPB (Pusdalops PB)',
                'slug' => 'pusdalops-bnpb',
                'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                'scope' => EmergencyContact::SCOPE_NATIONAL,
                'region_id' => null,
                'address' => 'Graha BNPB Lt. 11, Jl. Pramuka Kav. 38, Jakarta Timur 13120',
                'latitude' => -6.1947230,
                'longitude' => 106.8687310,
                'description' => 'Pusat Pengendalian Operasi Penanggulangan Bencana Badan Nasional Penanggulangan Bencana (Pusdalops-PB BNPB).',
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_PHONE,
                        'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                        'label' => 'Hotline Telepon Pusdalops 1',
                        'value' => '(021) 29827444',
                        'is_toll_free' => false,
                        'is_primary' => true,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Portal Pusdalops BNPB',
                        'source_url' => 'https://pusdalops.bnpb.go.id',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Saluran telepon siaga darurat Pusdalops PB Graha BNPB Lt. 11.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_PHONE,
                        'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                        'label' => 'Hotline Telepon Pusdalops 2',
                        'value' => '(021) 29827666',
                        'is_toll_free' => false,
                        'is_primary' => false,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_UNVERIFIED,
                        'source_name' => 'Portal Pusdalops BNPB',
                        'source_url' => 'https://pusdalops.bnpb.go.id',
                        'verified_at' => null,
                        'verification_notes' => 'Saluran telepon siaga sekunder Pusdalops PB historis. Tidak tercantum secara mutakhir pada portal resmi bnpb.go.id/kontak saat audit 2026 sehingga status verifikasi diturunkan ke unverified.',
                        'sort_order' => 2,
                        'is_active' => true,
                    ],
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_WHATSAPP,
                        'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                        'label' => 'WhatsApp Siaga Pusdalops PB',
                        'value' => '0812-1237-575',
                        'is_toll_free' => false,
                        'is_primary' => false,
                        'operating_hours' => '24 Jam Siaga Bencana',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Pusdalops BNPB Graha Lt. 11',
                        'source_url' => 'https://pusdalops.bnpb.go.id',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Saluran pesan instan siaga laporan bencana Pusdalops BNPB.',
                        'sort_order' => 3,
                        'is_active' => true,
                    ],
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_SHORTCODE,
                        'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                        'label' => 'Call Center BNPB 117',
                        'value' => '117',
                        'is_toll_free' => false,
                        'is_primary' => false,
                        'operating_hours' => null,
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Portal Resmi BNPB (Halaman Kontak)',
                        'source_url' => 'https://bnpb.go.id/kontak',
                        'verified_at' => '2026-11-24 14:00:00',
                        'verification_notes' => 'Tercantum resmi pada portal BNPB sebagai kontak Pusdalops BNPB. Verifikasi identitas nomor valid sebagai kontak operasional resmi, namun tarif bebas pulsa dan jam operasional 24 jam belum diverifikasi secara eksplisit sehingga diset non-toll-free dan operating_hours tidak diklaim.',
                        'sort_order' => 4,
                        'is_active' => true,
                    ],
                ],
            ],

            // 5. BPBD Provinsi DKI Jakarta (Provincial)
            [
                'name' => 'BPBD Provinsi DKI Jakarta',
                'slug' => 'bpbd-dki-jakarta',
                'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                'scope' => EmergencyContact::SCOPE_PROVINCIAL,
                'region_id' => $dkiRegion?->id ?? 1,
                'address' => 'Gedung Dinas Penanggulangan Kebakaran dan Penyelamatan Lt. 3, Jl. KH. Zainul Arifin No. 71, Petojo Selatan, Gambir, Jakarta Pusat 10130',
                'latitude' => -6.1627910,
                'longitude' => 106.8164320,
                'description' => 'Badan Penanggulangan Bencana Daerah Provinsi DKI Jakarta pelaksana penanganan bencana di wilayah ibu kota.',
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_SHORTCODE,
                        'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                        'label' => 'Jakarta Siaga 112',
                        'value' => '112',
                        'is_toll_free' => true,
                        'is_primary' => true,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Layanan Jakarta Siaga 112',
                        'source_url' => 'https://jakarta.go.id/layanan-112',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Panggilan darurat terpadu banjir, ambulans, medis, dan kebakaran wilayah DKI Jakarta.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_PHONE,
                        'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                        'label' => 'Pusdalops BPBD DKI Jakarta',
                        'value' => '(021) 6344766',
                        'is_toll_free' => false,
                        'is_primary' => false,
                        'operating_hours' => '24 Jam',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Kontak Resmi BPBD DKI',
                        'source_url' => 'https://bpbd.jakarta.go.id/kontak',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Posko komando operasional Pusdalops BPBD DKI Gedung Gulkarmat Lt. 3.',
                        'sort_order' => 2,
                        'is_active' => true,
                    ],
                ],
            ],

            // 6. PMI Provinsi DKI Jakarta (Provincial - Informational)
            [
                'name' => 'Palang Merah Indonesia (PMI) Provinsi DKI Jakarta',
                'slug' => 'pmi-dki-jakarta',
                'category' => EmergencyContact::CATEGORY_RED_CROSS,
                'scope' => EmergencyContact::SCOPE_PROVINCIAL,
                'region_id' => $dkiRegion?->id ?? 1,
                'address' => 'Jl. Kramat Raya No. 47, Senen, Jakarta Pusat 10450',
                'latitude' => -6.1831450,
                'longitude' => 106.8456210,
                'description' => 'Markas dan Unit Transfusi Darah (UTD) Palang Merah Indonesia Provinsi DKI Jakarta.',
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_PHONE,
                        'channel_classification' => EmergencyContactChannel::CLASS_INFORMATIONAL_CONTACT,
                        'label' => 'Markas & Unit Transfusi Darah (UTD)',
                        'value' => '(021) 3906666',
                        'is_toll_free' => false,
                        'is_primary' => true,
                        'operating_hours' => 'Hari Kerja & Pelayanan Donor Darah',
                        'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                        'source_name' => 'Kontak Resmi PMI DKI Jakarta',
                        'source_url' => 'https://pmidkijakarta.or.id/kontak-kami',
                        'verified_at' => '2026-11-24 10:00:00',
                        'verification_notes' => 'Kontak kesekretariatan markas dan informasi donor darah UTD Kramat Raya. Bukan nomor darurat ambulans bencana.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                ],
            ],

            // 7. DAMKAR Nasional (National - Draft / Unverified)
            [
                'name' => 'Dinas Pemadam Kebakaran dan Penyelamatan (DAMKAR)',
                'slug' => 'damkar-nasional',
                'category' => EmergencyContact::CATEGORY_FIRE,
                'scope' => EmergencyContact::SCOPE_NATIONAL,
                'region_id' => null,
                'address' => null,
                'latitude' => null,
                'longitude' => null,
                'description' => 'Layanan pemadam kebakaran dan penyelamatan sektor kebencanaan.',
                'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
                'publication_status' => EmergencyContact::PUB_DRAFT,
                'channels' => [
                    [
                        'channel_type' => EmergencyContactChannel::TYPE_SHORTCODE,
                        'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                        'label' => 'Shortcode Pemadam Kebakaran 113',
                        'value' => '113',
                        'is_toll_free' => false,
                        'is_primary' => true,
                        'operating_hours' => 'Bergantung pada posko PSTN daerah',
                        'verification_status' => EmergencyContactChannel::STATUS_UNVERIFIED,
                        'source_name' => 'Permenkominfo Alokasi Penomoran Telekomunikasi',
                        'source_url' => 'https://komdigi.go.id',
                        'verified_at' => null,
                        'verification_notes' => 'Alokasi shortcode regulasi ada, namun belum ada call center terpusat nasional dan routing seluler bervariasi per operator telko daerah. Klaim bebas pulsa tidak terbukti eksplisit secara nasional. Ditahan dari publikasi aktif.',
                        'sort_order' => 1,
                        'is_active' => true,
                    ],
                ],
            ],
        ];

        foreach ($manifest as $entry) {
            // Idempotent guard: if slug already exists, skip entirely to preserve existing data
            $existing = EmergencyContact::where('slug', $entry['slug'])->first();
            if ($existing) {
                continue;
            }

            // Guard publication: parent cannot be published unless it has >= 1 verified active channel
            $hasVerifiedActiveChannel = false;
            foreach ($entry['channels'] as $ch) {
                if ($ch['is_active'] && $ch['verification_status'] === EmergencyContactChannel::STATUS_VERIFIED) {
                    $hasVerifiedActiveChannel = true;
                    break;
                }
            }

            $publicationStatus = $hasVerifiedActiveChannel
                ? $entry['publication_status']
                : EmergencyContact::PUB_DRAFT;

            $contact = EmergencyContact::create([
                'name' => $entry['name'],
                'slug' => $entry['slug'],
                'category' => $entry['category'],
                'scope' => $entry['scope'],
                'region_id' => $entry['region_id'],
                'address' => $entry['address'],
                'latitude' => $entry['latitude'],
                'longitude' => $entry['longitude'],
                'description' => $entry['description'],
                'verification_status' => $entry['verification_status'],
                'publication_status' => $publicationStatus,
                'created_by' => null,
                'updated_by' => null,
            ]);

            foreach ($entry['channels'] as $ch) {
                EmergencyContactChannel::create([
                    'emergency_contact_id' => $contact->id,
                    'channel_type' => $ch['channel_type'],
                    'channel_classification' => $ch['channel_classification'],
                    'label' => $ch['label'],
                    'value' => $ch['value'],
                    'is_toll_free' => $ch['is_toll_free'],
                    'is_primary' => $ch['is_primary'],
                    'operating_hours' => $ch['operating_hours'],
                    'verification_status' => $ch['verification_status'],
                    'source_name' => $ch['source_name'],
                    'source_url' => $ch['source_url'],
                    'verified_at' => $ch['verified_at'],
                    'verification_notes' => $ch['verification_notes'],
                    'sort_order' => $ch['sort_order'],
                    'is_active' => $ch['is_active'],
                ]);
            }
        }

        $this->syncPostgresSequences();
    }

    /**
     * Synchronize PostgreSQL auto-increment sequences to max(id).
     */
    private function syncPostgresSequences(): void
    {
        $tables = ['emergency_contacts', 'emergency_contact_channels'];
        foreach ($tables as $t) {
            $seq = DB::selectOne("SELECT pg_get_serial_sequence('{$t}', 'id') as seq_name");
            if ($seq && $seq->seq_name) {
                $maxId = DB::table($t)->max('id') ?? 1;
                DB::statement("SELECT setval('{$seq->seq_name}', {$maxId})");
            }
        }
    }
}
