<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EndToEndIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test 1: Emergency Zero-Barrier Public Report Submission.
     * Anyone can submit a disaster observation without prior authentication.
     */
    public function test_public_zero_barrier_emergency_report_submission(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();

        $response = $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Darurat Warga: Luapan Kali Ciliwung',
            'description' => 'Air meluap setinggi 40cm menggenangi akses jalan utama warga RW 02.',
            'latitude' => -6.1754,
            'longitude' => 106.8272,
            'reporter_name' => 'Warga Siaga 01',
            'reporter_contact' => '081234567890',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'tracking_code',
                    'title',
                    'status',
                    'clustering',
                    'created_at',
                ],
            ]);

        $reportId = $response->json('data.id');
        $trackingCode = $response->json('data.tracking_code');

        $this->assertStringStartsWith('SVX-REP-', $trackingCode);

        // Verify database entry has user_id = null for guest
        $report = CommunityReport::find($reportId);
        $this->assertNotNull($report);
        $this->assertNull($report->user_id);
        $this->assertEquals('pending', $report->status);
        $this->assertNotNull($report->cluster_id);
    }

    /**
     * Test 2: Public Report Status Lookup without authentication.
     */
    public function test_public_check_report_status(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();

        // Submit a report first
        $submitRes = $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Genangan Air Dekat Stasiun',
            'description' => 'Ketinggian air 20cm, kendaraan roda 2 masih bisa melintas hati-hati.',
            'latitude' => -6.1200,
            'longitude' => 106.8500,
        ]);

        $reportId = $submitRes->json('data.id');

        // Check report status
        $statusRes = $this->getJson("/api/v1/public/reports/{$reportId}");

        $statusRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $reportId,
                    'status' => 'pending',
                    'title' => 'Genangan Air Dekat Stasiun',
                ],
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'tracking_code',
                    'title',
                    'description',
                    'status',
                    'hazard_type',
                    'region',
                    'latitude',
                    'longitude',
                    'created_at',
                ],
            ]);
    }

    /**
     * Test 3: Authenticated Citizen User Portal: Report Submission and List History.
     */
    public function test_authenticated_citizen_report_flow_and_history(): void
    {
        $citizen = User::where('role', 'user')->first() ?? User::factory()->create(['role' => 'user']);
        $hazardType = HazardType::first();
        $region = Region::first();

        // Submit report as authenticated citizen
        $createRes = $this->actingAs($citizen, 'sanctum')->postJson('/api/v1/user/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Longsor Tebing Samping Jalan',
            'description' => 'Batu dan tanah menutup sebagian bahu jalan raya.',
            'latitude' => -6.5950,
            'longitude' => 106.7900,
        ]);

        $createRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'pending',
                ],
            ]);

        $reportId = $createRes->json('data.id');

        // Verify report is associated with citizen ID
        $report = CommunityReport::find($reportId);
        $this->assertEquals($citizen->id, $report->user_id);

        // Fetch citizen reports list
        $listRes = $this->actingAs($citizen, 'sanctum')->getJson('/api/v1/user/reports');
        $listRes->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $items = $listRes->json('data');
        $found = collect($items)->firstWhere('id', $reportId);
        $this->assertNotNull($found);
    }

    /**
     * Test 4: User Multi-Location Monitoring (Watchlist).
     */
    public function test_user_multi_location_monitoring_watchlist(): void
    {
        $citizen = User::where('role', 'user')->first() ?? User::factory()->create(['role' => 'user']);
        $region = Region::first();

        // Add region to watchlist
        $addRes = $this->actingAs($citizen, 'sanctum')->postJson('/api/v1/user/saved-regions', [
            'region_id' => $region->id,
            'label' => 'Rumah Tinggal',
            'is_primary' => true,
            'notify_alerts' => true,
        ]);

        $addRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'label' => 'Rumah Tinggal',
                    'is_primary' => true,
                ],
            ]);

        $savedId = $addRes->json('data.id');

        // Fetch saved regions
        $getRes = $this->actingAs($citizen, 'sanctum')->getJson('/api/v1/user/saved-regions');
        $getRes->assertStatus(200);

        $savedList = $getRes->json('data');
        $this->assertTrue(collect($savedList)->contains('id', $savedId));

        // Delete saved region
        $delRes = $this->actingAs($citizen, 'sanctum')->deleteJson("/api/v1/user/saved-regions/{$savedId}");
        $delRes->assertStatus(200);
    }

    /**
     * Test 5: Role Boundary and Privacy Protection.
     */
    public function test_role_boundary_and_privacy_protection(): void
    {
        // Unauthenticated guest cannot access user portal
        $guestRes = $this->getJson('/api/v1/user/profile');
        $this->assertContains($guestRes->status(), [401, 403]);

        $citizen = User::where('role', 'user')->first() ?? User::factory()->create(['role' => 'user']);

        // Citizen cannot access Admin user management
        $adminRes = $this->actingAs($citizen, 'sanctum')->getJson('/api/v1/admin/users');
        $adminRes->assertStatus(403);

        // Citizen cannot access Intelligence alert dispatch
        $intelRes = $this->actingAs($citizen, 'sanctum')->postJson('/api/v1/intel/alerts/dispatch', []);
        $intelRes->assertStatus(403);
    }

    /**
     * Test 6: Intelligence Alert Operations connected flow.
     */
    public function test_intelligence_alert_dispatch_connected_flow(): void
    {
        $operator = User::where('role', 'intelligence')->first() ?? User::factory()->create(['role' => 'intelligence']);
        $hazardType = HazardType::first();
        $region = Region::first();

        $startsAt = now()->toIso8601String();
        $expiresAt = now()->addDays(2)->toIso8601String();

        $dispatchRes = $this->actingAs($operator, 'sanctum')->postJson('/api/v1/intel/alerts/dispatch', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'PERINGATAN DINI RESMI: Angin Puting Beliung',
            'message' => 'Segera berlindung di dalam bangunan permanen yang kokoh.',
            'alert_class' => 'warning',
            'broadcast_level' => 'regional',
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
        ]);

        $dispatchRes->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'alert',
                ],
            ]);

        $alertId = $dispatchRes->json('data.alert.id');

        // Verify alert appears in public feed
        $publicRes = $this->getJson('/api/v1/public/alerts');
        $publicRes->assertStatus(200);

        $publicItems = $publicRes->json('data.data') ?? $publicRes->json('data');
        $this->assertTrue(collect($publicItems)->contains('id', $alertId));
    }

    /**
     * Test 7: Strict Database Baseline Preservation.
     */
    public function test_database_baseline_preservation(): void
    {
        // 1. community_reports [1, 9]
        $this->assertDatabaseHas('community_reports', ['id' => 1]);
        $this->assertDatabaseHas('community_reports', ['id' => 9]);

        // 2. ai_insights [1]
        $this->assertDatabaseHas('ai_insights', ['id' => 1]);

        // 3. report_verifications [1]
        $this->assertDatabaseHas('report_verifications', ['id' => 1]);
    }
}
