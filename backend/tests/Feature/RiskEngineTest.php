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
}

