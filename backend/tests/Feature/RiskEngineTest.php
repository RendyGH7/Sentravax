<?php

namespace Tests\Feature;

use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use App\Services\ExternalData\DataSyncService;
use App\Services\RiskEngine\RiskEngineService;
use Database\Seeders\SentravaxMasterSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RiskEngineTest extends TestCase
{
    use DatabaseTransactions;

    protected RiskEngineService $riskEngine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        DB::table('data_source_sync_runs')->delete();
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $bmkg?->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);

        $this->riskEngine = app(RiskEngineService::class);
    }

    public function test_risk_engine_evaluates_spatial_coordinates_with_factors(): void
    {
        $bmkg = \App\Models\DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $bmkg?->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);

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
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $bmkg?->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);

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
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();

        // 1. Fresh Feed (synced within 60m)
        $bmkg->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);
        DB::table('data_source_sync_runs')->where('data_source_id', $bmkg->id)->delete();
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

    /**
     * Skenario A: Sumber baru dibuat oleh Seeder, belum pernah berhasil sinkronisasi.
     * - last_successful_at harus NULL.
     * - Status awal jujur 'pending'.
     * - Tidak boleh berstatus FRESH/LIVE tanpa bukti.
     */
    public function test_scenario_a_newly_seeded_source_without_sync_is_unavailable_and_never_fresh(): void
    {
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $bmkg->update([
            'status' => 'pending',
            'last_fetched_at' => null,
            'last_successful_at' => null,
        ]);
        DB::table('data_source_sync_runs')->where('data_source_id', $bmkg->id)->delete();

        $this->assertNull($bmkg->fresh()->last_successful_at);
        $this->assertEquals('pending', $bmkg->fresh()->status);

        $eval = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);

        $this->assertEquals('UNAVAILABLE', $eval['data_freshness']);
        $this->assertEquals('INSUFFICIENT_DATA', $eval['assessment_status']);
        $this->assertEquals('insufficient_data', $eval['risk_level']);
        $this->assertNotEquals('FRESH', $eval['data_freshness']);
        $this->assertEquals('UNAVAILABLE', $eval['factors']['data_quality']['status']);
    }

    /**
     * Skenario B: Sinkronisasi BMKG berhasil.
     * - last_successful_at diperbarui berdasarkan waktu keberhasilan aktual.
     * - Status menjadi FRESH karena dalam batas 60 menit.
     * - assessment_status menjadi ASSESSED.
     */
    public function test_scenario_b_successful_bmkg_sync_updates_last_successful_at_and_becomes_fresh(): void
    {
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        DB::table('data_source_sync_runs')->where('data_source_id', $bmkg->id)->delete();

        Http::fake([
            'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json' => Http::response([
                'Infogempa' => [
                    'gempa' => [
                        'Tanggal' => '16 Nov 2026',
                        'Jam' => '10:00:00 WIB',
                        'DateTime' => '2026-11-16T03:00:00+00:00',
                        'Coordinates' => '-6.20,106.85',
                        'Lintang' => '6.20 LS',
                        'Bujur' => '106.85 BT',
                        'Magnitude' => '5.2',
                        'Kedalaman' => '10 km',
                        'Wilayah' => 'Pusat Jakarta',
                        'Potensi' => 'Tidak berpotensi tsunami',
                    ],
                ],
            ], 200),
        ]);

        $syncService = app(DataSyncService::class);
        $syncRun = $syncService->syncDataSource($bmkg);

        $this->assertEquals('SUCCESS', $syncRun->status);
        $this->assertEquals('LIVE', $syncRun->freshness_state);

        $bmkgFresh = $bmkg->fresh();
        $this->assertEquals('active', $bmkgFresh->status);
        $this->assertNotNull($bmkgFresh->last_successful_at);
        $this->assertLessThanOrEqual(5, abs(now()->diffInSeconds($bmkgFresh->last_successful_at)));

        $eval = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $this->assertEquals('FRESH', $eval['data_freshness']);
        $this->assertEquals('ASSESSED', $eval['assessment_status']);

        // Clean up test-created event to ensure clean shared testing state
        HazardEvent::where('title', 'like', '%Gempa Bumi Mag 5.2 Pusat Jakarta%')->delete();
    }

    /**
     * Skenario C: Sinkronisasi BMKG gagal.
     * - Status FAILED/UNAVAILABLE tercatat.
     * - last_successful_at TIDAK berubah / tidak diperbarui.
     * - DataQuality Gatekeeper mengenali kegagalan dan tidak melaporkan LIVE/FRESH.
     */
    public function test_scenario_c_failed_bmkg_sync_does_not_update_last_successful_at_and_reports_unavailable(): void
    {
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $pastSuccessTime = now()->subMinutes(15);
        $bmkg->update([
            'status' => 'active',
            'last_successful_at' => $pastSuccessTime,
        ]);

        Http::fake([
            'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json' => Http::response(null, 500),
        ]);

        $syncService = app(DataSyncService::class);
        $syncRun = $syncService->syncDataSource($bmkg);

        $this->assertEquals('FAILED', $syncRun->status);
        $this->assertEquals('UNAVAILABLE', $syncRun->freshness_state);

        $bmkgFresh = $bmkg->fresh();
        // last_successful_at must strictly remain untouched
        $this->assertEquals($pastSuccessTime->timestamp, $bmkgFresh->last_successful_at->timestamp);

        $eval = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);
        $this->assertEquals('UNAVAILABLE', $eval['data_freshness']);
        $this->assertEquals('INSUFFICIENT_DATA', $eval['assessment_status']);
        $this->assertEquals('insufficient_data', $eval['risk_level']);
        $this->assertNotEquals('FRESH', $eval['data_freshness']);
    }

    /**
     * Skenario D: Data telemetri stale (> 60 menit lalu).
     * - Data lama tetap dapat diakses di PostGIS sebagai observasi tercatat.
     * - Gatekeeper melaporkan STALE dan ASSESSED.
     * - Penjelasan eksplisit bahwa sinkronisasi data tertunda.
     */
    public function test_scenario_d_stale_data_retains_cached_observation_with_delay_warning(): void
    {
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $bmkg->update([
            'status' => 'active',
            'last_successful_at' => now()->subMinutes(75),
        ]);
        DB::table('data_source_sync_runs')->where('data_source_id', $bmkg->id)->delete();

        $eval = $this->riskEngine->evaluateLocationRisk(-6.1754, 106.8272);

        $this->assertEquals('STALE', $eval['data_freshness']);
        $this->assertEquals('ASSESSED', $eval['assessment_status']);
        $this->assertStringContainsString('tertunda', $eval['factors']['data_quality']['description']);
        $this->assertStringContainsString('> 60 menit', $eval['factors']['data_quality']['description']);
    }

    /**
     * Skenario E: Seeder dijalankan berulang kali (idempotensi mutlak).
     * - Tidak ada duplikasi DataSource.
     * - Tidak ada penimpaan palsu pada last_successful_at yang sudah tercatat.
     * - Relasi data tetap utuh.
     */
    public function test_scenario_e_seeder_is_fully_idempotent_and_never_overwrites_success_timestamp_or_duplicates_rows(): void
    {
        $bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $recordedTime = now()->subMinutes(25);
        $bmkg->update([
            'status' => 'active',
            'last_successful_at' => $recordedTime,
        ]);

        $initialSourcesCount = DataSource::count();
        $initialRegionsCount = Region::count();
        $initialHazardEventsCount = HazardEvent::count();

        // Run master seeder repeatedly
        (new SentravaxMasterSeeder())->run();
        (new SentravaxMasterSeeder())->run();

        // 1. Zero duplicate rows
        $this->assertEquals($initialSourcesCount, DataSource::count());
        $this->assertEquals($initialRegionsCount, Region::count());
        $this->assertEquals($initialHazardEventsCount, HazardEvent::count());

        // 2. Verified timestamp is strictly preserved and NOT overwritten by fake subMinutes(5)
        $bmkgRecheck = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();
        $this->assertEquals($recordedTime->timestamp, $bmkgRecheck->last_successful_at->timestamp);
        $this->assertEquals('active', $bmkgRecheck->status);
    }

    /**
     * Test dynamic regional assessment scope across multiple regions, hazards, and methodology versions.
     * - Ensures dynamic evaluations can be updated without duplication.
     * - Ensures historical baseline benchmark (#1) is NEVER overwritten.
     * - Ensures methodology version cleanly separates records without hardcoded ID dependencies.
     */
    public function test_dynamic_regional_scope_across_multiple_regions_hazards_and_methodologies(): void
    {
        $engine = app(RiskEngineService::class);

        $regionEast = Region::where('code', 'ID-JK-JT')->first() ?? Region::find(3);
        $regionNorth = Region::where('code', 'ID-JK-JU')->first() ?? Region::find(2);
        $regionBogor = Region::where('code', 'ID-JB-BGR')->first() ?? Region::find(4);

        $flood = HazardType::where('slug', 'flood')->first() ?? HazardType::find(1);
        $landslide = HazardType::where('slug', 'landslide')->first() ?? HazardType::find(2);

        // Baseline assessment #1 snapshot check
        $baseline1 = RiskAssessment::find(1);
        $this->assertNotNull($baseline1);
        $originalBaselineScore = $baseline1->risk_score;
        $originalBaselineMethodology = $baseline1->methodology_version;
        $originalBaselineEventId = $baseline1->hazard_event_id;

        // 1. Evaluate Region East + Flood (same region & hazard as baseline #1)
        $dynamicEast = $engine->evaluateAndPersistRegionalRisk($regionEast->id, $flood->id);
        $this->assertNotEquals(1, $dynamicEast->id, 'Dynamic assessment must not overwrite baseline ID 1');
        $this->assertEquals(RiskEngineService::METHODOLOGY_VERSION, $dynamicEast->methodology_version);
        $this->assertNull($dynamicEast->hazard_event_id);

        // Re-evaluating must update the existing record without creating duplicate
        $dynamicEastAgain = $engine->evaluateAndPersistRegionalRisk($regionEast->id, $flood->id);
        $this->assertEquals($dynamicEast->id, $dynamicEastAgain->id);

        // 2. Evaluate Region North + Flood
        $dynamicNorth = $engine->evaluateAndPersistRegionalRisk($regionNorth->id, $flood->id);
        $this->assertNotEquals($dynamicEast->id, $dynamicNorth->id);
        $this->assertEquals($regionNorth->id, $dynamicNorth->region_id);

        $dynamicNorthAgain = $engine->evaluateAndPersistRegionalRisk($regionNorth->id, $flood->id);
        $this->assertEquals($dynamicNorth->id, $dynamicNorthAgain->id);

        // 3. Evaluate Region Bogor + Landslide
        $dynamicBogor = $engine->evaluateAndPersistRegionalRisk($regionBogor->id, $landslide->id);
        $this->assertEquals($regionBogor->id, $dynamicBogor->region_id);
        $this->assertEquals($landslide->id, $dynamicBogor->hazard_type_id);

        // 4. Verify baseline #1 was NOT modified
        $baseline1Recheck = RiskAssessment::find(1);
        $this->assertEquals($originalBaselineScore, $baseline1Recheck->risk_score);
        $this->assertEquals($originalBaselineMethodology, $baseline1Recheck->methodology_version);
        $this->assertEquals($originalBaselineEventId, $baseline1Recheck->hazard_event_id);

        // 5. Verify alternative methodology version is isolated
        $legacyScopeCount = RiskAssessment::where('methodology_version', 'v1.0-rules')->count();
        $dynamicScopeCount = RiskAssessment::query()->dynamicRegional()->count();
        $this->assertGreaterThanOrEqual(1, $legacyScopeCount);
        $this->assertGreaterThanOrEqual(3, $dynamicScopeCount);

        // Clean up created test dynamic assessments so database returns to pristine baseline state
        RiskAssessment::whereIn('id', [$dynamicEast->id, $dynamicNorth->id, $dynamicBogor->id])->delete();
    }
}

