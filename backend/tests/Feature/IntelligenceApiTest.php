<?php

namespace Tests\Feature;

use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use Database\Seeders\SentravaxMasterSeeder;
use Tests\TestCase;

class IntelligenceApiTest extends TestCase
{
    protected User $intel;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->intel = User::where('email', 'intelligence@sentravax.go.id')->first();
        $this->admin = User::where('email', 'admin@sentravax.go.id')->first();
    }

    public function test_intel_overview_returns_telemetry_and_simulation_projection(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/overview');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'telemetry' => [
                        'stream_status' => 'STREAMING AKTIF',
                    ],
                    'simulation_projection' => [
                        'scenario_name' => 'Simulasi Proyeksi Genangan dan Bahaya Spasial',
                        'hazard_type' => 'Banjir Luapan',
                        'metrics' => [
                            'exposed_population' => 42150,
                        ],
                    ],
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'telemetry',
                    'metrics' => [
                        'active_threats',
                        'unverified_reports',
                        'active_cap_alerts',
                        'proactive_insights_generated',
                    ],
                    'simulation_projection',
                    'recent_insights',
                ],
            ]);
    }

    public function test_intel_map_returns_geojson_layers(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/map');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'FeatureCollection',
                ],
            ])
            ->assertJsonStructure([
                'data' => ['features'],
            ]);
    }

    public function test_intel_risk_engine_evaluation(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $response = $this->actingAs($this->intel)->postJson('/api/v1/intel/risk/evaluate', [
            'region_id' => $region->id,
            'hazard_type_id' => $hazardType->id,
            'title' => 'Evaluasi Risiko Komprehensif Siklon Tropis',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'region_id',
                    'hazard_type_id',
                    'risk_score',
                    'risk_level',
                    'methodology_version',
                    'calculation_factors',
                ],
            ]);
    }

    public function test_intel_proactive_insight_generation(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $response = $this->actingAs($this->intel)->postJson('/api/v1/intel/insights/generate', [
            'region_id' => $region->id,
            'hazard_type_id' => $hazardType->id,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'insight_type' => 'proactive_resilience',
                    'generation_mode' => 'rule_based',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'summary',
                    'recommendations',
                    'confidence_score',
                    'evidence',
                ],
            ]);
    }

    public function test_intel_reports_queue_and_verification_audit(): void
    {
        // 1. Get reports queue
        $resQueue = $this->actingAs($this->intel)->getJson('/api/v1/intel/reports/queue');
        $resQueue->assertStatus(200)->assertJson(['success' => true]);

        // 2. Insert report and verify
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Anomali Pergerakan Tanah Lereng',
            'description' => 'Retakan memanjang 15 meter dengan bukaan 5 cm setelah hujan.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $resVerify = $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
            'status' => 'verified',
            'notes' => 'Korelasi citra radar dan sensor retakan PVMBG mengonfirmasi anomali.',
        ]);

        $resVerify->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('report_verifications', [
            'community_report_id' => $reportId,
            'verified_by' => $this->intel->id,
            'new_status' => 'verified',
        ]);
    }

    public function test_intel_cap_alert_dispatch_and_dissemination(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $response = $this->actingAs($this->intel)->postJson('/api/v1/intel/alerts/dispatch', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'DISSEMINASI CAP: Siaga Banjir Luapan DAS Ciliwung Hilir',
            'message' => 'Status TMA Bendung Katulampa meningkat menjadi Siaga 2. Jalur bantaran sungai waspada limpasan dalam 6-9 jam ke depan.',
            'alert_class' => 'warning',
            'broadcast_level' => 'regional',
            'starts_at' => now()->toIso8601String(),
            'expires_at' => now()->addHours(12)->toIso8601String(),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dissemination' => [
                        'cap_status' => 'DISTRIBUTED',
                    ],
                ],
            ]);
    }

    public function test_cross_role_access_rejection_between_admin_and_intelligence(): void
    {
        // 1. Intelligence user trying to access Admin Console receives 403 Forbidden
        $resIntelToAdmin = $this->actingAs($this->intel)->getJson('/api/v1/admin/overview');
        $resIntelToAdmin->assertStatus(403);

        // 2. Admin user trying to access Intelligence Center receives 403 Forbidden
        $resAdminToIntel = $this->actingAs($this->admin)->getJson('/api/v1/intel/overview');
        $resAdminToIntel->assertStatus(403);
    }
}

