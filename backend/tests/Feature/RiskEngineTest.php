<?php

namespace Tests\Feature;

use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use App\Services\RiskEngine\RiskEngineService;
use Database\Seeders\SentravaxMasterSeeder;
use Tests\TestCase;

class RiskEngineTest extends TestCase
{
    protected RiskEngineService $riskEngine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->riskEngine = app(RiskEngineService::class);
    }

    public function test_risk_engine_evaluates_spatial_coordinates_with_factors(): void
    {
        // Central Jakarta coordinates
        $result = $this->riskEngine->evaluateLocationRisk(-6.2088, 106.8456);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('risk_score', $result);
        $this->assertArrayHasKey('risk_level', $result);
        $this->assertArrayHasKey('factors', $result);
        $this->assertArrayHasKey('methodology_version', $result);

        $this->assertGreaterThanOrEqual(5.0, $result['risk_score']);
        $this->assertLessThanOrEqual(98.0, $result['risk_score']);
        $this->assertContains($result['risk_level'], ['low', 'medium', 'high', 'critical']);
    }

    public function test_risk_engine_handles_remote_coordinates_gracefully(): void
    {
        // Remote coordinate with no nearby active threats
        $result = $this->riskEngine->evaluateLocationRisk(-3.5000, 138.5000);

        $this->assertIsArray($result);
        $this->assertGreaterThanOrEqual(5.0, $result['risk_score']);
        $this->assertArrayHasKey('factors', $result);
    }

    public function test_risk_engine_persists_regional_assessment(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $assessment = $this->riskEngine->evaluateAndPersistRegionalRisk(
            $region->id,
            $hazardType->id,
            'Penilaian Risiko Uji Komprehensif'
        );

        $this->assertInstanceOf(RiskAssessment::class, $assessment);
        $this->assertEquals($region->id, $assessment->region_id);
        $this->assertEquals($hazardType->id, $assessment->hazard_type_id);
        $this->assertEquals(RiskEngineService::METHODOLOGY_VERSION, $assessment->methodology_version);
        $this->assertIsArray($assessment->calculation_factors);

        $this->assertDatabaseHas('risk_assessments', [
            'id' => $assessment->id,
            'region_id' => $region->id,
            'hazard_type_id' => $hazardType->id,
        ]);
    }

    public function test_factor_contributions_sum_strictly_equals_final_score(): void
    {
        // 1. In-pilot Monas Jakarta coordinates
        $resultMonas = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $this->assertEquals('ASSESSED', $resultMonas['assessment_status']);

        $sumFactorsMonas = 0.0;
        foreach ($resultMonas['factors'] as $factor) {
            if (isset($factor['contribution'])) {
                $sumFactorsMonas += (float) $factor['contribution'];
            }
        }
        $this->assertEquals($resultMonas['risk_score'], round($sumFactorsMonas, 1));

        // 2. Out-of-coverage Enggano coordinates with active BMKG threat
        $resultEnggano = $this->riskEngine->evaluateLocationRisk(-5.56, 102.24);
        $this->assertEquals('INSUFFICIENT_DATA', $resultEnggano['assessment_status']);
        $this->assertCount(1, $resultEnggano['factors']['nearby_active_events']['threats'] ?? []);

        $threat = $resultEnggano['factors']['nearby_active_events']['threats'][0];
        $this->assertEquals('BMKG TEWS Open Data API', $threat['source_name']);
        $this->assertEquals('Badan Meteorologi, Klimatologi, dan Geofisika', $threat['provider_name']);
        $this->assertEquals('LIVE', $threat['provenance_status']);
        $this->assertEquals('LIVE (BMKG TEWS)', $threat['provenance_label']);
    }

    public function test_data_quality_gatekeeper_enforces_fresh_stale_unavailable_states(): void
    {
        $bmkg = \App\Models\DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();

        // 1. Fresh Feed (synced within 60m)
        $bmkg->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);
        $evalFresh = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $this->assertEquals('FRESH', $evalFresh['data_freshness']);
        $this->assertEquals('ASSESSED', $evalFresh['assessment_status']);

        // 2. Stale Feed (synced 90m ago)
        $bmkg->update(['last_successful_at' => now()->subMinutes(90)]);
        $evalStale = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $this->assertEquals('STALE', $evalStale['data_freshness']);
        $this->assertEquals('ASSESSED', $evalStale['assessment_status']);
        $this->assertStringContainsString('tertunda', $evalStale['factors']['data_quality']['description']);

        // 3. Unavailable Feed (offline / error / synced > 24 hours ago)
        $bmkg->update(['last_successful_at' => now()->subHours(25)]);
        $evalUnavailable = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $this->assertEquals('UNAVAILABLE', $evalUnavailable['data_freshness']);
        $this->assertEquals('INSUFFICIENT_DATA', $evalUnavailable['assessment_status']);
        $this->assertEquals('insufficient_data', $evalUnavailable['risk_level']);

        // 4. Restore fresh state
        $bmkg->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);
    }
}

