<?php

namespace Tests\Feature;

use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use App\Services\ExternalData\FreshnessClassifierService;
use Database\Seeders\SentravaxMasterSeeder;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OperationalMonitoringTest extends TestCase
{
    protected User $admin;
    protected User $intel;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->admin = User::where('email', 'admin@sentravax.go.id')->first();
        $this->intel = User::where('email', 'intelligence@sentravax.go.id')->first();
        $this->user = User::where('email', 'user@sentravax.id')->first();
    }

    public function test_admin_can_list_and_filter_data_sources(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/data-sources?category=seismology');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'provider',
                        'category',
                        'endpoint_url',
                        'status',
                        'sync_interval_minutes',
                        'rate_limit_rpm',
                        'terms_of_service',
                        'freshness_state',
                        'freshness_info',
                    ],
                ],
                'meta' => [
                    'metrics' => [
                        'sources',
                        'sync_runs',
                        'freshness_distribution',
                    ],
                ],
            ]);

        foreach ($response->json('data') as $src) {
            $this->assertEquals('seismology', $src['category']);
        }
    }

    public function test_admin_can_view_data_source_detail_and_history(): void
    {
        $source = DataSource::first();

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/data-sources/{$source->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'source' => [
                        'id' => $source->id,
                        'name' => $source->name,
                    ],
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'source' => [
                        'id',
                        'name',
                        'provider',
                        'freshness_state',
                        'freshness_info',
                        'sync_runs',
                    ],
                    'statistics' => [
                        'total_sync_runs',
                        'successful_runs',
                        'failed_runs',
                        'success_rate',
                    ],
                ],
            ]);
    }

    public function test_admin_can_toggle_data_source_status(): void
    {
        $source = DataSource::where('name', 'like', '%BMKG Weather%')->first();
        $this->assertNotNull($source);

        // 1. Toggle to inactive
        $resInactive = $this->actingAs($this->admin)->putJson("/api/v1/admin/data-sources/{$source->id}/toggle", [
            'status' => 'inactive',
        ]);

        $resInactive->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $source->id,
                    'status' => 'inactive',
                    'freshness_state' => 'UNAVAILABLE',
                ],
            ]);

        $this->assertEquals('inactive', $source->fresh()->status);

        // 2. Toggle back to active
        $resActive = $this->actingAs($this->admin)->putJson("/api/v1/admin/data-sources/{$source->id}/toggle", [
            'status' => 'active',
        ]);

        $resActive->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $source->id,
                    'status' => 'active',
                ],
            ]);

        $this->assertEquals('active', $source->fresh()->status);
    }

    public function test_admin_can_trigger_synchronous_and_asynchronous_sync(): void
    {
        $source = DataSource::where('name', 'like', '%TEWS%')->first();
        $this->assertNotNull($source);

        // 1. Synchronous execution
        $resSync = $this->actingAs($this->admin)->postJson("/api/v1/admin/data-sources/{$source->id}/sync");
        $resSync->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'source',
                    'status',
                    'freshness_state',
                    'records_fetched',
                    'records_inserted',
                    'duration_ms',
                ],
            ]);

        // Clean up sync run created by test
        $lastRun = DataSourceSyncRun::where('data_source_id', $source->id)->latest()->first();
        if ($lastRun) {
            $lastRun->delete();
        }

        // 2. Asynchronous queued execution
        $resAsync = $this->actingAs($this->admin)->postJson("/api/v1/admin/data-sources/{$source->id}/sync?async=1");
        $resAsync->assertStatus(202)
            ->assertJson([
                'success' => true,
                'data' => [
                    'source' => $source->name,
                    'status' => 'QUEUED',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'correlation_id',
                ],
            ]);

        // Clean up jobs table
        DB::table('jobs')->where('payload', 'like', '%' . $source->name . '%')->delete();
    }

    public function test_admin_system_health_operational_telemetry(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/monitoring/health');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'overall_status',
                    'database' => [
                        'connected',
                        'engine',
                        'postgis',
                        'latency_ms',
                    ],
                    'queue' => [
                        'connection',
                        'pending_jobs',
                        'failed_jobs',
                        'status',
                    ],
                    'storage' => [
                        'disk',
                        'is_writable',
                    ],
                    'scheduler' => [
                        'status',
                        'heartbeat',
                    ],
                    'external_connectors',
                    'sync_metrics',
                ],
            ]);

        $this->assertTrue($response->json('data.database.connected'));
        $this->assertTrue($response->json('data.storage.is_writable'));
    }

    public function test_intelligence_officer_can_access_operational_monitoring_telemetry(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/monitoring/operational');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'telemetry_stream' => [
                        'status',
                        'active_sources',
                        'total_sources',
                        'last_heartbeat',
                    ],
                    'spatial_layers_health' => [
                        'hazard_events',
                        'community_reports',
                        'dem_mesh_5m',
                        'postgis_vector_tiles',
                    ],
                    'freshness_summary',
                    'sources',
                    'operational_alerts',
                ],
            ]);
    }

    public function test_intelligence_map_supports_postgis_bbox_filtering(): void
    {
        // Coordinates encompassing Central Jakarta area: minLon,minLat,maxLon,maxLat
        $bbox = '106.80,-6.25,106.90,-6.15';

        $response = $this->actingAs($this->intel)->getJson("/api/v1/intel/map?bbox={$bbox}&layer=events");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'type',
                    'features',
                ],
                'meta' => [
                    'total_features',
                    'bbox_applied' => [
                        'min_lon',
                        'min_lat',
                        'max_lon',
                        'max_lat',
                    ],
                    'layer_health',
                ],
            ]);

        $this->assertEquals(106.80, $response->json('meta.bbox_applied.min_lon'));
    }

    public function test_freshness_classification_distinguishes_simulated_and_live_states(): void
    {
        $classifier = app(FreshnessClassifierService::class);

        // 1. Curated baseline source is strictly SIMULATED
        $curatedSource = DataSource::where('source_type', 'curated')->first();
        $this->assertNotNull($curatedSource);
        $curatedClass = $classifier->classify($curatedSource);
        $this->assertEquals(FreshnessClassifierService::STATE_SIMULATED, $curatedClass['freshness_state']);
        $this->assertTrue($curatedClass['is_simulated']);

        // 2. Active BMKG TEWS with recent sync (< 30 min) is FRESH
        $bmkgTews = DataSource::where('endpoint_url', 'like', '%autogempa%')->first();
        $this->assertNotNull($bmkgTews);
        $bmkgTews->update([
            'status' => 'active',
            'last_successful_at' => now()->subMinutes(10),
        ]);
        $freshClass = $classifier->classify($bmkgTews);
        $this->assertEquals(FreshnessClassifierService::STATE_FRESH, $freshClass['freshness_state']);

        // 3. BMKG TEWS with delayed sync (> 30 min, < 120 min) is DELAYED
        $bmkgTews->update([
            'last_successful_at' => now()->subMinutes(60),
        ]);
        $delayedClass = $classifier->classify($bmkgTews);
        $this->assertEquals(FreshnessClassifierService::STATE_DELAYED, $delayedClass['freshness_state']);

        // 4. BMKG TEWS with stale sync (> 120 min) is STALE
        $bmkgTews->update([
            'last_successful_at' => now()->subMinutes(200),
        ]);
        $staleClass = $classifier->classify($bmkgTews);
        $this->assertEquals(FreshnessClassifierService::STATE_STALE, $staleClass['freshness_state']);
    }

    public function test_error_message_sanitization_masks_credentials_and_ips(): void
    {
        $service = app(\App\Services\ExternalData\DataSyncService::class);

        $dirtyMessage = 'Failed to connect to https://user:super_secret_password123@api.provider.go.id/query?token=secret_api_token_abc at 192.168.1.50:5432.';
        $sanitized = $service->sanitizeErrorMessage($dirtyMessage);

        $this->assertStringNotContainsString('super_secret_password123', $sanitized);
        $this->assertStringNotContainsString('secret_api_token_abc', $sanitized);
        $this->assertStringNotContainsString('192.168.1.50', $sanitized);
        $this->assertStringContainsString('[REDACTED]', $sanitized);
        $this->assertStringContainsString('[SERVER_IP]', $sanitized);
    }

    public function test_regular_citizen_and_guest_are_strictly_forbidden_from_operational_monitoring(): void
    {
        $endpoints = [
            ['GET', '/api/v1/admin/data-sources'],
            ['GET', '/api/v1/admin/monitoring/health'],
            ['GET', '/api/v1/admin/monitoring/jobs/failed'],
            ['GET', '/api/v1/intel/monitoring/operational'],
            ['GET', '/api/v1/intel/data-sources'],
        ];

        // 1. Unauthenticated guest receives 401
        foreach ($endpoints as [$method, $uri]) {
            $res = $this->getJson($uri);
            $res->assertStatus(401);
        }

        // 2. Regular citizen receives 403 Forbidden
        foreach ($endpoints as [$method, $uri]) {
            $res = $this->actingAs($this->user)->getJson($uri);
            $res->assertStatus(403);
        }
    }

    public function test_request_correlation_id_is_propagated_in_response_headers(): void
    {
        $testCorrelation = 'test-corr-id-998877';

        $response = $this->withHeader('X-Request-ID', $testCorrelation)->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertHeader('X-Request-ID', $testCorrelation);
    }

    public function test_postgis_bounding_box_validation_and_rejections(): void
    {
        // 1. Incomplete Bounding Box (3 parameters instead of 4) -> 422
        $resIncomplete = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?bbox=106.8,-6.2,106.9');
        $resIncomplete->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonValidationErrors(['bbox']);

        // 2. Non-numeric Bounding Box -> 422
        $resNonNumeric = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?bbox=alpha,beta,gamma,delta');
        $resNonNumeric->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonValidationErrors(['bbox']);

        // 3. Out-of-range Coordinates (Lon > 180, Lat > 90) -> 422
        $resOutOfRange = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?bbox=200,95,210,98');
        $resOutOfRange->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonValidationErrors(['bbox']);

        // 4. Inverted Bounding Box (min > max) -> 422
        $resInverted = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?bbox=107,-6.1,106,-6.2');
        $resInverted->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonValidationErrors(['bbox']);

        // 5. Valid empty area bounding box (Null Island / Southern Ocean) -> 200 with 0 features
        $resEmpty = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?bbox=0,0,0.01,0.01');
        $resEmpty->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonCount(0, 'data.features');

        // 6. Layer filtering: events only vs reports only
        $resEvents = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?layer=events');
        $resEvents->assertStatus(200);
        foreach ($resEvents->json('data.features') as $f) {
            $this->assertEquals('hazard_events', $f['properties']['layer']);
        }

        $resReports = $this->actingAs($this->intel)->getJson('/api/v1/intel/map?layer=reports');
        $resReports->assertStatus(200);
        foreach ($resReports->json('data.features') as $f) {
            $this->assertEquals('community_reports', $f['properties']['layer']);
            // Privacy protection: ensure no personal user information in feature properties
            $this->assertArrayNotHasKey('user_id', $f['properties']);
            $this->assertArrayNotHasKey('user', $f['properties']);
            $this->assertArrayNotHasKey('email', $f['properties']);
            $this->assertArrayNotHasKey('phone', $f['properties']);
        }
    }

    public function test_freshness_classification_all_six_states(): void
    {
        $classifier = app(FreshnessClassifierService::class);

        // State 1: SIMULATED (curated data)
        $curated = DataSource::where('source_type', 'curated')->first();
        $this->assertEquals(FreshnessClassifierService::STATE_SIMULATED, $classifier->classify($curated)['freshness_state']);

        // State 2: UNAVAILABLE (inactive source)
        $inactive = DataSource::where('status', 'inactive')->first() ?? DataSource::first();
        $inactive->update(['status' => 'inactive']);
        $this->assertEquals(FreshnessClassifierService::STATE_UNAVAILABLE, $classifier->classify($inactive)['freshness_state']);
        $inactive->update(['status' => 'active']);

        // State 3: UNKNOWN (active source never polled)
        $unpolled = DataSource::create([
            'name' => 'Unpolled Test Feed',
            'provider' => 'Test Lab',
            'category' => 'weather',
            'endpoint_url' => 'https://test.lab/feed',
            'status' => 'active',
            'sync_interval_minutes' => 60,
            'source_type' => 'api',
            'is_simulated' => false,
            'last_successful_at' => null,
            'last_fetched_at' => null,
        ]);
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $classifier->classify($unpolled)['freshness_state']);

        // State 4: FRESH (within fresh threshold e.g. 10m ago)
        $unpolled->update(['last_successful_at' => now()->subMinutes(10)]);
        $this->assertEquals(FreshnessClassifierService::STATE_FRESH, $classifier->classify($unpolled)['freshness_state']);

        // State 5: DELAYED (between 60m and 180m)
        $unpolled->update(['last_successful_at' => now()->subMinutes(100)]);
        $this->assertEquals(FreshnessClassifierService::STATE_DELAYED, $classifier->classify($unpolled)['freshness_state']);

        // State 6: STALE (> 180m ago)
        $unpolled->update(['last_successful_at' => now()->subMinutes(300)]);
        $this->assertEquals(FreshnessClassifierService::STATE_STALE, $classifier->classify($unpolled)['freshness_state']);

        // Edge case: Acceptable clock skew (+2 minutes future drift)
        $unpolled->update(['last_successful_at' => now()->addMinutes(2)]);
        $this->assertEquals(FreshnessClassifierService::STATE_FRESH, $classifier->classify($unpolled)['freshness_state']);

        // Edge case: Abnormal future timestamp (> 5 minutes drift) -> UNKNOWN / Anomaly
        $unpolled->update(['last_successful_at' => now()->addMinutes(30)]);
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $classifier->classify($unpolled)['freshness_state']);

        // Clean up test feed
        $unpolled->delete();
    }

    public function test_failed_job_retry_and_dismiss_audit_and_rbac(): void
    {
        // Insert a dummy job into failed_jobs
        $jobUuid = 'test-job-uuid-' . uniqid();
        $jobId = DB::table('failed_jobs')->insertGetId([
            'uuid' => $jobUuid,
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['job' => 'App\\Jobs\\SyncDataSourceJob', 'data' => ['source_id' => 1]]),
            'exception' => 'RuntimeException: Simulated network timeout in Audit Test',
            'failed_at' => now(),
        ]);

        // 1. Citizen cannot retry or dismiss (403)
        $resUserRetry = $this->actingAs($this->user)->postJson("/api/v1/admin/monitoring/jobs/failed/{$jobId}/retry");
        $resUserRetry->assertStatus(403);

        $resUserDismiss = $this->actingAs($this->user)->deleteJson("/api/v1/admin/monitoring/jobs/failed/{$jobId}");
        $resUserDismiss->assertStatus(403);

        // 2. Intelligence Officer cannot retry or dismiss (403)
        $resIntelRetry = $this->actingAs($this->intel)->postJson("/api/v1/admin/monitoring/jobs/failed/{$jobId}/retry");
        $resIntelRetry->assertStatus(403);

        // 3. Admin can dismiss the specific failed job
        $syncRunsCountBefore = DataSourceSyncRun::count();
        $resAdminDismiss = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/monitoring/jobs/failed/{$jobId}");
        $resAdminDismiss->assertStatus(200)
            ->assertJson(['success' => true]);

        // Verify single job dismissed and sync runs preserved
        $this->assertNull(DB::table('failed_jobs')->where('id', $jobId)->first());
        $this->assertEquals($syncRunsCountBefore, DataSourceSyncRun::count(), 'Sync run history must remain preserved upon job dismiss.');
    }
}
