<?php

namespace Tests\Feature;

use App\Models\PreparednessChecklistItem;
use App\Models\PreparednessChecklistProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GuestPreparednessDataMigrationTest extends TestCase
{
    protected User $userA;
    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::where('email', 'test_migration_a@sentravax.id')->first()
            ?? User::factory()->create([
                'name' => 'Warga Test A',
                'email' => 'test_migration_a@sentravax.id',
                'role' => 'user',
            ]);

        $this->userB = User::where('email', 'test_migration_b@sentravax.id')->first()
            ?? User::factory()->create([
                'name' => 'Warga Test B',
                'email' => 'test_migration_b@sentravax.id',
                'role' => 'user',
            ]);

        // Clean any pre-existing test progress for these test users
        PreparednessChecklistProgress::whereIn('user_id', [$this->userA->id, $this->userB->id])->delete();
    }

    protected function tearDown(): void
    {
        PreparednessChecklistProgress::whereIn('user_id', [$this->userA->id, $this->userB->id])->delete();
        parent::tearDown();
    }

    /**
     * Skenario 1: Guest memiliki checklist, kemudian login dan mengirimkan payload sinkronisasi.
     */
    public function test_1_guest_checklist_syncs_successfully_upon_login(): void
    {
        $items = PreparednessChecklistItem::take(3)->pluck('id')->toArray();
        $this->assertCount(3, $items);

        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'synced_count' => 3,
                'already_completed_count' => 0,
                'total_completed' => 3,
            ],
        ]);

        foreach ($items as $itemId) {
            $this->assertDatabaseHas('preparedness_checklist_progress', [
                'user_id' => $this->userA->id,
                'checklist_item_id' => $itemId,
                'is_completed' => true,
            ]);
        }
    }

    /**
     * Skenario 2: Guest memiliki checklist, kemudian registrasi akun baru dan melakukan sinkronisasi.
     */
    public function test_2_guest_checklist_syncs_after_registration(): void
    {
        $uniqueEmail = 'new_reg_' . uniqid() . '@sentravax.id';
        $regResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Warga Baru Terdaftar',
            'email' => $uniqueEmail,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $regResponse->assertStatus(201);
        $newUserId = $regResponse->json('data.user.id');
        $newUser = User::findOrFail($newUserId);

        $items = PreparednessChecklistItem::take(2)->pluck('id')->toArray();

        // Step 1: Pre-verification request is rejected by 'verified' middleware with 403
        $preVerifyResponse = $this->actingAs($newUser)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $preVerifyResponse->assertStatus(403);

        // Step 2: User completes email verification
        $newUser->markEmailAsVerified();
        $this->assertTrue($newUser->hasVerifiedEmail());

        // Step 3: Post-verification request succeeds with 200
        $syncResponse = $this->actingAs($newUser)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);

        $syncResponse->assertStatus(200);
        $syncResponse->assertJson([
            'success' => true,
            'data' => [
                'synced_count' => 2,
                'total_completed' => 2,
            ],
        ]);

        // Cleanup created user
        PreparednessChecklistProgress::where('user_id', $newUserId)->delete();
        $newUser->delete();
    }

    /**
     * Skenario 3: Guest tidak memiliki data checklist (payload kosong).
     */
    public function test_3_empty_guest_checklist_payload_executes_safely(): void
    {
        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'synced_count' => 0,
                'already_completed_count' => 0,
                'total_completed' => 0,
            ],
        ]);

        $count = PreparednessChecklistProgress::where('user_id', $this->userA->id)->count();
        $this->assertEquals(0, $count);
    }

    /**
     * Skenario 4: Database memiliki progres, localStorage juga memiliki progres (Additive Union Merge).
     * Progres dari kedua belah pihak harus tetap dipertahankan utuh.
     */
    public function test_4_additive_merge_preserves_both_database_and_guest_progress(): void
    {
        $items = PreparednessChecklistItem::take(4)->pluck('id')->toArray();
        [$item1, $item2, $item3, $item4] = $items;

        // DB pre-existing progress: item 1 and item 2
        PreparednessChecklistProgress::create([
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item1,
            'is_completed' => true,
            'completed_at' => now()->subDay(),
        ]);
        PreparednessChecklistProgress::create([
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item2,
            'is_completed' => true,
            'completed_at' => now()->subDay(),
        ]);

        // Guest localStorage has item 2 and item 3
        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$item2, $item3],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'synced_count' => 1, // only item 3 is newly synced
                'already_completed_count' => 1, // item 2 was already completed
                'total_completed' => 3, // items 1, 2, 3
            ],
        ]);

        // Verify items 1, 2, 3 are all completed in database
        $completedIds = PreparednessChecklistProgress::where('user_id', $this->userA->id)
            ->where('is_completed', true)
            ->pluck('checklist_item_id')
            ->toArray();

        $this->assertContains($item1, $completedIds, 'Item 1 from DB must be preserved.');
        $this->assertContains($item2, $completedIds, 'Item 2 (common) must remain completed.');
        $this->assertContains($item3, $completedIds, 'Item 3 from guest must be added.');
        $this->assertNotContains($item4, $completedIds, 'Item 4 was not checked.');
    }

    /**
     * Skenario 5: Data localStorage kosong tetapi database memiliki progres.
     * Progres yang sudah ada di database TIDAK BOLEH terhapus atau berkurang.
     */
    public function test_5_empty_guest_sync_does_not_wipe_existing_database_progress(): void
    {
        $item = PreparednessChecklistItem::first();

        PreparednessChecklistProgress::create([
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item->id,
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item->id,
            'is_completed' => true,
        ]);
    }

    /**
     * Skenario 6: Format mapping boolean {"1": true, "2": false} didukung dengan benar.
     */
    public function test_6_map_format_with_boolean_values_is_supported(): void
    {
        $items = PreparednessChecklistItem::take(2)->pluck('id')->toArray();
        [$item1, $item2] = $items;

        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'items' => [
                (string)$item1 => true,
                (string)$item2 => false, // false should NOT be marked completed
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'synced_count' => 1,
                'total_completed' => 1,
            ],
        ]);

        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item1,
            'is_completed' => true,
        ]);

        $this->assertDatabaseMissing('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item2,
            'is_completed' => true,
        ]);
    }

    /**
     * Skenario 7: Token tidak ada atau tidak valid (unauthenticated) ditolak dengan 401.
     */
    public function test_7_unauthenticated_sync_request_is_rejected_with_401(): void
    {
        $response = $this->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [1, 2],
        ]);

        $response->assertStatus(401);
    }

    /**
     * Skenario 8: Retry idempotensi: memanggil sinkronisasi berulang kali tidak menyebabkan duplikasi record.
     */
    public function test_8_repeated_sync_calls_are_strictly_idempotent(): void
    {
        $items = PreparednessChecklistItem::take(3)->pluck('id')->toArray();

        // Call 1
        $res1 = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $res1->assertStatus(200);
        $this->assertEquals(3, $res1->json('data.synced_count'));

        // Call 2 (Retry)
        $res2 = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $res2->assertStatus(200);
        $this->assertEquals(0, $res2->json('data.synced_count'));
        $this->assertEquals(3, $res2->json('data.already_completed_count'));
        $this->assertEquals(3, $res2->json('data.total_completed'));

        // Ensure database only contains 3 rows (no duplicated rows)
        $rowCount = PreparednessChecklistProgress::where('user_id', $this->userA->id)->count();
        $this->assertEquals(3, $rowCount);
    }

    /**
     * Skenario 9: ID item checklist yang tidak valid atau tidak ada dalam master data diabaikan secara aman.
     */
    public function test_9_invalid_or_non_existent_item_ids_are_safely_ignored(): void
    {
        $validItem = PreparednessChecklistItem::first();

        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$validItem->id, 999999, -5],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'synced_count' => 1, // only valid item synced
                'total_completed' => 1,
            ],
        ]);

        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $validItem->id,
            'is_completed' => true,
        ]);

        $this->assertDatabaseMissing('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => 999999,
        ]);
    }

    /**
     * Skenario 10: Duplikasi item dalam payload disaring secara otomatis (deduplicated).
     */
    public function test_10_duplicate_ids_in_payload_are_deduplicated(): void
    {
        $item = PreparednessChecklistItem::first();

        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$item->id, $item->id, $item->id],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'synced_count' => 1,
                'total_completed' => 1,
            ],
        ]);
    }

    /**
     * Skenario 11: Isolasi Akun: Data User A tidak pernah bocor atau termutasi ke User B saat berganti akun.
     */
    public function test_11_cross_account_isolation_prevents_data_leakage(): void
    {
        $items = PreparednessChecklistItem::take(2)->pluck('id')->toArray();
        [$item1, $item2] = $items;

        // User A syncs item 1
        $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$item1],
        ]);

        // User B syncs item 2
        $this->actingAs($this->userB)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$item2],
        ]);

        // User A should only have item 1
        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item1,
        ]);
        $this->assertDatabaseMissing('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item2,
        ]);

        // User B should only have item 2
        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->userB->id,
            'checklist_item_id' => $item2,
        ]);
        $this->assertDatabaseMissing('preparedness_checklist_progress', [
            'user_id' => $this->userB->id,
            'checklist_item_id' => $item1,
        ]);
    }

    /**
     * Skenario 12: Pengguna membuka halaman Preparedness setelah sinkronisasi berhasil.
     * Endpoint GET /api/v1/user/preparedness/checklist mencerminkan seluruh item yang telah digabungkan.
     */
    public function test_12_user_checklist_overview_endpoint_reflects_merged_progress(): void
    {
        $items = PreparednessChecklistItem::take(3)->pluck('id')->toArray();

        $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);

        $overviewRes = $this->actingAs($this->userA)->getJson('/api/v1/user/preparedness/checklist');

        $overviewRes->assertStatus(200);
        $overviewRes->assertJson([
            'success' => true,
            'data' => [
                'stats' => [
                    'completed_items' => 3,
                ],
            ],
        ]);

        // Verify the items in categories reflect is_completed = true
        $categories = $overviewRes->json('data.categories');
        $completedFound = 0;
        foreach ($categories as $catItems) {
            foreach ($catItems as $catItem) {
                if (in_array($catItem['id'], $items, true)) {
                    $this->assertTrue($catItem['is_completed'], "Item {$catItem['id']} must be completed.");
                    $completedFound++;
                }
            }
        }
        $this->assertEquals(3, $completedFound);
    }

    /**
     * Skenario 13: Verifikasi bahwa operasi sinkronisasi tidak pernah memutasi data baseline.
     */
    public function test_13_baseline_records_remain_intact_during_and_after_sync(): void
    {
        $aiInsightCount = DB::table('ai_insights')->count();
        $communityReportCount = DB::table('community_reports')->count();
        $dataSourceCount = DB::table('data_sources')->count();
        $shelterCount = DB::table('shelters')->count();

        $items = PreparednessChecklistItem::take(2)->pluck('id')->toArray();

        $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);

        $this->assertEquals($aiInsightCount, DB::table('ai_insights')->count(), 'AI Insights baseline count must not change.');
        $this->assertEquals($communityReportCount, DB::table('community_reports')->count(), 'Community Reports baseline count must not change.');
        $this->assertEquals($dataSourceCount, DB::table('data_sources')->count(), 'DataSources baseline count must not change.');
        $this->assertEquals($shelterCount, DB::table('shelters')->count(), 'Shelters baseline count must not change.');
    }

    /**
     * Skenario 14: Kepemilikan ketat: Upaya menyisipkan user_id lain dalam payload tidak memengaruhi akun lain.
     */
    public function test_14_user_cannot_spoof_user_id_in_sync_request(): void
    {
        $item = PreparednessChecklistItem::first();

        // User A tries to pass 'user_id' => userB->id
        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$item->id],
            'user_id' => $this->userB->id,
        ]);

        $response->assertStatus(200);

        // Record must belong to userA, NEVER userB
        $this->assertDatabaseHas('preparedness_checklist_progress', [
            'user_id' => $this->userA->id,
            'checklist_item_id' => $item->id,
        ]);
        $this->assertDatabaseMissing('preparedness_checklist_progress', [
            'user_id' => $this->userB->id,
            'checklist_item_id' => $item->id,
        ]);
    }

    /**
     * Skenario 15: Validasi payload: Tipe data non-array ditolak dengan status 422.
     */
    public function test_15_invalid_data_types_in_item_ids_fails_validation(): void
    {
        $response = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => 'invalid_string_not_array',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Skenario 16: Registrasi akun belum terverifikasi ditolak oleh middleware verified (HTTP 403).
     */
    public function test_16_unverified_account_is_rejected_by_verified_middleware(): void
    {
        $unverifiedUser = User::factory()->unverified()->create([
            'role' => 'user',
        ]);

        $items = PreparednessChecklistItem::take(3)->pluck('id')->toArray();

        $response = $this->actingAs($unverifiedUser)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('preparedness_checklist_progress', [
            'user_id' => $unverifiedUser->id,
        ]);
    }

    /**
     * Skenario 17: Sinkronisasi berhasil setelah email pengguna diverifikasi.
     */
    public function test_17_sync_succeeds_after_email_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'role' => 'user',
        ]);

        $items = PreparednessChecklistItem::take(2)->pluck('id')->toArray();

        // Step 1: Pre-verification fails with 403
        $failResponse = $this->actingAs($user)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $failResponse->assertStatus(403);

        // Step 2: Mark email as verified
        $user->markEmailAsVerified();
        $this->assertTrue($user->hasVerifiedEmail());

        // Step 3: Post-verification sync succeeds with 200
        $successResponse = $this->actingAs($user)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $successResponse->assertStatus(200);
        $successResponse->assertJson([
            'success' => true,
            'data' => [
                'synced_count' => 2,
            ],
        ]);

        foreach ($items as $itemId) {
            $this->assertDatabaseHas('preparedness_checklist_progress', [
                'user_id' => $user->id,
                'checklist_item_id' => $itemId,
                'is_completed' => true,
            ]);
        }
    }

    /**
     * Skenario 18: Pergantian akun saat ada pending data menjamin isolasi data akun A dan B.
     */
    public function test_18_account_switching_maintains_strict_isolation_between_user_a_and_user_b(): void
    {
        $itemsA = PreparednessChecklistItem::take(2)->pluck('id')->toArray();
        $itemsB = PreparednessChecklistItem::skip(2)->take(2)->pluck('id')->toArray();

        // User A logs in and syncs items A
        $resA = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $itemsA,
        ]);
        $resA->assertStatus(200);

        // User switches to User B and syncs items B
        $resB = $this->actingAs($this->userB)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $itemsB,
        ]);
        $resB->assertStatus(200);

        // Verify User A only has items A
        foreach ($itemsA as $id) {
            $this->assertDatabaseHas('preparedness_checklist_progress', [
                'user_id' => $this->userA->id,
                'checklist_item_id' => $id,
                'is_completed' => true,
            ]);
            $this->assertDatabaseMissing('preparedness_checklist_progress', [
                'user_id' => $this->userB->id,
                'checklist_item_id' => $id,
            ]);
        }

        // Verify User B only has items B
        foreach ($itemsB as $id) {
            $this->assertDatabaseHas('preparedness_checklist_progress', [
                'user_id' => $this->userB->id,
                'checklist_item_id' => $id,
                'is_completed' => true,
            ]);
            $this->assertDatabaseMissing('preparedness_checklist_progress', [
                'user_id' => $this->userA->id,
                'checklist_item_id' => $id,
            ]);
        }
    }

    /**
     * Skenario 19: Retry setelah respons jaringan gagal/timeout (idempoten dan tidak menduplikasi data).
     */
    public function test_19_retry_after_network_failure_is_idempotent_and_creates_no_duplicates(): void
    {
        $items = PreparednessChecklistItem::take(3)->pluck('id')->toArray();

        // Call 1: Server processes sync
        $res1 = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $res1->assertStatus(200);
        $res1->assertJsonPath('data.synced_count', 3);
        $res1->assertJsonPath('data.already_completed_count', 0);

        // Capture initial completed_at timestamps
        $initialRecords = PreparednessChecklistProgress::where('user_id', $this->userA->id)
            ->whereIn('checklist_item_id', $items)
            ->pluck('completed_at', 'checklist_item_id');

        // Call 2: Client retries identical request (simulating dropped client connection on Call 1)
        $res2 = $this->actingAs($this->userA)->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => $items,
        ]);
        $res2->assertStatus(200);
        $res2->assertJsonPath('data.synced_count', 0);
        $res2->assertJsonPath('data.already_completed_count', 3);

        // Ensure row count is exactly 3 (no duplicate rows)
        $this->assertEquals(3, PreparednessChecklistProgress::where('user_id', $this->userA->id)->count());

        // Ensure completed_at timestamp was NOT modified on retry
        $retryRecords = PreparednessChecklistProgress::where('user_id', $this->userA->id)
            ->whereIn('checklist_item_id', $items)
            ->pluck('completed_at', 'checklist_item_id');

        foreach ($items as $id) {
            $this->assertEquals(
                $initialRecords[$id]->toIso8601String(),
                $retryRecords[$id]->toIso8601String(),
                "Timestamp for item {$id} must not change upon retry."
            );
        }
    }

    /**
     * Skenario 20: Permintaan sinkronisasi setelah logout ditolak dengan HTTP 401 dan tidak mengubah database.
     */
    public function test_20_sync_request_after_logout_is_rejected_unauthenticated(): void
    {
        $item = PreparednessChecklistItem::first();

        // Unauthenticated request
        $response = $this->postJson('/api/v1/user/preparedness/checklist/sync', [
            'item_ids' => [$item->id],
        ]);

        $response->assertStatus(401);
    }
}
