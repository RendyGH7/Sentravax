<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\Region;
use App\Models\Shelter;
use App\Models\User;
use Database\Seeders\EmergencyDirectorySeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EmergencyDirectoryApiTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $intelligenceUser;
    protected User $regularUser;
    protected Region $dkiProvince;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::where('role', User::ROLE_ADMIN)->first() ?? User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->intelligenceUser = User::where('role', User::ROLE_INTELLIGENCE)->first() ?? User::factory()->create(['role' => User::ROLE_INTELLIGENCE]);
        $this->regularUser = User::where('role', User::ROLE_USER)->first() ?? User::factory()->create(['role' => User::ROLE_USER]);

        $this->dkiProvince = Region::where('code', 'ID-JK')->where('level', 'province')->first();
    }

    // ==========================================
    // A. PUBLIC API TESTS
    // ==========================================

    public function test_guest_can_read_public_emergency_directory(): void
    {
        $response = $this->getJson('/api/v1/public/emergency-contacts');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id', 'name', 'slug', 'category', 'scope', 'region',
                        'address', 'latitude', 'longitude', 'description',
                        'channels' => [
                            '*' => [
                                'id', 'channel_type', 'channel_classification',
                                'label', 'value', 'is_toll_free', 'is_primary',
                                'operating_hours', 'source_name', 'source_url',
                                'verified_at', 'sort_order',
                            ]
                        ]
                    ]
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);
    }

    public function test_user_and_intelligence_can_read_public_emergency_directory(): void
    {
        $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/public/emergency-contacts')
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->actingAs($this->intelligenceUser, 'sanctum')
            ->getJson('/api/v1/public/emergency-contacts')
            ->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_parent_draft_or_unverified_does_not_appear_in_public_directory(): void
    {
        // Damkar 113 is in DB with publication_status=draft, verification_status=unverified
        $damkar = EmergencyContact::where('slug', 'damkar-nasional')->first();
        $this->assertNotNull($damkar);

        $response = $this->getJson('/api/v1/public/emergency-contacts');
        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($damkar->id, $ids, 'Draft/unverified parent must never appear in public directory');

        // Detail endpoint should also return 404 for draft parent
        $detailResponse = $this->getJson("/api/v1/public/emergency-contacts/{$damkar->id}");
        $detailResponse->assertStatus(404);

        $detailSlugResponse = $this->getJson("/api/v1/public/emergency-contacts/{$damkar->slug}");
        $detailSlugResponse->assertStatus(404);
    }

    public function test_parent_soft_deleted_does_not_appear_in_public_directory(): void
    {
        $bnpb = EmergencyContact::where('slug', 'pusdalops-bnpb')->first();
        $this->assertNotNull($bnpb);

        $bnpb->delete(); // Soft delete

        $response = $this->getJson('/api/v1/public/emergency-contacts');
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($bnpb->id, $ids);

        $this->getJson("/api/v1/public/emergency-contacts/{$bnpb->id}")->assertStatus(404);
    }

    public function test_inactive_and_unverified_channels_do_not_leak_to_public(): void
    {
        // BNPB has channel (021) 29827666 which is unverified
        $bnpb = EmergencyContact::where('slug', 'pusdalops-bnpb')->first();
        $this->assertNotNull($bnpb);

        $unverifiedChannel = $bnpb->channels()->where('value', '(021) 29827666')->first();
        $this->assertNotNull($unverifiedChannel);
        $this->assertEquals(EmergencyContactChannel::STATUS_UNVERIFIED, $unverifiedChannel->verification_status);

        $response = $this->getJson("/api/v1/public/emergency-contacts/{$bnpb->slug}");
        $response->assertStatus(200);

        $channelValues = collect($response->json('data.channels'))->pluck('value')->toArray();
        $this->assertNotContains('(021) 29827666', $channelValues, 'Unverified channel must not appear in public response');

        // Verified active channels like 117 and (021) 29827444 should appear
        $this->assertContains('117', $channelValues);
        $this->assertContains('(021) 29827444', $channelValues);
    }

    public function test_public_filters_category_scope_and_region(): void
    {
        // Filter by scope=national
        $nationalRes = $this->getJson('/api/v1/public/emergency-contacts?scope=national');
        $nationalRes->assertStatus(200);
        foreach ($nationalRes->json('data') as $item) {
            $this->assertEquals('national', $item['scope']);
            $this->assertNull($item['region']);
        }

        // Filter by scope=provincial
        $provincialRes = $this->getJson('/api/v1/public/emergency-contacts?scope=provincial');
        $provincialRes->assertStatus(200);
        foreach ($provincialRes->json('data') as $item) {
            $this->assertEquals('provincial', $item['scope']);
            $this->assertNotNull($item['region']);
        }

        // Filter by region_id
        $regionRes = $this->getJson("/api/v1/public/emergency-contacts?region_id={$this->dkiProvince->id}");
        $regionRes->assertStatus(200);
        foreach ($regionRes->json('data') as $item) {
            $this->assertEquals($this->dkiProvince->id, $item['region']['id']);
        }
    }

    public function test_invalid_filter_parameters_fail_validation(): void
    {
        $this->getJson('/api/v1/public/emergency-contacts?scope=invalid_scope')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['scope']);

        $this->getJson('/api/v1/public/emergency-contacts?region_id=999999')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['region_id']);
    }

    // ==========================================
    // B. AUTHORIZATION & ACCESS CONTROL TESTS
    // ==========================================

    public function test_guest_cannot_access_admin_emergency_directory(): void
    {
        $this->getJson('/api/v1/admin/emergency-contacts')->assertStatus(401);
        $this->postJson('/api/v1/admin/emergency-contacts', [])->assertStatus(401);
        $this->deleteJson('/api/v1/admin/emergency-contacts/1')->assertStatus(401);
    }

    public function test_regular_user_cannot_access_admin_emergency_directory(): void
    {
        $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/admin/emergency-contacts')
            ->assertStatus(403);

        $this->actingAs($this->regularUser, 'sanctum')
            ->postJson('/api/v1/admin/emergency-contacts', [])
            ->assertStatus(403);
    }

    public function test_intelligence_has_read_only_access_to_admin_directory(): void
    {
        // Intelligence can read list & detail
        $this->actingAs($this->intelligenceUser, 'sanctum')
            ->getJson('/api/v1/admin/emergency-contacts')
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->actingAs($this->intelligenceUser, 'sanctum')
            ->getJson('/api/v1/admin/emergency-contacts/1')
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        // Intelligence CANNOT mutate (POST, PUT, DELETE, PATCH)
        $this->actingAs($this->intelligenceUser, 'sanctum')
            ->postJson('/api/v1/admin/emergency-contacts', [
                'name' => 'Unauthorized Post',
            ])->assertStatus(403);

        $this->actingAs($this->intelligenceUser, 'sanctum')
            ->deleteJson('/api/v1/admin/emergency-contacts/1')
            ->assertStatus(403);

        $this->actingAs($this->intelligenceUser, 'sanctum')
            ->patchJson('/api/v1/admin/emergency-contacts/1/publication', [
                'publication_status' => 'draft',
            ])->assertStatus(403);
    }

    // ==========================================
    // C. ADMIN CRUD & DATA INTEGRITY TESTS
    // ==========================================

    public function test_admin_can_create_parent_and_channel_with_atomic_transaction(): void
    {
        $payload = [
            'name' => 'Badan Penanggulangan Bencana Jawa Barat',
            'slug' => 'bpbd-jabar-test',
            'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
            'scope' => EmergencyContact::SCOPE_NATIONAL, // test national scope
            'region_id' => null,
            'address' => 'Jl. Soekarno Hatta No. 629, Bandung',
            'latitude' => -6.9372220,
            'longitude' => 107.6536110,
            'description' => 'BPBD Provinsi Jawa Barat',
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_PUBLISHED,
            'channels' => [
                [
                    'channel_type' => EmergencyContactChannel::TYPE_PHONE,
                    'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                    'label' => 'Pusdalops BPBD Jabar',
                    'value' => '(022) 73513113',
                    'is_toll_free' => false,
                    'is_primary' => true,
                    'operating_hours' => '24 Jam',
                    'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
                    'source_name' => 'Portal BPBD Jabar',
                    'source_url' => 'https://bpbd.jabarprov.go.id',
                    'sort_order' => 1,
                    'is_active' => true,
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/admin/emergency-contacts', $payload);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $createdId = $response->json('data.id');
        $this->assertDatabaseHas('emergency_contacts', [
            'id' => $createdId,
            'slug' => 'bpbd-jabar-test',
            'created_by' => $this->adminUser->id,
        ]);
        $this->assertDatabaseHas('emergency_contact_channels', [
            'emergency_contact_id' => $createdId,
            'value' => '(022) 73513113',
            'is_primary' => true,
        ]);
    }

    public function test_admin_cannot_create_provincial_contact_without_matching_region_level(): void
    {
        // Trying to create provincial scope with null region_id
        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/admin/emergency-contacts', [
                'name' => 'Provincial Invalid',
                'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                'scope' => EmergencyContact::SCOPE_PROVINCIAL,
                'region_id' => null,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['region_id']);
    }

    public function test_admin_cannot_publish_contact_without_active_verified_channel(): void
    {
        // Create an unverified draft contact
        $contact = EmergencyContact::create([
            'name' => 'Draft Unverified Test',
            'slug' => 'draft-unverified-test',
            'category' => EmergencyContact::CATEGORY_OTHER,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'region_id' => null,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
        ]);

        // Attempting to publish without verification must fail
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/publication", [
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
            ]);

        $response->assertStatus(422);
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $contact->fresh()->publication_status);
    }

    public function test_admin_can_manage_primary_channel_atomically_without_conflict(): void
    {
        $bnpb = EmergencyContact::where('slug', 'pusdalops-bnpb')->first();
        $this->assertNotNull($bnpb);

        $initialPrimary = $bnpb->channels()->where('is_primary', true)->first();
        $this->assertNotNull($initialPrimary);

        $targetChannel = $bnpb->channels()->where('is_primary', false)->where('value', '117')->first();
        $this->assertNotNull($targetChannel);

        // Set channel 117 as primary
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->patchJson("/api/v1/admin/emergency-contacts/{$bnpb->id}/channels/{$targetChannel->id}/primary");

        $response->assertStatus(200);

        // Verify target channel is now primary
        $this->assertTrue($targetChannel->fresh()->is_primary);
        // Verify initial primary channel is no longer primary
        $this->assertFalse($initialPrimary->fresh()->is_primary);

        // Verify at database level that there is exactly 1 active primary channel
        $primaryCount = EmergencyContactChannel::where('emergency_contact_id', $bnpb->id)
            ->where('is_primary', true)
            ->where('is_active', true)
            ->count();
        $this->assertEquals(1, $primaryCount);
    }

    public function test_admin_can_toggle_channel_active_status(): void
    {
        $bnpb = EmergencyContact::where('slug', 'pusdalops-bnpb')->first();
        $channel = $bnpb->channels()->where('value', '117')->first();
        $this->assertTrue($channel->is_active);

        // Deactivate
        $this->actingAs($this->adminUser, 'sanctum')
            ->patchJson("/api/v1/admin/emergency-contacts/{$bnpb->id}/channels/{$channel->id}/toggle")
            ->assertStatus(200);
        $this->assertFalse($channel->fresh()->is_active);

        // Reactivate
        $this->actingAs($this->adminUser, 'sanctum')
            ->patchJson("/api/v1/admin/emergency-contacts/{$bnpb->id}/channels/{$channel->id}/toggle")
            ->assertStatus(200);
        $this->assertTrue($channel->fresh()->is_active);
    }

    public function test_delete_channel_endpoint_safely_deactivates_and_archives_without_hard_delete(): void
    {
        $bnpb = EmergencyContact::where('slug', 'pusdalops-bnpb')->first();
        $channel = $bnpb->channels()->where('value', '117')->first();
        $this->assertNotNull($channel);

        // Call delete channel endpoint
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/v1/admin/emergency-contacts/{$bnpb->id}/channels/{$channel->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // CRITICAL: The record MUST STILL EXIST in the database (NO HARD DELETE)
        $this->assertDatabaseHas('emergency_contact_channels', [
            'id' => $channel->id,
            'is_active' => false,
            'is_primary' => false,
            'value' => '117',
        ]);

        // It must NOT appear in public directory
        $publicRes = $this->getJson("/api/v1/public/emergency-contacts/{$bnpb->slug}");
        $publicRes->assertStatus(200);
        $publicChannels = collect($publicRes->json('data.channels'))->pluck('id')->toArray();
        $this->assertNotContains($channel->id, $publicChannels, 'Deactivated channel must not appear in public API');

        // It MUST still appear in admin detail view for audit/traceability
        $adminRes = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/emergency-contacts/{$bnpb->id}");
        $adminRes->assertStatus(200);
        $adminChannels = collect($adminRes->json('data.channels'))->pluck('id')->toArray();
        $this->assertContains($channel->id, $adminChannels, 'Deactivated channel must remain visible to admin for audit');
    }

    public function test_admin_can_soft_delete_emergency_contact(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'To Be Deleted',
            'slug' => 'to-be-deleted',
            'category' => EmergencyContact::CATEGORY_OTHER,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
        ]);

        $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/v1/admin/emergency-contacts/{$contact->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('emergency_contacts', ['id' => $contact->id]);
    }

    // ==========================================
    // D. BASELINE SAFETY VERIFICATION
    // ==========================================

    public function test_database_baseline_counts_remain_unaltered_after_api_operations(): void
    {
        $this->assertEquals(32, User::count(), 'User count altered!');
        $this->assertEquals(5, Shelter::count(), 'Shelter count altered!');
        $this->assertEquals(5, CommunityReport::count(), 'Report count altered!');
        $this->assertEquals(6, DataSource::count(), 'DataSource count altered!');
        $this->assertEquals(1, AiInsight::count(), 'AiInsight count altered!');
    }
}
