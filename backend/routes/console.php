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

// ==========================================
// SENTRAVAX CRON SCHEDULER & PERIODIC TASKS
// ==========================================

// 1. BMKG Common Alerting Protocol (CAP) Inbound Feed (Every 5 Minutes)
Artisan::command('sentravax:sync-cap {--direct : Execute synchronously instead of queue}', function () {
    $sync = app(\App\Services\ExternalData\DataSyncService::class);
    $this->info('Checking BMKG Common Alerting Protocol (CAP) inbound feed...');
    $capSource = \App\Models\DataSource::where('source_type', 'cap')
        ->where('status', 'active')
        ->first()
        ?? \App\Models\DataSource::where('name', 'like', '%CAP%')->where('status', 'active')->first();

    if (! $capSource) {
        $this->warn('No active CAP DataSource found.');
        return 0;
    }

    if ($this->option('direct')) {
        $run = $sync->syncDataSource($capSource);
        $this->info(sprintf('Synchronous CAP sync completed with status: %s (persisted %d)', $run->status, $run->items_persisted));
    } else {
        \App\Jobs\SyncDataSourceJob::dispatch($capSource, 'scheduler-cap-' . uniqid());
        $this->info(sprintf('Dispatched queued CAP sync job for %s (#%d)', $capSource->name, $capSource->id));
    }

    return 0;
})->purpose('Synchronize BMKG Common Alerting Protocol (CAP) feed');

\Illuminate\Support\Facades\Schedule::command('sentravax:sync-cap')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->name('sentravax-sync-cap');

// 2. BMKG InaTEWS Rapid Earthquake Telemetry (Every 15 Minutes)
Artisan::command('sentravax:sync-inatews {--direct : Execute synchronously instead of queue}', function () {
    $sync = app(\App\Services\ExternalData\DataSyncService::class);
    $this->info('Checking BMKG InaTEWS rapid earthquake telemetry...');
    $tewsSource = \App\Models\DataSource::where('endpoint_url', 'like', '%autogempa%')
        ->where('status', 'active')
        ->first()
        ?? \App\Models\DataSource::where('category', 'seismology')->where('status', 'active')->first();

    if (! $tewsSource) {
        $this->warn('No active BMKG InaTEWS DataSource found.');
        return 0;
    }

    if ($this->option('direct')) {
        $run = $sync->syncDataSource($tewsSource);
        $this->info(sprintf('Synchronous InaTEWS sync completed with status: %s (persisted %d)', $run->status, $run->items_persisted));
    } else {
        \App\Jobs\SyncDataSourceJob::dispatch($tewsSource, 'scheduler-inatews-' . uniqid());
        $this->info(sprintf('Dispatched queued InaTEWS sync job for %s (#%d)', $tewsSource->name, $tewsSource->id));
    }

    return 0;
})->purpose('Synchronize BMKG InaTEWS rapid earthquake open data');

\Illuminate\Support\Facades\Schedule::command('sentravax:sync-inatews')
    ->everyFifteenMinutes()
    ->withoutOverlapping(10)
    ->name('sentravax-sync-inatews');

// 3. Periodic Maintenance & Multi-Source Sync
Artisan::command('sentravax:sync-sources', function (\App\Services\ExternalData\DataSyncService $sync) {
    $this->info('Starting SENTRAVAX external data sources synchronization...');
    $runs = $sync->syncAll();
    $this->info(sprintf('Successfully executed %d synchronization run(s).', count($runs)));
})->purpose('Synchronize all active multi-hazard external data sources');

\Illuminate\Support\Facades\Schedule::command('sentravax:sync-sources')
    ->everyThirtyMinutes()
    ->withoutOverlapping(15)
    ->name('sentravax-sync-sources');

\Illuminate\Support\Facades\Schedule::command('queue:prune-failed --hours=168')
    ->daily()
    ->name('sentravax-prune-failed-jobs');

Artisan::command('sentravax:backup', function () {
    $this->info('Starting database backup procedure...');
    $dir = storage_path('app/backups');
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $filename = 'sentravax_backup_' . date('Y_m_d_His') . '.sql';
    $filepath = $dir . DIRECTORY_SEPARATOR . $filename;

    $pgDump = env('PG_DUMP_PATH');
    if (!$pgDump) {
        $commonPaths = [
            'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
            '/usr/bin/pg_dump',
            '/usr/local/bin/pg_dump',
        ];
        foreach ($commonPaths as $p) {
            if (file_exists($p)) {
                $pgDump = $p;
                break;
            }
        }
    }

    $dbHost = config('database.connections.pgsql.host', '127.0.0.1');
    $dbPort = config('database.connections.pgsql.port', '5432');
    $dbName = config('database.connections.pgsql.database', 'sentravax_db');
    $dbUser = config('database.connections.pgsql.username', 'postgres');
    $dbPass = config('database.connections.pgsql.password', '');

    if ($pgDump && file_exists($pgDump)) {
        putenv("PGPASSWORD={$dbPass}");
        $cmd = sprintf('"%s" -h %s -p %s -U %s -F p -b -v -f "%s" %s', $pgDump, $dbHost, $dbPort, $dbUser, $filepath, $dbName);
        exec($cmd, $output, $returnVar);
        putenv("PGPASSWORD");

        if ($returnVar === 0 && file_exists($filepath)) {
            $size = round(filesize($filepath) / 1024, 2);
            $this->info("Backup successfully generated at: {$filepath} ({$size} KB)");
            return 0;
        }
    }

    $this->warn("pg_dump binary not found in standard system path. Standard command syntax:");
    $this->line(sprintf('pg_dump -h %s -p %s -U %s -F c -b -v -f "%s" %s', $dbHost, $dbPort, $dbUser, $filepath, $dbName));
    return 0;
})->purpose('Execute or prepare a database backup');
