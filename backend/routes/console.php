<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('db:baseline', function () {
    $this->line(json_encode([
        'community_reports' => \App\Models\CommunityReport::pluck('id')->all(),
        'ai_insights' => \App\Models\AiInsight::pluck('id')->all(),
        'report_verifications' => \App\Models\ReportVerification::pluck('id')->all(),
    ]));
})->purpose('Check database baseline counts');

Artisan::command('db:ensure-baseline', function () {
    // 1. Ensure Citizen User exists
    $citizenUser = \App\Models\User::where('email', 'user@sentravax.id')->first();
    if (!$citizenUser) {
        if (!\App\Models\User::where('id', 3)->exists()) {
            \DB::table('users')->insert([
                'id' => 3,
                'name' => 'Warga Masyarakat',
                'email' => 'user@sentravax.id',
                'password' => bcrypt('password'),
                'role' => 'user',
                'created_at' => '2026-11-17 05:50:00',
                'updated_at' => '2026-11-17 05:50:00',
            ]);
            $userId = 3;
        } else {
            $userId = \DB::table('users')->insertGetId([
                'name' => 'Warga Masyarakat',
                'email' => 'user@sentravax.id',
                'password' => bcrypt('password'),
                'role' => 'user',
                'created_at' => '2026-11-17 05:50:00',
                'updated_at' => '2026-11-17 05:50:00',
            ]);
        }
        \DB::statement("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
    } else {
        $userId = $citizenUser->id;
    }

    // 2. Ensure community_report 1
    if (!\App\Models\CommunityReport::where('id', 1)->exists()) {
        \DB::table('community_reports')->insert([
            'id' => 1,
            'user_id' => $userId,
            'hazard_type_id' => 1,
            'region_id' => 1,
            'title' => 'Genangan Jalur Rel Kereta',
            'description' => 'Bantalan rel terendam air setinggi 20cm.',
            'media' => null,
            'status' => 'verified',
            'verified_by' => 1,
            'verified_at' => '2026-11-17 05:52:31',
            'moderation_notes' => 'Terkonfirmasi dengan stasiun pemantauan terdekat.',
            'created_at' => '2026-11-17 05:52:31',
            'updated_at' => '2026-11-17 05:52:31',
            'location' => \DB::raw("'0101000020E6100000D95F764F1EB65A40849ECDAACFD518C0'::geometry"),
            'photo_path' => null,
            'cluster_id' => null,
        ]);
        \DB::statement("SELECT setval('community_reports_id_seq', (SELECT MAX(id) FROM community_reports))");
    }

    // 3. Ensure community_report 9
    if (!\App\Models\CommunityReport::where('id', 9)->exists()) {
        \DB::table('community_reports')->insert([
            'id' => 9,
            'user_id' => $userId,
            'hazard_type_id' => 1,
            'region_id' => 2,
            'title' => 'Banjir Genangan 40cm Menutupi Akses Jalan',
            'description' => 'Air meluap cepat dari drainase utama akibat curah hujan lebat.',
            'media' => null,
            'status' => 'pending',
            'verified_by' => null,
            'verified_at' => null,
            'moderation_notes' => null,
            'created_at' => '2026-11-17 05:52:57',
            'updated_at' => '2026-11-17 05:54:12',
            'location' => \DB::raw("'0101000020E610000060764F1E16B65A40EBE2361AC0DB18C0'::geometry"),
            'photo_path' => null,
            'cluster_id' => 'cluster_dpeRuDEXZE',
        ]);
        \DB::statement("SELECT setval('community_reports_id_seq', (SELECT MAX(id) FROM community_reports))");
    }

    // 4. Ensure report_verification 1
    if (!\App\Models\ReportVerification::where('id', 1)->exists()) {
        \DB::table('report_verifications')->insert([
            'id' => 1,
            'community_report_id' => 1,
            'verified_by' => 1,
            'previous_status' => 'pending',
            'new_status' => 'verified',
            'notes' => 'Terkonfirmasi dengan stasiun pemantauan terdekat.',
            'evidence_links' => null,
            'created_at' => '2026-11-17 05:52:31',
            'updated_at' => '2026-11-17 05:52:31',
        ]);
        \DB::statement("SELECT setval('report_verifications_id_seq', (SELECT MAX(id) FROM report_verifications))");
    }

    $this->line('Database baseline verified and synchronized.');
})->purpose('Ensure complete database baseline exists');
