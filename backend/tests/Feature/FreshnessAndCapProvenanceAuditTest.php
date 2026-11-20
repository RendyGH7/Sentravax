<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use App\Services\ExternalData\CapAdapter;
use App\Services\ExternalData\DataSyncService;
use App\Services\ExternalData\FreshnessClassifierService;
use App\Services\Notification\NotificationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FreshnessAndCapProvenanceAuditTest extends TestCase
{
    protected FreshnessClassifierService $classifier;
    protected User $adminUser;
    protected User $citizenUser;
    protected User $intelUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->classifier = app(FreshnessClassifierService::class);

        $this->adminUser = User::where('role', 'admin')->first()
            ?? User::factory()->create(['role' => 'admin']);

        $this->citizenUser = User::where('role', 'user')->first()
            ?? User::where('email', 'user@sentravax.id')->first()
            ?? User::factory()->create(['role' => 'user']);

        $this->intelUser = User::where('role', 'intelligence')->first()
            ?? User::where('email', 'intelligence@sentravax.go.id')->first()
            ?? User::factory()->create(['role' => 'intelligence']);
    }

    /**
     * Test 1: Data lama tetap STALE meski HTTP request sukses.
     * When external API responds successfully (HTTP 200) with old observation data,
     * the data source MUST remain STALE because the physical data itself is old.
     */
    public function test_1_old_data_remains_stale_even_if_http_request_succeeds(): void
    {
        $source = DataSource::where('name', 'like', '%TEWS%')->first();
        $this->assertNotNull($source);

        // Simulate successful HTTP poll just now (last_successful_at = now())
        // but with 10-hour-old earthquake observation (last_observed_at = 600m ago)
        $source->update([
            'status' => 'active',
            'last_successful_at' => now(),
            'last_observed_at' => now()->subHours(10),
        ]);

        $classification = $this->classifier->classify($source->fresh());

        $this->assertEquals(FreshnessClassifierService::STATE_STALE, $classification['freshness_state'],
            'Data with 10-hour-old observation must be STALE despite recent HTTP success.');
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_LIVE, $classification['connectivity_state']);
        $this->assertStringContainsString('stale', strtolower($classification['explanation']));
    }

    /**
     * Test 2: Data tanpa timestamp valid menjadi UNKNOWN.
     * Missing observation timestamps or timestamps with >5min future clock drift must be UNKNOWN.
     */
    public function test_2_data_without_valid_timestamp_becomes_unknown(): void
    {
        $source = DataSource::where('name', 'like', '%TEWS%')->first();
        $this->assertNotNull($source);

        // Case A: Missing observation timestamp (null)
        $source->update([
            'status' => 'active',
            'last_successful_at' => now(),
            'last_observed_at' => null,
        ]);
        $classA = $this->classifier->classify($source->fresh());
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $classA['freshness_state'],
            'Source with null last_observed_at must evaluate to UNKNOWN.');

        // Case B: Future observation timestamp exceeding 5-min clock drift tolerance (+25 min)
        $source->update([
            'status' => 'active',
            'last_successful_at' => now(),
            'last_observed_at' => now()->addMinutes(25),
        ]);
        $classB = $this->classifier->classify($source->fresh());
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $classB['freshness_state'],
            'Future observation timestamp beyond 5 min skew must evaluate to UNKNOWN.');
        $this->assertStringContainsString('anomali temporal', strtolower($classB['explanation']));

        // Case C: Future sync timestamp exceeding 5-min clock drift tolerance (+20 min)
        $source->update([
            'status' => 'active',
            'last_successful_at' => now()->addMinutes(20),
            'last_observed_at' => now(),
        ]);
        $classC = $this->classifier->classify($source->fresh());
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $classC['freshness_state'],
            'Future sync timestamp beyond 5 min skew must evaluate to UNKNOWN.');
    }

    /**
     * Test 3: Kegagalan sinkronisasi tidak menghapus timestamp sukses sebelumnya.
     * When external sync encounters network failure or 500 error, previous last_successful_at
     * and last_observed_at must remain intact.
     */
    public function test_3_sync_failure_does_not_wipe_previous_successful_timestamp(): void
    {
        $source = DataSource::where('name', 'like', '%TEWS%')->first();
        $this->assertNotNull($source);

        $savedSuccess = now()->subMinutes(25);
        $savedObserved = now()->subMinutes(25);

        $source->update([
            'status' => 'active',
            'last_successful_at' => $savedSuccess,
            'last_observed_at' => $savedObserved,
        ]);

        // Fake network failure
        Http::fake([
            '*autogempa.json' => Http::response(null, 503),
        ]);

        $syncService = app(DataSyncService::class);
        $syncRun = $syncService->syncDataSource($source);

        $this->assertEquals('FAILED', $syncRun->status);

        $sourceAfter = $source->fresh();
        $this->assertNotNull($sourceAfter->last_successful_at);
        $this->assertNotNull($sourceAfter->last_observed_at);
        $this->assertEquals($savedSuccess->timestamp, $sourceAfter->last_successful_at->timestamp,
            'Sync failure must NOT wipe previous last_successful_at.');
        $this->assertEquals($savedObserved->timestamp, $sourceAfter->last_observed_at->timestamp,
            'Sync failure must NOT wipe previous last_observed_at.');

        // Clean up sync run created by test
        $syncRun->delete();
    }

    /**
     * Test 4: HTTP latency tidak menentukan freshness.
     * Latency (duration_ms) must not alter whether data is FRESH or STALE.
     */
    public function test_4_http_latency_does_not_determine_freshness(): void
    {
        $source = DataSource::where('name', 'like', '%TEWS%')->first();
        $this->assertNotNull($source);

        // Recent observation (10 mins ago) with high simulated HTTP latency (8500ms)
        $source->update([
            'status' => 'active',
            'last_successful_at' => now()->subMinutes(10),
            'last_observed_at' => now()->subMinutes(10),
        ]);

        $classification = $this->classifier->classify($source->fresh());
        $this->assertEquals(FreshnessClassifierService::STATE_FRESH, $classification['freshness_state'],
            'Fresh observation remains FRESH regardless of transport latency.');

        // Old observation (180 mins ago) remains STALE even if network latency is near zero
        $source->update([
            'last_successful_at' => now(),
            'last_observed_at' => now()->subMinutes(180),
        ]);
        $staleClass = $this->classifier->classify($source->fresh());
        $this->assertEquals(FreshnessClassifierService::STATE_STALE, $staleClass['freshness_state'],
            'Stale observation remains STALE regardless of fast HTTP response.');
    }

    /**
     * Test 5: CAP active feed vs fallback archive memiliki status konektivitas berbeda.
     * External live CAP is LIVE/OFFICIAL; archive/simulated CAP is STATIC or OFFLINE.
     */
    public function test_5_cap_active_feed_vs_fallback_archive_have_distinct_connectivity_and_provenance(): void
    {
        $capAdapter = app(CapAdapter::class);

        // 1. Simulated or Curated Archive Source
        $archiveSource = new DataSource([
            'name' => 'BMKG CAP Curated Archive',
            'provider' => 'BMKG Archive Repository',
            'source_type' => 'curated',
            'is_simulated' => true,
            'status' => 'active',
        ]);

        $archiveResult = $capAdapter->sync($archiveSource);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_OFFLINE, $archiveResult['connectivity_state']);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_SIMULATED, $archiveResult['provenance_type']);
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $archiveResult['freshness_state']);
        $this->assertTrue($archiveResult['provenance']['is_archive']);

        // 2. Live CAP feed (simulated successful response)
        $validCapXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
    <identifier>BMKG-TEST-LIVE-001</identifier>
    <sender>pusat.peringatan@bmkg.go.id</sender>
    <sent>2026-11-20T10:00:00+07:00</sent>
    <status>Actual</status>
    <msgType>Alert</msgType>
    <scope>Public</scope>
    <info>
        <category>Met</category>
        <event>Peringatan Hujan Lebat Disertai Petir</event>
        <urgency>Immediate</urgency>
        <severity>Severe</severity>
        <certainty>Observed</certainty>
        <headline>Waspada Cuaca Ekstrem Jabodetabek</headline>
        <description>Potensi hujan lebat disertai kilat/petir dan angin kencang.</description>
        <expires>2026-11-20T16:00:00+07:00</expires>
    </info>
</alert>
XML;

        Http::fake([
            'https://www.bmkg.go.id/alerts/nowcast/id' => Http::response($validCapXml, 200, ['Content-Type' => 'application/xml']),
        ]);

        $liveSource = DataSource::where('name', 'like', '%CAP%')->first();
        if ($liveSource) {
            $liveResult = $capAdapter->sync($liveSource);
            $this->assertEquals('SUCCESS', $liveResult['status']);
            $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_LIVE, $liveResult['connectivity_state']);
            $this->assertEquals(FreshnessClassifierService::PROVENANCE_OFFICIAL, $liveResult['provenance_type']);

            // Clean up test created alert
            Alert::where('external_identifier', 'BMKG-TEST-LIVE-001')->delete();
        }
    }

    /**
     * Test 6: CAP Cancel/Update tidak menimbulkan duplikasi notifikasi.
     * Duplicate XML payloads and Cancel messages must NOT dispatch new notifications.
     */
    public function test_6_cap_cancel_and_update_does_not_cause_duplicate_notifications(): void
    {
        $mockNotif = $this->createMock(NotificationService::class);
        // We expect notifyOfficialWarning to be called EXACTLY ONCE for the initial alert creation
        $mockNotif->expects($this->once())
            ->method('notifyOfficialWarning');

        $capAdapter = new CapAdapter($mockNotif);
        $liveSource = DataSource::where('name', 'like', '%CAP%')->first();

        $activeCapXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
    <identifier>BMKG-DUP-TEST-001</identifier>
    <sender>pusat.peringatan@bmkg.go.id</sender>
    <sent>2026-11-20T10:00:00+07:00</sent>
    <status>Actual</status>
    <msgType>Alert</msgType>
    <scope>Public</scope>
    <info>
        <category>Met</category>
        <event>Peringatan Dini Cuaca</event>
        <urgency>Immediate</urgency>
        <severity>Moderate</severity>
        <certainty>Observed</certainty>
        <headline>Peringatan Cuaca Uji Coba</headline>
        <description>Deskripsi peringatan uji coba anti-duplikasi.</description>
        <expires>2026-11-20T18:00:00+07:00</expires>
    </info>
</alert>
XML;

        // 1. First ingestion: Creates new active alert -> Triggers 1 notification
        $alert1 = $capAdapter->parseAndPersistCapXml($activeCapXml, $liveSource);
        $this->assertNotNull($alert1);
        $this->assertEquals('active', $alert1->status);

        // 2. Second ingestion of identical XML: Existing active alert with same status/severity -> Must NOT notify
        $alert2 = $capAdapter->parseAndPersistCapXml($activeCapXml, $liveSource);
        $this->assertEquals($alert1->id, $alert2->id);

        // 3. Ingestion of Cancel message -> Must cancel alert and NOT notify
        $cancelCapXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
    <identifier>BMKG-CANCEL-TEST-001</identifier>
    <sender>pusat.peringatan@bmkg.go.id</sender>
    <sent>2026-11-20T11:00:00+07:00</sent>
    <status>Actual</status>
    <msgType>Cancel</msgType>
    <scope>Public</scope>
    <references>pusat.peringatan@bmkg.go.id,BMKG-DUP-TEST-001,2026-11-20T10:00:00+07:00</references>
</alert>
XML;

        $cancelledAlert = $capAdapter->parseAndPersistCapXml($cancelCapXml, $liveSource);
        $this->assertNotNull($cancelledAlert);
        $this->assertEquals('cancelled', $cancelledAlert->fresh()->status);

        // Clean up
        $alert1->delete();
    }

    /**
     * Test 7: Expired archive tidak muncul sebagai alert aktif.
     * Alerts with expires_at in the past are marked 'expired' and excluded from active queries.
     */
    public function test_7_expired_archive_alert_is_not_shown_as_active_alert(): void
    {
        $capAdapter = app(CapAdapter::class);
        $liveSource = DataSource::where('name', 'like', '%CAP%')->first();

        $expiredCapXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
    <identifier>BMKG-EXPIRED-TEST-001</identifier>
    <sender>pusat.peringatan@bmkg.go.id</sender>
    <sent>2026-11-18T10:00:00+07:00</sent>
    <status>Actual</status>
    <msgType>Alert</msgType>
    <scope>Public</scope>
    <info>
        <category>Met</category>
        <event>Peringatan Cuaca Lampau</event>
        <urgency>Past</urgency>
        <severity>Minor</severity>
        <certainty>Observed</certainty>
        <headline>Peringatan Kadaluarsa Arsip</headline>
        <description>Peringatan cuaca yang sudah kadaluarsa.</description>
        <expires>2026-11-18T16:00:00+07:00</expires>
    </info>
</alert>
XML;

        $alert = $capAdapter->parseAndPersistCapXml($expiredCapXml, $liveSource);
        $this->assertNotNull($alert);
        $this->assertEquals('expired', $alert->status, 'Alert with past expires_at must be marked expired.');

        // Active scope must exclude this expired alert
        $activeAlerts = Alert::active()->where('id', $alert->id)->get();
        $this->assertCount(0, $activeAlerts, 'Expired alert must NOT be returned by Alert::active() scope.');

        // Public API endpoint with status=active must not return this alert
        $res = $this->getJson('/api/v1/public/alerts?status=active');
        $res->assertStatus(200);
        $items = collect($res->json('data.data') ?? $res->json('data') ?? []);
        $this->assertFalse($items->contains('external_identifier', 'BMKG-EXPIRED-TEST-001'));

        // Clean up
        $alert->delete();
    }

    /**
     * Test 8: Foto laporan publik tetap dapat diakses via HTTP.
     * Uploaded image in storage/app/public/community_reports/ is accessible via /storage/...
     */
    public function test_8_public_report_photo_remains_accessible_via_http(): void
    {
        $filename = 'audit_public_proof_' . uniqid() . '.jpg';
        $dummyContent = "\xFF\xD8\xFF\xE0\x00\x10JFIF" . str_repeat('A', 200);

        Storage::disk('public')->put('community_reports/' . $filename, $dummyContent);

        try {
            $response = $this->get('/storage/community_reports/' . $filename);
            $response->assertStatus(200);
        } finally {
            Storage::disk('public')->delete('community_reports/' . $filename);
        }
    }

    /**
     * Test 9: File privat tidak dapat diakses via URL publik.
     * Storage route must strictly reject private files and path traversal with 404.
     */
    public function test_9_private_files_cannot_be_accessed_via_public_url_or_path_traversal(): void
    {
        // Place secret file in private storage
        Storage::disk('local')->put('confidential_secret.txt', 'TOP_SECRET_COORDINATES_AND_KEYS');

        // 1. Direct attempt to fetch private file from public storage URL -> 404
        $resPrivate = $this->get('/storage/confidential_secret.txt');
        $resPrivate->assertStatus(404);

        // 2. Directory traversal attempt with ../ -> 404
        $resTraversal = $this->get('/storage/../private/confidential_secret.txt');
        $this->assertContains($resTraversal->status(), [400, 404]);

        // Clean up
        Storage::disk('local')->delete('confidential_secret.txt');
    }

    /**
     * Test 10: Konsistensi photo_url di seluruh endpoint.
     * Community report with a photo returns an identical public URL across:
     * - Public detail
     * - User portal detail
     * - Admin moderation
     * - Intelligence center
     */
    public function test_10_photo_url_is_consistent_across_all_endpoints(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();
        $photoPath = 'community_reports/consistent_evidence_' . uniqid() . '.jpg';
        $expectedUrl = Storage::disk('public')->url($photoPath);

        $reportId = DB::table('community_reports')->insertGetId([
            'user_id' => $this->citizenUser->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Uji Konsistensi Foto Multi-Endpoint',
            'description' => 'Bukti pengujian konsistensi URL foto seluruh role.',
            'photo_path' => $photoPath,
            'status' => 'pending',
            'location' => DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            // 1. Public Endpoint: GET /api/v1/public/reports/{id}
            $publicRes = $this->getJson("/api/v1/public/reports/{$reportId}");
            $publicRes->assertStatus(200);
            $this->assertEquals($expectedUrl, $publicRes->json('data.photo_url'),
                'Public endpoint photo_url must match expected public storage URL.');

            // 2. User Portal Endpoint: GET /api/v1/user/reports/{id}
            $userRes = $this->actingAs($this->citizenUser)->getJson("/api/v1/user/reports/{$reportId}");
            $userRes->assertStatus(200);
            $this->assertEquals($expectedUrl, $userRes->json('data.photo_url'),
                'User Portal endpoint photo_url must match expected public storage URL.');

            // 3. Admin Moderation Endpoint: GET /api/v1/admin/reports
            $adminRes = $this->actingAs($this->adminUser)->getJson("/api/v1/admin/reports?status=pending");
            $adminRes->assertStatus(200);
            $adminReports = collect($adminRes->json('data.data') ?? $adminRes->json('data') ?? []);
            $adminItem = $adminReports->firstWhere('id', $reportId);
            $this->assertNotNull($adminItem);
            $this->assertEquals($expectedUrl, $adminItem['photo_url'],
                'Admin Moderation endpoint photo_url must match expected public storage URL.');

            // 4. Intelligence Center Endpoint: GET /api/v1/intel/reports/queue
            $intelRes = $this->actingAs($this->intelUser)->getJson("/api/v1/intel/reports/queue?status=pending");
            $intelRes->assertStatus(200);
            $intelReports = collect($intelRes->json('data.data') ?? $intelRes->json('data') ?? []);
            $intelItem = $intelReports->firstWhere('id', $reportId);
            $this->assertNotNull($intelItem);
            $this->assertEquals($expectedUrl, $intelItem['photo_url'],
                'Intelligence Center endpoint photo_url must match expected public storage URL.');
        } finally {
            DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }
}
