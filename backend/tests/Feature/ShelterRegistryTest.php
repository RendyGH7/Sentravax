<?php

namespace Tests\Feature;

use App\Models\Region;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ShelterRegistryTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $regularUser;
    protected User $intelUser;
    protected Region $pilotRegion;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::where('role', User::ROLE_ADMIN)->first()
            ?? User::factory()->create(['role' => User::ROLE_ADMIN]);

        $this->regularUser = User::where('role', User::ROLE_USER)->first()
            ?? User::factory()->create(['role' => User::ROLE_USER]);

        $this->intelUser = User::where('role', User::ROLE_INTELLIGENCE)->first()
            ?? User::factory()->create(['role' => User::ROLE_INTELLIGENCE]);

        $this->pilotRegion = Region::where('code', 'ID-JK')->first()
            ?? Region::first();
    }

    /**
     * Test public (guest) can list verified shelters without authentication.
     */
    public function test_public_can_list_verified_shelters_without_auth(): void
    {
        $response = $this->getJson('/api/v1/public/shelters');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'facility_type',
                            'address',
                            'operational_status',
                            'verification_status',
                            'is_verified',
                            'capacity',
                            'wheelchair_accessible',
                            'elderly_friendly',
                            'has_sanitation',
                        ],
                    ],
                ],
                'meta' => ['disclaimer'],
            ]);

        // Guard: Default view must only contain VERIFIED facilities
        $items = $response->json('data.data');
        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertEquals('VERIFIED', $item['verification_status']);
            $this->assertTrue($item['is_verified']);
        }
    }

    /**
     * Test public filter by facility type and operational status.
     */
    public function test_public_can_filter_shelters_by_facility_type(): void
    {
        $response = $this->getJson('/api/v1/public/shelters?facility_type=community_hall');

        $response->assertOk();
        $items = $response->json('data.data');
        foreach ($items as $item) {
            $this->assertEquals('community_hall', $item['facility_type']);
        }
    }

    /**
     * Test geospatial proximity query returns distance sorted by nearest.
     */
    public function test_public_geospatial_proximity_query_returns_ordered_distances(): void
    {
        // Coordinates near Jatinegara, East Jakarta
        $lat = -6.236;
        $lon = 106.867;

        $response = $this->getJson("/api/v1/public/shelters?lat={$lat}&lon={$lon}");

        $response->assertOk();
        $items = $response->json('data.data');
        $this->assertNotEmpty($items);

        $firstDistance = $items[0]['distance_km'];
        $this->assertNotNull($firstDistance);
        $this->assertLessThan(2.0, $firstDistance); // GOR Otista is right at this location (<2km)

        // Verify sorted in ascending order of distance
        $prevDistance = 0.0;
        foreach ($items as $item) {
            $this->assertNotNull($item['distance_km']);
            $this->assertGreaterThanOrEqual($prevDistance, $item['distance_km']);
            $prevDistance = $item['distance_km'];
        }
    }

    /**
     * Test public shelter GeoJSON format for Leaflet map layer.
     */
    public function test_public_shelter_geojson_format_contains_feature_collection(): void
    {
        $response = $this->getJson('/api/v1/public/shelters?format=geojson');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('type', 'FeatureCollection')
            ->assertJsonStructure([
                'type',
                'features' => [
                    '*' => [
                        'type',
                        'geometry' => ['type', 'coordinates'],
                        'properties' => [
                            'id',
                            'name',
                            'facility_type',
                            'verification_status',
                            'is_verified',
                            'evacuation_route_info',
                        ],
                    ],
                ],
            ]);

        $features = $response->json('features');
        $this->assertNotEmpty($features);
        $firstFeature = $features[0];
        $this->assertEquals('Point', $firstFeature['geometry']['type']);
        $this->assertCount(2, $firstFeature['geometry']['coordinates']);
    }

    /**
     * Test single shelter detail endpoint with evacuation route notes.
     */
    public function test_public_shelter_detail_returns_evacuation_route_and_provenance(): void
    {
        $shelter = Shelter::where('verification_status', 'VERIFIED')->first();
        $this->assertNotNull($shelter);

        $response = $this->getJson("/api/v1/public/shelters/{$shelter->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $shelter->id)
            ->assertJsonPath('data.name', $shelter->name)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'facility_type',
                    'address',
                    'capacity',
                    'operational_status',
                    'verification_status',
                    'verified_by_agency',
                    'source_name',
                    'evacuation_route_info',
                ],
            ]);
    }

    /**
     * Test admin can create, update, and inspect audit trail for shelter registry.
     */
    public function test_admin_can_crud_shelter_with_audit_trail(): void
    {
        $payload = [
            'name' => 'Shelter Darurat Pusdiklat BPBD Pilot',
            'facility_type' => 'government_office',
            'address' => 'Jl. Tebet Barat Raya No. 45, Jakarta Selatan',
            'region_id' => $this->pilotRegion->id,
            'latitude' => -6.241234,
            'longitude' => 106.851234,
            'capacity' => 600,
            'current_occupancy' => 20,
            'has_sanitation' => true,
            'sanitation_details' => 'Toilet kontainer terpadu 10 unit',
            'wheelchair_accessible' => true,
            'elderly_friendly' => true,
            'contact_person' => 'Kaposko Siaga',
            'contact_phone' => '021-8291234',
            'operational_status' => 'open',
            'verification_status' => 'VERIFIED',
            'verified_by_agency' => 'BPBD Provinsi DKI Jakarta',
            'source_name' => 'Hasil Survei Posko Kontinjensi 2026',
            'evacuation_route_info' => [
                'has_official_route' => true,
                'route_code' => 'EVAC-TBT-01',
                'corridor_name' => 'Koridor Jl. Tebet Barat Raya',
                'status' => 'AVAILABLE',
                'verified_at' => '2026-11-18T10:00:00+07:00',
                'authority' => 'BPBD DKI Jakarta',
            ],
        ];

        // 1. Create
        $createRes = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/shelters', $payload);

        $createRes->assertCreated()
            ->assertJsonPath('success', true);

        $shelterId = $createRes->json('data.id');
        $this->assertNotNull($shelterId);

        // Verify spatial point in DB
        $shelter = Shelter::find($shelterId);
        $this->assertNotNull($shelter);
        $this->assertEquals('Shelter Darurat Pusdiklat BPBD Pilot', $shelter->name);
        $this->assertEquals('VERIFIED', $shelter->verification_status);
        $this->assertNotNull($shelter->provenance_metadata);
        $this->assertCount(1, $shelter->provenance_metadata['audit_history']);

        // 2. Update
        $updatePayload = [
            'capacity' => 750,
            'current_occupancy' => 50,
            'operational_status' => 'standby',
        ];

        $updateRes = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/shelters/{$shelterId}", $updatePayload);

        $updateRes->assertOk();
        $shelter->refresh();
        $this->assertEquals(750, $shelter->capacity);
        $this->assertEquals('standby', $shelter->operational_status);
        // Verify audit history preserved
        $this->assertCount(2, $shelter->provenance_metadata['audit_history']);

        // 3. Status Toggle
        $statusRes = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/shelters/{$shelterId}/status", [
                'operational_status' => 'full',
                'notes' => 'Kapasitas telah terisi penuh saat simulasi.',
            ]);

        $statusRes->assertOk();
        $shelter->refresh();
        $this->assertEquals('full', $shelter->operational_status);
        $this->assertCount(3, $shelter->provenance_metadata['audit_history']);

        // 4. Soft Delete (Deactivate)
        $deleteRes = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/shelters/{$shelterId}");

        $deleteRes->assertOk();
        $this->assertSoftDeleted('shelters', ['id' => $shelterId]);

        // History still accessible for admin with trashed
        $adminList = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/shelters?with_trashed=1');
        $adminList->assertOk();
    }

    /**
     * Test regular user or intelligence user cannot manage shelters.
     */
    public function test_non_admin_cannot_manage_shelters(): void
    {
        // Regular user blocked
        $userRes = $this->actingAs($this->regularUser)
            ->postJson('/api/v1/admin/shelters', ['name' => 'Ilegal Shelter']);
        $userRes->assertForbidden();

        // Intelligence user blocked from admin endpoint
        $intelRes = $this->actingAs($this->intelUser)
            ->postJson('/api/v1/admin/shelters', ['name' => 'Ilegal Shelter']);
        $intelRes->assertForbidden();

        // Unauthenticated guest blocked
        $guestRes = $this->postJson('/api/v1/admin/shelters', ['name' => 'Ilegal Shelter']);
        $this->assertContains($guestRes->status(), [401, 403]);
    }
}
