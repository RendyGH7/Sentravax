<?php

namespace Tests\Feature;

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
                    'data',
                    'total',
                ],
            ]);
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
                'features',
            ]);
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
}
