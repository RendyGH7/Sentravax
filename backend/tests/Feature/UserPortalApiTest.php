<?php

namespace Tests\Feature;

use App\Models\EmergencyScenario;
use App\Models\HazardType;
use App\Models\PreparednessChecklistItem;
use App\Models\Region;
use App\Models\User;
use Database\Seeders\SentravaxMasterSeeder;
use Tests\TestCase;

class UserPortalApiTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->user = User::where('email', 'user@sentravax.id')->first();
    }

    public function test_user_dashboard_returns_telemetry_and_preparedness(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/user/dashboard');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'role'],
                    'preparedness_summary',
                    'saved_regions_count',
                    'emergency_contacts_count',
                    'active_regional_alerts',
                    'unread_notifications_count',
                ],
            ]);
    }

    public function test_user_can_view_and_update_profile(): void
    {
        $resGet = $this->actingAs($this->user)->getJson('/api/v1/user/profile');
        $resGet->assertStatus(200)->assertJson(['success' => true]);

        $resUpdate = $this->actingAs($this->user)->putJson('/api/v1/user/profile', [
            'name' => 'Warga Siaga Teladan',
        ]);

        $resUpdate->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Warga Siaga Teladan',
                ],
            ]);
    }

    public function test_user_can_manage_saved_regions(): void
    {
        $region = Region::first();

        // 1. Add saved region
        $resAdd = $this->actingAs($this->user)->postJson('/api/v1/user/saved-regions', [
            'region_id' => $region->id,
            'label' => 'Rumah Keluarga',
            'is_primary' => true,
        ]);

        $resAdd->assertStatus(201)->assertJson(['success' => true]);
        $savedId = $resAdd->json('data.id');

        // 2. List saved regions
        $resList = $this->actingAs($this->user)->getJson('/api/v1/user/saved-regions');
        $resList->assertStatus(200)->assertJson(['success' => true]);

        // 3. Delete saved region
        $resDel = $this->actingAs($this->user)->deleteJson("/api/v1/user/saved-regions/{$savedId}");
        $resDel->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_user_can_manage_family_plan_and_contacts(): void
    {
        // 1. Get & Update Plan
        $resPlan = $this->actingAs($this->user)->getJson('/api/v1/user/preparedness/plan');
        $resPlan->assertStatus(200)->assertJson(['success' => true]);

        $resUpdate = $this->actingAs($this->user)->putJson('/api/v1/user/preparedness/plan', [
            'title' => 'Rencana Siaga Bencana Keluarga Mandiri',
            'assembly_point' => 'Lapangan Fasum RT 04',
            'evacuation_route' => 'Jalur Utara tembus jalan raya protokol',
        ]);
        $resUpdate->assertStatus(200)->assertJson(['success' => true]);

        // 2. Add emergency contact
        $resContact = $this->actingAs($this->user)->postJson('/api/v1/user/preparedness/contacts', [
            'name' => 'Posko BPBD Wilayah',
            'relationship' => 'Otoritas Darurat',
            'phone_number' => '112',
            'is_primary' => true,
        ]);
        $resContact->assertStatus(201)->assertJson(['success' => true]);
        $contactId = $resContact->json('data.id');

        // 3. Delete contact
        $resDel = $this->actingAs($this->user)->deleteJson("/api/v1/user/preparedness/contacts/{$contactId}");
        $resDel->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_user_can_toggle_go_bag_checklist_items(): void
    {
        $item = PreparednessChecklistItem::first();

        // 1. Get checklist
        $resList = $this->actingAs($this->user)->getJson('/api/v1/user/preparedness/checklist');
        $resList->assertStatus(200)->assertJson(['success' => true]);

        // 2. Toggle item checked
        $resToggle = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item->id}/toggle");
        $resToggle->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'item_id' => $item->id,
                ],
            ]);
    }

    public function test_user_can_take_interactive_simulation_scenario(): void
    {
        $scenario = EmergencyScenario::with('questions')->first();

        $resScenario = $this->actingAs($this->user)->getJson("/api/v1/user/preparedness/scenarios/{$scenario->id}");
        $resScenario->assertStatus(200)->assertJson(['success' => true]);

        // Submit attempt with answers
        $answers = [];
        foreach ($scenario->questions as $q) {
            foreach ($q->options as $opt) {
                if (!empty($opt['is_correct'])) {
                    $answers[$q->id] = $opt['id'];
                    break;
                }
            }
        }

        $resAttempt = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/scenarios/{$scenario->id}/attempt", [
            'answers' => $answers,
        ]);

        $resAttempt->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'passed' => true,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'attempt_id',
                    'earned_score',
                    'total_possible_score',
                    'passed',
                    'evaluation_summary',
                ],
            ]);
    }

    public function test_user_can_submit_and_view_community_report_with_ai_clustering(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();

        // 1. Submit report
        $resSubmit = $this->actingAs($this->user)->postJson('/api/v1/user/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Banjir Genangan 40cm Menutupi Akses Jalan',
            'description' => 'Air meluap cepat dari drainase utama akibat curah hujan lebat.',
            'latitude' => -6.2146,
            'longitude' => 106.8451,
        ]);

        $resSubmit->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'status',
                    'clustering' => [
                        'cluster_id',
                        'nearby_reports_count',
                        'duplicate_suspected',
                    ],
                ],
            ]);

        $reportId = $resSubmit->json('data.id');

        // 2. View user reports
        $resList = $this->actingAs($this->user)->getJson('/api/v1/user/reports');
        $resList->assertStatus(200)->assertJson(['success' => true]);

        // 3. View single report detail
        $resDetail = $this->actingAs($this->user)->getJson("/api/v1/user/reports/{$reportId}");
        $resDetail->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $reportId,
                ],
            ]);
    }
}
