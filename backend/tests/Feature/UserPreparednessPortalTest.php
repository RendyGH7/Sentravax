<?php

namespace Tests\Feature;

use App\Models\PreparednessChecklistItem;
use App\Models\PreparednessChecklistProgress;
use App\Models\PreparednessContact;
use App\Models\PreparednessPlan;
use App\Models\User;
use Database\Seeders\SentravaxMasterSeeder;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserPreparednessPortalTest extends TestCase
{
    protected User $user;
    protected ?User $otherUser = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->user = User::where('email', 'user@sentravax.id')->firstOrFail();
    }

    protected function tearDown(): void
    {
        if ($this->otherUser) {
            PreparednessContact::where('user_id', $this->otherUser->id)->delete();
            PreparednessPlan::where('user_id', $this->otherUser->id)->delete();
            PreparednessChecklistProgress::where('user_id', $this->otherUser->id)->delete();
            $this->otherUser->delete();
        }

        parent::tearDown();
    }

    protected function getOrCreateOtherUser(): User
    {
        if (!$this->otherUser) {
            $this->otherUser = User::create([
                'name' => 'Warga Tetangga',
                'email' => 'tetangga@sentravax.id',
                'password' => Hash::make('Sentravax2026!'),
                'role' => User::ROLE_USER,
                'email_verified_at' => now(),
            ]);
        }

        return $this->otherUser;
    }

    public function test_authenticated_user_can_retrieve_family_plan(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/user/preparedness/plan');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'plan' => [
                        'id',
                        'user_id',
                        'title',
                        'primary_meeting_point',
                        'secondary_meeting_point',
                        'evacuation_notes',
                    ],
                    'contacts',
                ],
            ]);
    }

    public function test_authenticated_user_can_update_family_plan(): void
    {
        $payload = [
            'title' => 'Rencana Siaga Keluarga Mandiri 2026',
            'primary_meeting_point' => 'Balai Warga RW 05',
            'secondary_meeting_point' => 'Lapangan Alun-Alun Barat',
            'evacuation_notes' => 'Obat hipertensi lansia di laci tengah. Matikan saklar MCB utama.',
        ];

        $response = $this->actingAs($this->user)->putJson('/api/v1/user/preparedness/plan', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Rencana Siaga Keluarga Mandiri 2026',
                    'primary_meeting_point' => 'Balai Warga RW 05',
                    'secondary_meeting_point' => 'Lapangan Alun-Alun Barat',
                    'evacuation_notes' => 'Obat hipertensi lansia di laci tengah. Matikan saklar MCB utama.',
                ],
            ]);

        $this->assertDatabaseHas('preparedness_plans', [
            'user_id' => $this->user->id,
            'primary_meeting_point' => 'Balai Warga RW 05',
        ]);
    }

    public function test_update_family_plan_rejects_invalid_payload(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/preparedness/plan', [
            'title' => '', // Required field empty
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    public function test_prevents_cross_user_access_to_family_plan(): void
    {
        $other = $this->getOrCreateOtherUser();

        // User A sets a private plan
        $this->actingAs($this->user)->putJson('/api/v1/user/preparedness/plan', [
            'title' => 'Rencana Rahasia Keluarga A',
            'primary_meeting_point' => 'Lokasi Khusus Keluarga A',
            'evacuation_notes' => 'Catatan pribadi keluarga A',
        ]);

        // User B retrieves their own plan
        $response = $this->actingAs($other)->getJson('/api/v1/user/preparedness/plan');

        $response->assertStatus(200);
        $otherPrimaryPoint = $response->json('data.plan.primary_meeting_point');

        // User B must NOT see User A's meeting point
        $this->assertNotEquals('Lokasi Khusus Keluarga A', $otherPrimaryPoint);
    }

    public function test_authenticated_user_can_list_family_contacts(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/user/preparedness/contacts');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'name',
                        'relationship',
                        'phone_number',
                        'is_emergency_priority',
                    ],
                ],
            ]);
    }

    public function test_authenticated_user_can_add_and_delete_emergency_contact(): void
    {
        // 1. Add contact
        $resAdd = $this->actingAs($this->user)->postJson('/api/v1/user/preparedness/contacts', [
            'name' => 'Dokter Keluarga Rina',
            'relationship' => 'Tenaga Kesehatan',
            'phone_number' => '081299887766',
            'is_emergency_priority' => true,
        ]);

        $resAdd->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Dokter Keluarga Rina',
                    'phone_number' => '081299887766',
                    'is_emergency_priority' => true,
                ],
            ]);

        $contactId = $resAdd->json('data.id');

        // Verify in DB
        $this->assertDatabaseHas('preparedness_contacts', [
            'id' => $contactId,
            'user_id' => $this->user->id,
        ]);

        // 2. Delete contact
        $resDel = $this->actingAs($this->user)->deleteJson("/api/v1/user/preparedness/contacts/{$contactId}");
        $resDel->assertStatus(200)->assertJson(['success' => true]);

        // Verify deletion in DB
        $this->assertDatabaseMissing('preparedness_contacts', [
            'id' => $contactId,
        ]);
    }

    public function test_prevents_cross_user_contact_deletion(): void
    {
        $other = $this->getOrCreateOtherUser();

        // User A creates contact
        $contact = PreparednessContact::create([
            'user_id' => $this->user->id,
            'name' => 'Paman Keluarga A',
            'relationship' => 'Paman',
            'phone_number' => '081122334455',
            'is_emergency_priority' => true,
        ]);

        // User B attempts to delete User A's contact
        $response = $this->actingAs($other)->deleteJson("/api/v1/user/preparedness/contacts/{$contact->id}");

        // Must return 404 ModelNotFoundException because query isolates user_id
        $response->assertStatus(404);

        // Contact must still exist
        $this->assertDatabaseHas('preparedness_contacts', [
            'id' => $contact->id,
        ]);

        // Cleanup
        $contact->delete();
    }

    public function test_authenticated_user_can_retrieve_checklist(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/user/preparedness/checklist');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'categories',
                    'stats' => [
                        'total_items',
                        'completed_items',
                        'percentage',
                    ],
                ],
            ]);
    }

    public function test_checklist_toggle_persists_in_database(): void
    {
        $item = PreparednessChecklistItem::firstOrFail();

        // Reset state for this item
        PreparednessChecklistProgress::where('user_id', $this->user->id)
            ->where('checklist_item_id', $item->id)
            ->delete();

        // 1. Toggle ON
        $res1 = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item->id}/toggle");
        $res1->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'item_id' => $item->id,
                    'is_completed' => true,
                ],
            ]);

        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->user->id,
            'checklist_item_id' => $item->id,
            'is_completed' => true,
        ]);

        // 2. Toggle OFF
        $res2 = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item->id}/toggle");
        $res2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'item_id' => $item->id,
                    'is_completed' => false,
                ],
            ]);

        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->user->id,
            'checklist_item_id' => $item->id,
            'is_completed' => false,
        ]);
    }

    public function test_guest_cannot_access_private_family_plan_or_contacts(): void
    {
        // Unauthenticated access must be rejected with 401
        $this->getJson('/api/v1/user/preparedness/plan')->assertStatus(401);
        $this->putJson('/api/v1/user/preparedness/plan', ['title' => 'Test'])->assertStatus(401);
        $this->getJson('/api/v1/user/preparedness/contacts')->assertStatus(401);
        $this->postJson('/api/v1/user/preparedness/contacts', ['name' => 'Test'])->assertStatus(401);
        $this->getJson('/api/v1/user/preparedness/checklist')->assertStatus(401);
        $this->postJson('/api/v1/user/preparedness/checklist/1/toggle')->assertStatus(401);
    }

    public function test_prevents_cross_user_checklist_manipulation(): void
    {
        $other = $this->getOrCreateOtherUser();
        $item = PreparednessChecklistItem::firstOrFail();

        // User A completes the item
        $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item->id}/toggle");

        // User B retrieves their own checklist
        $resOther = $this->actingAs($other)->getJson('/api/v1/user/preparedness/checklist');
        $resOther->assertStatus(200);

        // Find the item in User B's categories
        $categories = $resOther->json('data.categories');
        $itemFound = null;
        foreach ($categories as $items) {
            foreach ($items as $it) {
                if ($it['id'] === $item->id) {
                    $itemFound = $it;
                    break 2;
                }
            }
        }

        $this->assertNotNull($itemFound);
        // User B's completion status must remain false
        $this->assertFalse($itemFound['is_completed']);
    }

    public function test_admin_and_intelligence_roles_have_isolated_personal_preparedness(): void
    {
        $admin = User::where('email', 'admin@sentravax.go.id')->firstOrFail();
        $intel = User::where('email', 'intelligence@sentravax.go.id')->firstOrFail();

        // 1. User creates private contact
        $userContact = PreparednessContact::create([
            'user_id' => $this->user->id,
            'name' => 'Kontak Pribadi Warga',
            'relationship' => 'Istri',
            'phone_number' => '081234567890',
            'is_emergency_priority' => true,
        ]);

        // 2. Admin accesses preparedness plan -> isolated to Admin's user_id
        $adminRes = $this->actingAs($admin)->getJson('/api/v1/user/preparedness/plan');
        $adminRes->assertStatus(200);
        $this->assertEquals($admin->id, $adminRes->json('data.plan.user_id'));

        // 3. Admin attempts to delete user's contact -> 404 ModelNotFoundException
        $adminDelRes = $this->actingAs($admin)->deleteJson("/api/v1/user/preparedness/contacts/{$userContact->id}");
        $adminDelRes->assertStatus(404);

        // 4. Intelligence attempts to delete user's contact -> 404 ModelNotFoundException
        $intelDelRes = $this->actingAs($intel)->deleteJson("/api/v1/user/preparedness/contacts/{$userContact->id}");
        $intelDelRes->assertStatus(404);

        // 5. Contact remains untouched in DB
        $this->assertDatabaseHas('preparedness_contacts', ['id' => $userContact->id]);

        $userContact->delete();
    }

    public function test_checklist_percentage_calculation_precision_and_toggle_behavior(): void
    {
        $items = PreparednessChecklistItem::orderBy('sort_order')->take(2)->get();
        $this->assertCount(2, $items);
        $item1 = $items[0];
        $item2 = $items[1];

        // Clean user progress for these 2 items
        PreparednessChecklistProgress::where('user_id', $this->user->id)
            ->whereIn('checklist_item_id', [$item1->id, $item2->id])
            ->delete();

        // 1. Initial baseline check
        $res0 = $this->actingAs($this->user)->getJson('/api/v1/user/preparedness/checklist');
        $res0->assertStatus(200);
        $initialTotal = $res0->json('data.stats.total_items');
        $this->assertGreaterThan(0, $initialTotal);

        // 2. Toggle item 1 ON
        $res1 = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item1->id}/toggle");
        $res1->assertStatus(200);
        $completedAfter1 = $res1->json('data.total_completed');
        $pctAfter1 = $res1->json('data.percentage');
        $this->assertEquals(round(($completedAfter1 / $initialTotal) * 100, 1), $pctAfter1);

        // 3. Toggle item 2 ON
        $res2 = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item2->id}/toggle");
        $res2->assertStatus(200);
        $completedAfter2 = $res2->json('data.total_completed');
        $pctAfter2 = $res2->json('data.percentage');
        $this->assertEquals($completedAfter1 + 1, $completedAfter2);
        $this->assertEquals(round(($completedAfter2 / $initialTotal) * 100, 1), $pctAfter2);

        // 4. Untoggle item 1 OFF
        $res3 = $this->actingAs($this->user)->postJson("/api/v1/user/preparedness/checklist/{$item1->id}/toggle");
        $res3->assertStatus(200);
        $completedAfter3 = $res3->json('data.total_completed');
        $pctAfter3 = $res3->json('data.percentage');
        $this->assertEquals($completedAfter2 - 1, $completedAfter3);
        $this->assertEquals(round(($completedAfter3 / $initialTotal) * 100, 1), $pctAfter3);
    }
}
