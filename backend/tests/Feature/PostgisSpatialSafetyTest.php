<?php

namespace Tests\Feature;

use App\Models\HazardType;
use App\Models\Region;
use App\Models\Shelter;
use App\Models\User;
use App\Services\RiskEngine\RiskEngineService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PostgisSpatialSafetyTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $citizenUser;
    protected HazardType $hazardType;
    protected Region $region;
    protected Shelter $shelter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::where('role', 'admin')->firstOrFail();
        $this->citizenUser = User::where('role', 'user')->firstOrFail();
        $this->hazardType = HazardType::firstOrFail();
        $this->region = Region::firstOrFail();
        $this->shelter = Shelter::where('verification_status', 'VERIFIED')->firstOrFail();
    }

    public function test_valid_coordinates_persist_exact_postgis_point_4326_across_endpoints(): void
    {
        $lat = -6.2088;
        $lon = 106.8456;

        // 1. Public report (Zero-barrier)
        $pubRes = $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $this->hazardType->id,
            'region_id' => $this->region->id,
            'title' => 'Laporan Spasial Publik Valid',
            'description' => 'Pengujian penyimpanan titik PostGIS terparameterisasi.',
            'latitude' => $lat,
            'longitude' => $lon,
        ]);
        $pubRes->assertStatus(201);
        $pubId = $pubRes->json('data.id');
        $pubPoint = DB::selectOne('SELECT ST_X(location) as lon, ST_Y(location) as lat, ST_SRID(location) as srid FROM community_reports WHERE id = ?', [$pubId]);
        $this->assertEqualsWithDelta($lon, (float) $pubPoint->lon, 0.0001);
        $this->assertEqualsWithDelta($lat, (float) $pubPoint->lat, 0.0001);
        $this->assertSame(4326, (int) $pubPoint->srid);

        // 2. Authenticated user report
        $userRes = $this->actingAs($this->citizenUser, 'sanctum')->postJson('/api/v1/user/reports', [
            'hazard_type_id' => $this->hazardType->id,
            'region_id' => $this->region->id,
            'title' => 'Laporan Spasial User Valid',
            'description' => 'Pengujian penyimpanan titik PostGIS user portal.',
            'latitude' => $lat,
            'longitude' => $lon,
        ]);
        $userRes->assertStatus(201);
        $userId = $userRes->json('data.id');
        $userPoint = DB::selectOne('SELECT ST_X(location) as lon, ST_Y(location) as lat, ST_SRID(location) as srid FROM community_reports WHERE id = ?', [$userId]);
        $this->assertEqualsWithDelta($lon, (float) $userPoint->lon, 0.0001);
        $this->assertEqualsWithDelta($lat, (float) $userPoint->lat, 0.0001);
        $this->assertSame(4326, (int) $userPoint->srid);

        // 3. Admin hazard event creation
        $adminRes = $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/v1/admin/events', [
            'region_id' => $this->region->id,
            'hazard_type_id' => $this->hazardType->id,
            'title' => 'Event Spasial Admin Valid',
            'severity' => 'moderate',
            'status' => 'active',
            'latitude' => $lat,
            'longitude' => $lon,
            'occurred_at' => now()->toIso8601String(),
        ]);
        $adminRes->assertStatus(201);
        $eventId = $adminRes->json('data.id');
        $eventPoint = DB::selectOne('SELECT ST_X(location) as lon, ST_Y(location) as lat, ST_SRID(location) as srid FROM hazard_events WHERE id = ?', [$eventId]);
        $this->assertEqualsWithDelta($lon, (float) $eventPoint->lon, 0.0001);
        $this->assertEqualsWithDelta($lat, (float) $eventPoint->lat, 0.0001);
        $this->assertSame(4326, (int) $eventPoint->srid);
    }

    public function test_out_of_range_longitude_is_rejected(): void
    {
        $this->getJson('/api/v1/public/check-location?lat=-6.2&lon=181')->assertStatus(422);
        $this->getJson('/api/v1/public/check-location?lat=-6.2&lon=-181')->assertStatus(422);
        $this->getJson("/api/v1/public/shelters/{$this->shelter->id}?lat=-6.2&lon=190")->assertStatus(422);
        $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $this->hazardType->id,
            'region_id' => $this->region->id,
            'title' => 'Invalid Lon',
            'description' => 'Testing out of range lon',
            'latitude' => -6.2,
            'longitude' => 185.0,
        ])->assertStatus(422);
    }

    public function test_out_of_range_latitude_is_rejected(): void
    {
        $this->getJson('/api/v1/public/check-location?lat=91&lon=106.8')->assertStatus(422);
        $this->getJson('/api/v1/public/check-location?lat=-91&lon=106.8')->assertStatus(422);
        $this->getJson("/api/v1/public/shelters/{$this->shelter->id}?lat=-95&lon=106.8")->assertStatus(422);
        $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $this->hazardType->id,
            'region_id' => $this->region->id,
            'title' => 'Invalid Lat',
            'description' => 'Testing out of range lat',
            'latitude' => 95.0,
            'longitude' => 106.8,
        ])->assertStatus(422);
    }

    public function test_null_non_numeric_and_sql_injection_coordinates_are_rejected_safely(): void
    {
        $this->getJson('/api/v1/public/check-location')->assertStatus(422);
        $this->getJson('/api/v1/public/check-location?lat=abc&lon=106.8')->assertStatus(422);
        $this->getJson("/api/v1/public/shelters/{$this->shelter->id}?lat=abc&lon=106.8")->assertStatus(422);
        $this->getJson("/api/v1/public/shelters/{$this->shelter->id}?lat=-6.2")->assertStatus(422);

        $sqlPayload = '-6.2; DROP TABLE users;--';
        $this->getJson('/api/v1/public/check-location?lat=' . urlencode($sqlPayload) . '&lon=106.8')->assertStatus(422);
        $this->getJson("/api/v1/public/shelters/{$this->shelter->id}?lat=" . urlencode($sqlPayload) . '&lon=106.8')->assertStatus(422);
        $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $this->hazardType->id,
            'region_id' => $this->region->id,
            'title' => 'SQLi Test',
            'description' => 'SQLi coordinate check',
            'latitude' => $sqlPayload,
            'longitude' => '106.8 OR 1=1',
        ])->assertStatus(422);

        $this->assertGreaterThan(0, User::count());

        $this->expectException(\InvalidArgumentException::class);
        app(RiskEngineService::class)->evaluateLocationRisk(NAN, 106.8);
    }

    public function test_shelter_distance_and_risk_engine_remain_deterministic_and_accurate(): void
    {
        $shelterRes = $this->getJson("/api/v1/public/shelters/{$this->shelter->id}?lat=-6.2088&lon=106.8456");
        $shelterRes->assertStatus(200)
            ->assertJson(['success' => true]);
        $this->assertIsNumeric($shelterRes->json('data.distance_km'));

        $riskEngine = app(RiskEngineService::class);
        $eval1 = $riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $eval2 = $riskEngine->evaluateLocationRisk(-6.1754, 106.8272);

        $this->assertSame($eval1['risk_score'], $eval2['risk_score']);
        $this->assertSame($eval1['risk_level'], $eval2['risk_level']);
        $this->assertSame($eval1['assessment_status'], $eval2['assessment_status']);
        $this->assertSame($eval1['region']['id'] ?? null, $eval2['region']['id'] ?? null);
    }
}
