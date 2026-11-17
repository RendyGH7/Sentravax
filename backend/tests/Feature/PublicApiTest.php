<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\SentravaxMasterSeeder;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);
    }

    public function test_public_overview_returns_200_and_payload(): void
    {
        $response = $this->getJson('/api/v1/public/overview');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'platform',
                    'active_hazard_events',
                    'active_alerts',
                    'monitored_regions',
                    'system_status',
                    'telemetry_sync' => [
                        'status',
                        'freshness',
                    ],
                ],
                'meta' => ['timestamp'],
            ]);
    }

    public function test_public_check_location_evaluates_siaga_personal(): void
    {
        $response = $this->getJson('/api/v1/public/check-location?lat=-6.2088&lon=106.8456');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'location' => ['latitude', 'longitude'],
                    'assessment' => [
                        'risk_score',
                        'risk_level',
                        'factors',
                    ],
                    'recommendations' => [
                        'action_steps',
                        'recommended_checklist_items',
                    ],
                    'provenance',
                ],
            ]);
    }

    public function test_public_events_returns_paginated_list(): void
    {
        $response = $this->getJson('/api/v1/public/events');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'current_page',
                    'data' => [
                        '*' => [
                            'id',
                            'title',
                            'severity',
                            'status',
                            'coordinates',
                            'source',
                            'source_name',
                            'provenance_status',
                            'provenance_label',
                        ],
                    ],
                    'total',
                ],
            ]);
    }

    public function test_public_event_detail_returns_event_and_provenance(): void
    {
        $listRes = $this->getJson('/api/v1/public/events');
        $eventId = $listRes->json('data.data.0.id');

        if ($eventId) {
            $response = $this->getJson("/api/v1/public/events/{$eventId}");

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'title',
                        'severity',
                        'status',
                        'data_source' => [
                            'id',
                            'name',
                            'provider',
                            'source_type',
                            'provenance_status',
                        ],
                    ],
                ]);
        }
    }

    public function test_public_map_features_returns_valid_geojson(): void
    {
        $response = $this->getJson('/api/v1/public/map/features');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'type' => 'FeatureCollection',
            ])
            ->assertJsonStructure([
                'features' => [
                    '*' => [
                        'type',
                        'geometry' => ['type', 'coordinates'],
                        'properties' => [
                            'id',
                            'title',
                            'hazard_slug',
                            'hazard_name',
                            'hazard_icon',
                            'severity',
                            'occurred_at',
                            'source_name',
                            'provider_name',
                            'provenance_status',
                            'provenance_label',
                        ],
                    ],
                ],
            ]);

        $features = $response->json('features');
        $this->assertNotEmpty($features);

        // Verify that earthquake event has LIVE provenance and BMKG source
        $earthquake = collect($features)->firstWhere('properties.hazard_slug', 'earthquake');
        if ($earthquake) {
            $this->assertEquals('LIVE', $earthquake['properties']['provenance_status']);
            $this->assertStringContainsString('BMKG', $earthquake['properties']['source_name']);
        }

        // Verify that curated events have STATIC provenance and Curated source
        $curatedEvents = collect($features)->filter(fn($f) => in_array($f['properties']['hazard_slug'], ['flood', 'extreme_weather', 'landslide']));
        $this->assertNotEmpty($curatedEvents);
        foreach ($curatedEvents as $ev) {
            $this->assertEquals('STATIC', $ev['properties']['provenance_status']);
            $this->assertEquals('Data Observasi Terkurasi SENTRAVAX', $ev['properties']['source_name']);
        }
    }

    public function test_public_check_location_validates_coordinates(): void
    {
        // Out of range latitude
        $resInvalidLat = $this->getJson('/api/v1/public/check-location?lat=95.5&lon=106.8');
        $resInvalidLat->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);

        // Missing coordinates
        $resMissing = $this->getJson('/api/v1/public/check-location');
        $resMissing->assertStatus(422)
            ->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    public function test_public_alerts_returns_active_alerts(): void
    {
        $response = $this->getJson('/api/v1/public/alerts');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_public_hazard_types_and_regions(): void
    {
        $resTypes = $this->getJson('/api/v1/public/hazard-types');
        $resTypes->assertStatus(200)->assertJson(['success' => true]);

        $resRegions = $this->getJson('/api/v1/public/regions');
        $resRegions->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_public_education_and_detail(): void
    {
        $res = $this->getJson('/api/v1/public/education');
        $res->assertStatus(200)->assertJson(['success' => true]);

        $firstSlug = $res->json('data.data.0.slug');
        if ($firstSlug) {
            $resDetail = $this->getJson("/api/v1/public/education/{$firstSlug}");
            $resDetail->assertStatus(200)->assertJson(['success' => true]);
        }
    }

    public function test_public_data_sources_returns_provenance(): void
    {
        $res = $this->getJson('/api/v1/public/data-sources');

        $res->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'provider', 'category', 'status', 'freshness_state'],
                ],
            ]);
    }

    /**
     * Enhanced test: Public events search, multi-criteria filtering and sorting.
     */
    public function test_public_events_search_and_filtering(): void
    {
        // 1. Text search by keyword
        $resKeyword = $this->getJson('/api/v1/public/events?q=Gempa');
        $resKeyword->assertStatus(200)
            ->assertJson(['success' => true]);
        foreach ($resKeyword->json('data.data') as $item) {
            $matched = str_contains(strtolower($item['title']), 'gempa') || str_contains(strtolower($item['description'] ?? ''), 'gempa');
            $this->assertTrue($matched);
        }

        // 2. Filter by hazard_type_id
        $ht = HazardType::first();
        if ($ht) {
            $resHt = $this->getJson("/api/v1/public/events?hazard_type_id={$ht->id}");
            $resHt->assertStatus(200);
            foreach ($resHt->json('data.data') as $item) {
                $this->assertEquals($ht->id, $item['hazard_type']['id']);
            }
        }

        // 3. Filter by severity
        $resSev = $this->getJson('/api/v1/public/events?severity=extreme');
        $resSev->assertStatus(200);
        foreach ($resSev->json('data.data') as $item) {
            $this->assertEquals('extreme', $item['severity']);
        }

        // 4. Status = all
        $resAll = $this->getJson('/api/v1/public/events?status=all');
        $resAll->assertStatus(200);

        // 5. Date range
        $resDate = $this->getJson('/api/v1/public/events?date_from=2026-01-01&date_to=2026-12-31');
        $resDate->assertStatus(200);

        // 6. Sort by occurred_at asc
        $resSort = $this->getJson('/api/v1/public/events?sort_by=occurred_at&sort_order=asc&per_page=5');
        $resSort->assertStatus(200);
        $this->assertLessThanOrEqual(5, count($resSort->json('data.data')));
    }

    /**
     * Enhanced test: Public events parameter validation.
     */
    public function test_public_events_validates_parameters(): void
    {
        // Date from after date to
        $resInvalidDates = $this->getJson('/api/v1/public/events?date_from=2026-12-31&date_to=2026-01-01');
        $resInvalidDates->assertStatus(422)
            ->assertJsonValidationErrors(['date_to']);

        // Per page > 50
        $resMaxPerPage = $this->getJson('/api/v1/public/events?per_page=100');
        $resMaxPerPage->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);

        // Invalid severity
        $resInvalidSeverity = $this->getJson('/api/v1/public/events?severity=catastrophic');
        $resInvalidSeverity->assertStatus(422)
            ->assertJsonValidationErrors(['severity']);

        // Invalid sort_by
        $resInvalidSort = $this->getJson('/api/v1/public/events?sort_by=password');
        $resInvalidSort->assertStatus(422)
            ->assertJsonValidationErrors(['sort_by']);
    }

    /**
     * Enhanced test: Public event detail includes spatial nearby events, guidelines, timeline, and allowlisted metadata.
     */
    public function test_public_event_detail_spatial_nearby_and_enrichment(): void
    {
        $ev = HazardEvent::first();
        $this->assertNotNull($ev);

        $res = $this->getJson("/api/v1/public/events/{$ev->id}");
        $res->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'severity',
                    'status',
                    'nearby_events',
                    'safety_guidelines',
                    'timeline',
                    'source_metadata',
                ],
            ]);

        // Verify nearby events do NOT contain the event itself
        $nearby = $res->json('data.nearby_events');
        $this->assertIsArray($nearby);
        $this->assertLessThanOrEqual(3, count($nearby));
        foreach ($nearby as $nr) {
            $this->assertNotEquals($ev->id, $nr['id']);
            $this->assertArrayHasKey('distance_km', $nr);
            $this->assertArrayHasKey('coordinates', $nr);
        }

        // Verify timeline contains faithful semantic fields and labels (zero unevidenced stage claims)
        $timeline = $res->json('data.timeline');
        $this->assertIsArray($timeline);
        $this->assertNotEmpty($timeline);
        $this->assertArrayHasKey('entity', $timeline[0]);
        $this->assertEquals('occurred_at', $timeline[0]['field']);
        $this->assertEquals('Waktu Kejadian Bencana', $timeline[0]['label']);

        // Non-existent ID returns 404
        $res404 = $this->getJson('/api/v1/public/events/999999');
        $res404->assertStatus(404);
    }

    /**
     * Enhanced test: Public alerts list filtering, parameter validation, and strict draft protection.
     */
    public function test_public_alerts_filtering_and_draft_protection(): void
    {
        // 1. Create a draft alert to test protection
        $adminUser = User::where('role', 'admin')->first() ?? User::first();
        $draftAlert = Alert::create([
            'hazard_event_id' => null,
            'region_id' => Region::first()?->id,
            'hazard_type_id' => HazardType::first()?->id,
            'created_by' => $adminUser?->id,
            'title' => 'DRAFT ALERT DO NOT EXPOSE ' . uniqid(),
            'message' => 'Internal draft alert.',
            'alert_class' => 'official_warning',
            'broadcast_level' => 'regional',
            'status' => 'draft',
            'starts_at' => now(),
            'expires_at' => now()->addHours(6),
        ]);

        try {
            // Public list must NEVER contain draft alerts under status=all
            $res = $this->getJson('/api/v1/public/alerts?status=all');
            $res->assertStatus(200);
            $ids = collect($res->json('data.data'))->pluck('id')->all();
            $this->assertNotContains($draftAlert->id, $ids);

            // Filter by alert_class
            $resClass = $this->getJson('/api/v1/public/alerts?alert_class=official_warning');
            $resClass->assertStatus(200);
            foreach ($resClass->json('data.data') as $a) {
                $this->assertEquals('official_warning', $a['alert_class']);
                $this->assertArrayHasKey('is_verified', $a['issuer']);
                $this->assertFalse($a['issuer']['is_verified']);
                $this->assertEquals('Penerbit tidak terverifikasi', $a['issuer']['name']);
            }

            // Filter by valid broadcast_level (scope: regional)
            $resRegional = $this->getJson('/api/v1/public/alerts?broadcast_level=regional');
            $resRegional->assertStatus(200);

            // Validation error: 'watch' is NOT a valid broadcast_level (it is alert_class)
            $resWatch = $this->getJson('/api/v1/public/alerts?broadcast_level=watch');
            $resWatch->assertStatus(422)
                ->assertJsonValidationErrors(['broadcast_level']);

            // Validation error: 'warning' is NOT a valid broadcast_level (it is alert_class, not broadcast scope)
            $resWarning = $this->getJson('/api/v1/public/alerts?broadcast_level=warning');
            $resWarning->assertStatus(422)
                ->assertJsonValidationErrors(['broadcast_level']);

            // Filter by status=cancelled
            $resCancelled = $this->getJson('/api/v1/public/alerts?status=cancelled');
            $resCancelled->assertStatus(200);

            // Validation error: invalid alert_class
            $resInvalid = $this->getJson('/api/v1/public/alerts?alert_class=unknown_class');
            $resInvalid->assertStatus(422)
                ->assertJsonValidationErrors(['alert_class']);

            // Validation error: per_page > 50
            $resMax = $this->getJson('/api/v1/public/alerts?per_page=99');
            $resMax->assertStatus(422)
                ->assertJsonValidationErrors(['per_page']);
        } finally {
            // Clean up test draft alert
            $draftAlert->delete();
        }
    }

    /**
     * Enhanced test: Public alert detail endpoint, verified vs unverified issuer attribution, and draft protection.
     * Proves: Hazard event data source does NOT automatically make alert considered issued by that data source.
     */
    public function test_public_alert_detail_and_issuer_attribution(): void
    {
        // 1. Alert linked to a hazard event with DataSource (e.g. Flood with BPBD or Earthquake with BMKG)
        // Must strictly separate Alert Issuer from Event Data Source!
        $linkedAlert = Alert::whereNotNull('hazard_event_id')->first();
        if ($linkedAlert) {
            $resL = $this->getJson("/api/v1/public/alerts/{$linkedAlert->id}");
            $resL->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $linkedAlert->id,
                        'issuer' => [
                            'is_verified' => false,
                            'name' => 'Penerbit tidak terverifikasi',
                            'provider' => null,
                        ],
                    ],
                ]);

            // Event data source is present, but strictly labeled as event_data_source, NOT alert issuer
            $this->assertNotNull($resL->json('data.event_data_source'));
            $this->assertNotEmpty($resL->json('data.event_data_source.name'));
            $this->assertNotNull($resL->json('data.hazard_event.data_source'));
            $this->assertFalse($resL->json('data.issuer.is_verified'));
            $this->assertEquals('Penerbit tidak terverifikasi', $resL->json('data.issuer.name'));
        }

        // 2. Alert without linked hazard event (unverified issuer and null event_data_source)
        $unlinkedAlert = Alert::whereNull('hazard_event_id')->where('status', 'active')->first();
        if ($unlinkedAlert) {
            $resU = $this->getJson("/api/v1/public/alerts/{$unlinkedAlert->id}");
            $resU->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $unlinkedAlert->id,
                        'issuer' => [
                            'is_verified' => false,
                            'name' => 'Penerbit tidak terverifikasi',
                            'provider' => null,
                        ],
                        'event_data_source' => null,
                    ],
                ]);
        }

        // 3. Draft alert must return 404
        $adminUser = User::where('role', 'admin')->first() ?? User::first();
        $draftAlert = Alert::create([
            'hazard_event_id' => null,
            'region_id' => Region::first()?->id,
            'hazard_type_id' => HazardType::first()?->id,
            'created_by' => $adminUser?->id,
            'title' => 'SECRET DRAFT ' . uniqid(),
            'message' => 'Must not be viewed.',
            'alert_class' => 'platform_advisory',
            'broadcast_level' => 'regional',
            'status' => 'draft',
            'starts_at' => now(),
            'expires_at' => now()->addHours(2),
        ]);

        try {
            $resDraft = $this->getJson("/api/v1/public/alerts/{$draftAlert->id}");
            $resDraft->assertStatus(404);
        } finally {
            $draftAlert->delete();
        }

        // 4. Non-existent ID returns 404
        $resNotFound = $this->getJson('/api/v1/public/alerts/999999');
        $resNotFound->assertStatus(404);
    }
}
