<?php

namespace Tests\Feature;

use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\ReportVerification;
use App\Models\User;
use App\Models\UserNotification;
use Database\Seeders\SentravaxMasterSeeder;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->admin = User::where('email', 'admin@sentravax.go.id')->first();
    }

    public function test_admin_overview_returns_operational_stats_and_postgis(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/overview');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'stats' => [
                        'total_users',
                        'curated_events_total',
                        'curated_events_active',
                        'pending_verification_reports',
                        'active_cap_alerts',
                    ],
                    'infrastructure' => [
                        'database_connected',
                        'postgis_version',
                        'database_engine',
                    ],
                    'data_sources_status',
                ],
            ]);
    }

    public function test_admin_data_sources_and_manual_sync(): void
    {
        $resList = $this->actingAs($this->admin)->getJson('/api/v1/admin/data-sources');
        $resList->assertStatus(200)->assertJson(['success' => true]);

        $source = DataSource::first();
        $resSync = $this->actingAs($this->admin)->postJson("/api/v1/admin/data-sources/{$source->id}/sync");

        $resSync->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'source',
                    'status',
                    'records_fetched',
                    'records_inserted',
                ],
            ]);
    }

    public function test_admin_user_management_lifecycle(): void
    {
        // 1. Create a new user with role 'intelligence'
        $resCreate = $this->actingAs($this->admin)->postJson('/api/v1/admin/users', [
            'name' => 'Analis Data Lapangan',
            'email' => 'analis.baru@sentravax.go.id',
            'role' => 'intelligence',
            'password' => 'PasswordAman123!',
        ]);

        $resCreate->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Analis Data Lapangan',
                    'role' => 'intelligence',
                ],
            ]);

        $newUserId = $resCreate->json('data.id');

        // 2. Update role to 'user'
        $resUpdate = $this->actingAs($this->admin)->putJson("/api/v1/admin/users/{$newUserId}/role", [
            'role' => 'user',
        ]);
        $resUpdate->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'role' => 'user',
                ],
            ]);

        // 3. Delete user
        $resDelete = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$newUserId}");
        $resDelete->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_admin_cannot_demote_or_delete_self(): void
    {
        // Try demoting self to user
        $resDemote = $this->actingAs($this->admin)->putJson("/api/v1/admin/users/{$this->admin->id}/role", [
            'role' => 'user',
        ]);
        $resDemote->assertStatus(422);

        // Try deleting self
        $resDelete = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$this->admin->id}");
        $resDelete->assertStatus(422);
    }

    public function test_admin_cannot_assign_obsolete_roles(): void
    {
        $targetUser = User::where('role', 'user')->first();

        // Check rejection of super_admin, analyst, operator
        foreach (['super_admin', 'analyst', 'operator', 'moderator'] as $invalidRole) {
            $res = $this->actingAs($this->admin)->putJson("/api/v1/admin/users/{$targetUser->id}/role", [
                'role' => $invalidRole,
            ]);
            $res->assertStatus(422);
        }
    }

    public function test_admin_hazard_event_crud(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();

        // 1. Create event
        $resCreate = $this->actingAs($this->admin)->postJson('/api/v1/admin/events', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Erupsi Abu Vulkanik Gunung Api Aktif',
            'description' => 'Kolom abu teramati membubung setinggi 1.500 meter di atas puncak.',
            'severity' => 'severe',
            'status' => 'active',
            'latitude' => -7.5407,
            'longitude' => 110.4457,
            'occurred_at' => now()->toIso8601String(),
        ]);

        $resCreate->assertStatus(201)->assertJson(['success' => true]);
        $eventId = $resCreate->json('data.id');

        // 2. Show event
        $resShow = $this->actingAs($this->admin)->getJson("/api/v1/admin/events/{$eventId}");
        $resShow->assertStatus(200)->assertJson(['success' => true]);

        // 3. Update event
        $resUpdate = $this->actingAs($this->admin)->putJson("/api/v1/admin/events/{$eventId}", [
            'status' => 'contained',
            'severity' => 'moderate',
        ]);
        $resUpdate->assertStatus(200)->assertJson(['success' => true]);

        // 4. Delete event
        $resDelete = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/events/{$eventId}");
        $resDelete->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_admin_cap_alert_creation_and_dissemination(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();

        $resAlert = $this->actingAs($this->admin)->postJson('/api/v1/admin/alerts', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'PERINGATAN DINI: Potensi Gelombang Pasang & Banjir Rob Pesisir',
            'message' => 'Masyarakat pesisir diimbau waspada fase pasang maksimum air laut dalam 24 jam ke depan.',
            'alert_class' => 'warning',
            'broadcast_level' => 'regional',
            'starts_at' => now()->toIso8601String(),
            'expires_at' => now()->addHours(24)->toIso8601String(),
        ]);

        $resAlert->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['id', 'title', 'alert_class']]);
    }

    public function test_admin_moderation_verify_and_audit_trail(): void
    {
        // Fetch or create a community report
        $hazardType = HazardType::first();
        $region = Region::first();
        $user = User::where('role', 'user')->first();

        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Genangan Jalur Rel Kereta',
            'description' => 'Bantalan rel terendam air setinggi 20cm.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Admin verifies report
        $resVerify = $this->actingAs($this->admin)->postJson("/api/v1/admin/reports/{$reportId}/verify", [
            'status' => 'verified',
            'notes' => 'Terkonfirmasi dengan stasiun pemantauan terdekat.',
        ]);

        $resVerify->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'verified',
                ],
            ]);

        // Assert audit trail was recorded
        $this->assertDatabaseHas('report_verifications', [
            'community_report_id' => $reportId,
            'verified_by' => $this->admin->id,
            'new_status' => 'verified',
        ]);
    }
}
