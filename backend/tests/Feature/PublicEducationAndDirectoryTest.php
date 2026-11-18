<?php

namespace Tests\Feature;

use App\Models\EducationContent;
use App\Models\HazardType;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PublicEducationAndDirectoryTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $citizenUser;
    protected HazardType $hazardType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::where('role', 'admin')->first()
            ?? User::factory()->create(['role' => 'admin']);

        $this->citizenUser = User::where('role', 'user')->first()
            ?? User::factory()->create(['role' => 'user']);

        $this->hazardType = HazardType::first()
            ?? HazardType::factory()->create();
    }

    /**
     * 1. Public Education Listing: Only published content is visible.
     */
    public function test_public_can_list_published_education_content(): void
    {
        // Published content
        $published = EducationContent::create([
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Panduan Evakuasi Terbit ' . uniqid(),
            'slug' => 'panduan-evakuasi-terbit-' . uniqid(),
            'category' => 'mitigasi',
            'summary' => 'Ringkasan panduan evakuasi resmi.',
            'content_body' => '## Langkah 1\nIkuti arahan petugas.',
            'is_published' => true,
            'published_at' => now(),
            'sort_order' => 1,
        ]);

        // Draft content
        $draft = EducationContent::create([
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Draft Rahasia Internal ' . uniqid(),
            'slug' => 'draft-rahasia-internal-' . uniqid(),
            'category' => 'kesiapsiagaan',
            'summary' => 'Belum siap terbit.',
            'content_body' => 'Draft body.',
            'is_published' => false,
            'published_at' => null,
            'sort_order' => 2,
        ]);

        $res = $this->getJson('/api/v1/public/education');
        $res->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'current_page',
                    'data' => [
                        '*' => ['id', 'title', 'slug', 'category', 'summary', 'is_published'],
                    ],
                ],
            ]);

        $ids = collect($res->json('data.data'))->pluck('id')->all();
        $this->assertContains($published->id, $ids);
        $this->assertNotContains($draft->id, $ids, 'Draft education articles must NEVER leak to public list');
    }

    /**
     * 2. Public Detail: Draft article returns 404, published article returns 200.
     */
    public function test_public_cannot_view_draft_education_detail_by_slug(): void
    {
        $published = EducationContent::create([
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Panduan Gempa Publik ' . uniqid(),
            'slug' => 'panduan-gempa-publik-' . uniqid(),
            'category' => 'kesiapsiagaan',
            'summary' => 'Tindakan saat gempa.',
            'content_body' => '## Drop, Cover, Hold On.',
            'is_published' => true,
            'published_at' => now(),
            'sort_order' => 1,
        ]);

        $draft = EducationContent::create([
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Draft Gempa Internal ' . uniqid(),
            'slug' => 'draft-gempa-internal-' . uniqid(),
            'category' => 'kesiapsiagaan',
            'summary' => 'Belum terverifikasi.',
            'content_body' => 'Draft body.',
            'is_published' => false,
            'published_at' => null,
            'sort_order' => 2,
        ]);

        // Published succeeds
        $resP = $this->getJson("/api/v1/public/education/{$published->slug}");
        $resP->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $published->id,
                    'slug' => $published->slug,
                    'is_published' => true,
                ],
            ]);

        // Draft fails with 404
        $resD = $this->getJson("/api/v1/public/education/{$draft->slug}");
        $resD->assertStatus(404);
    }

    /**
     * 3. Filter by category and hazard_type_id.
     */
    public function test_public_education_filtering(): void
    {
        $catA = EducationContent::create([
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Edukasi Mitigasi Khusus ' . uniqid(),
            'slug' => 'edukasi-mitigasi-khusus-' . uniqid(),
            'category' => 'mitigasi_khusus',
            'summary' => 'Summary A.',
            'content_body' => 'Body A.',
            'is_published' => true,
            'published_at' => now(),
            'sort_order' => 1,
        ]);

        $res = $this->getJson('/api/v1/public/education?category=mitigasi_khusus');
        $res->assertStatus(200);
        $ids = collect($res->json('data.data'))->pluck('id')->all();
        $this->assertContains($catA->id, $ids);
    }

    /**
     * 4. Admin CMS: Full CRUD for education content.
     */
    public function test_admin_can_manage_education_content(): void
    {
        // 4a. List as admin
        $resList = $this->actingAs($this->adminUser, 'sanctum')->getJson('/api/v1/admin/education');
        $resList->assertStatus(200)
            ->assertJson(['success' => true]);

        // 4b. Create as admin
        $payload = [
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Panduan Longsor Baru Oleh Admin ' . uniqid(),
            'category' => 'preparedness',
            'summary' => 'Ringkasan panduan longsor resmi oleh BPBD.',
            'content_body' => '## Sebelum Longsor\nPeriksa retakan tanah.',
            'is_published' => true,
            'sort_order' => 5,
        ];

        $resStore = $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/v1/admin/education', $payload);
        $resStore->assertStatus(201)
            ->assertJson(['success' => true]);
        $createdId = $resStore->json('data.id');
        $this->assertNotNull($createdId);

        // 4c. Update as admin
        $updatePayload = [
            'title' => 'Panduan Longsor Terkini (Updated)',
            'is_published' => false,
        ];
        $resUpdate = $this->actingAs($this->adminUser, 'sanctum')->putJson("/api/v1/admin/education/{$createdId}", $updatePayload);
        $resUpdate->assertStatus(200)
            ->assertJson(['success' => true]);
        $this->assertEquals('Panduan Longsor Terkini (Updated)', $resUpdate->json('data.title'));
        $this->assertFalse($resUpdate->json('data.is_published'));

        // 4d. Delete as admin
        $resDestroy = $this->actingAs($this->adminUser, 'sanctum')->deleteJson("/api/v1/admin/education/{$createdId}");
        $resDestroy->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertNull(EducationContent::find($createdId));
    }

    /**
     * 5. Role Security: Citizen user or guest cannot access admin education endpoints.
     */
    public function test_citizen_and_guest_forbidden_from_admin_education_cms(): void
    {
        // Guest
        $resGuest = $this->getJson('/api/v1/admin/education');
        $this->assertContains($resGuest->getStatusCode(), [401, 403]);

        // Citizen User
        $resUser = $this->actingAs($this->citizenUser, 'sanctum')->getJson('/api/v1/admin/education');
        $this->assertEquals(403, $resUser->getStatusCode());

        $resPost = $this->actingAs($this->citizenUser, 'sanctum')->postJson('/api/v1/admin/education', [
            'title' => 'Unauthorized Post',
        ]);
        $this->assertEquals(403, $resPost->getStatusCode());
    }
}

