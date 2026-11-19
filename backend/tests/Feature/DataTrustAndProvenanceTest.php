<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\ReportVerification;
use App\Models\RiskAssessment;
use App\Models\Shelter;
use App\Models\User;
use App\Services\ExternalData\FreshnessClassifierService;
use Tests\TestCase;

class DataTrustAndProvenanceTest extends TestCase
{
    /**
     * Test 1: All registered data sources strictly adhere to the 3-dimension taxonomy.
     * Dimension A (Connectivity): LIVE, STATIC, OFFLINE, UNKNOWN
     * Dimension B (Freshness): FRESH, DELAYED, STALE, UNAVAILABLE, UNKNOWN
     * Dimension C (Provenance): OFFICIAL, OBSERVED, COMMUNITY_REPORT, SENTRAVAX_INSIGHT, SIMULATED, CURATED_REFERENCE
     */
    public function test_all_data_sources_adhere_to_three_dimensional_taxonomy(): void
    {
        $sources = DataSource::all();
        $this->assertGreaterThanOrEqual(6, $sources->count());

        $allowedConnectivity = [
            FreshnessClassifierService::CONNECTIVITY_LIVE,
            FreshnessClassifierService::CONNECTIVITY_STATIC,
            FreshnessClassifierService::CONNECTIVITY_OFFLINE,
            FreshnessClassifierService::CONNECTIVITY_UNKNOWN,
        ];

        $allowedFreshness = [
            FreshnessClassifierService::STATE_FRESH,
            FreshnessClassifierService::STATE_DELAYED,
            FreshnessClassifierService::STATE_STALE,
            FreshnessClassifierService::STATE_UNAVAILABLE,
            FreshnessClassifierService::STATE_UNKNOWN,
        ];

        $allowedProvenance = [
            FreshnessClassifierService::PROVENANCE_OFFICIAL,
            FreshnessClassifierService::PROVENANCE_OBSERVED,
            FreshnessClassifierService::PROVENANCE_COMMUNITY_REPORT,
            FreshnessClassifierService::PROVENANCE_SENTRAVAX_INSIGHT,
            FreshnessClassifierService::PROVENANCE_SIMULATED,
            FreshnessClassifierService::PROVENANCE_CURATED_REFERENCE,
        ];

        foreach ($sources as $source) {
            $info = $source->freshness_info;

            $this->assertArrayHasKey('connectivity_state', $info, "Source #{$source->id} missing connectivity_state");
            $this->assertArrayHasKey('freshness_state', $info, "Source #{$source->id} missing freshness_state");
            $this->assertArrayHasKey('provenance_type', $info, "Source #{$source->id} missing provenance_type");

            $this->assertContains($info['connectivity_state'], $allowedConnectivity);
            $this->assertContains($info['freshness_state'], $allowedFreshness);
            $this->assertContains($info['provenance_type'], $allowedProvenance);

            $this->assertEquals($info['connectivity_state'], $source->connectivity_state);
            $this->assertEquals($info['freshness_state'], $source->freshness_state);
            $this->assertEquals($info['provenance_type'], $source->provenance_type);
        }
    }

    /**
     * Test 2: PVMBG and InSAR are strictly CURATED_REFERENCE and STATIC, never LIVE or real-time.
     */
    public function test_pvmbg_and_insar_are_strictly_curated_reference_and_static(): void
    {
        $pvmbg = DataSource::where('name', 'like', '%PVMBG%')->first();
        $this->assertNotNull($pvmbg);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_STATIC, $pvmbg->connectivity_state);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_CURATED_REFERENCE, $pvmbg->provenance_type);
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $pvmbg->freshness_state);
        $this->assertStringContainsString('bukan koneksi live sensor real-time', $pvmbg->freshness_info['explanation']);

        $insar = DataSource::where('name', 'like', '%InSAR%')->first();
        $this->assertNotNull($insar);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_STATIC, $insar->connectivity_state);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_CURATED_REFERENCE, $insar->provenance_type);
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $insar->freshness_state);
        $this->assertStringContainsString('bukan telemetri instan live', $insar->freshness_info['explanation']);
    }

    /**
     * Test 3: BMKG data sources are classified as LIVE connectivity and OFFICIAL or OBSERVED provenance.
     */
    public function test_bmkg_sources_are_live_and_official_or_observed(): void
    {
        $bmkgTews = DataSource::where('name', 'like', '%TEWS%')->first();
        $this->assertNotNull($bmkgTews);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_LIVE, $bmkgTews->connectivity_state);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_OFFICIAL, $bmkgTews->provenance_type);

        $bmkgRadar = DataSource::where('name', 'like', '%Radar%')->first();
        $this->assertNotNull($bmkgRadar);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_LIVE, $bmkgRadar->connectivity_state);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_OBSERVED, $bmkgRadar->provenance_type);

        $bmkgCap = DataSource::where('name', 'like', '%CAP%')->first();
        $this->assertNotNull($bmkgCap);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_LIVE, $bmkgCap->connectivity_state);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_OFFICIAL, $bmkgCap->provenance_type);
    }

    /**
     * Test 4: Curated simulation source is strictly OFFLINE connectivity and SIMULATED provenance.
     */
    public function test_curated_source_is_offline_and_simulated(): void
    {
        $curated = DataSource::where('source_type', 'curated')->first();
        $this->assertNotNull($curated);
        $this->assertEquals(FreshnessClassifierService::CONNECTIVITY_OFFLINE, $curated->connectivity_state);
        $this->assertEquals(FreshnessClassifierService::PROVENANCE_SIMULATED, $curated->provenance_type);
        $this->assertEquals(FreshnessClassifierService::STATE_UNKNOWN, $curated->freshness_state);
    }

    /**
     * Test 5: Baseline records cannot be deleted (Model protection guard).
     */
    public function test_baseline_records_are_protected_against_unintended_deletion(): void
    {
        // 1. RiskAssessment #1
        $ra1 = RiskAssessment::find(1);
        $this->assertNotNull($ra1);
        try {
            $ra1->delete();
            $this->fail('Expected RuntimeException when deleting baseline RiskAssessment #1');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('dilindungi dari penghapusan', $e->getMessage());
        }

        // 2. AiInsight #1
        $ai1 = AiInsight::find(1);
        $this->assertNotNull($ai1);
        try {
            $ai1->delete();
            $this->fail('Expected RuntimeException when deleting baseline AiInsight #1');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('dilindungi dari penghapusan', $e->getMessage());
        }

        // 3. Shelters 1..5
        foreach ([1, 2, 3, 4, 5] as $shelterId) {
            $shelter = Shelter::find($shelterId);
            $this->assertNotNull($shelter);
            try {
                $shelter->delete();
                $this->fail("Expected RuntimeException when deleting baseline Shelter #{$shelterId}");
            } catch (\RuntimeException $e) {
                $this->assertStringContainsString('dilindungi dari penghapusan', $e->getMessage());
            }
        }

        // 4. Community Reports 1 & 9
        foreach ([1, 9] as $reportId) {
            $cr = CommunityReport::find($reportId);
            $this->assertNotNull($cr);
            try {
                $cr->delete();
                $this->fail("Expected RuntimeException when deleting baseline CommunityReport #{$reportId}");
            } catch (\RuntimeException $e) {
                $this->assertStringContainsString('dilindungi dari penghapusan', $e->getMessage());
            }
        }

        // 5. Data Sources 2..7
        foreach ([2, 3, 4, 5, 6, 7] as $dsId) {
            $ds = DataSource::find($dsId);
            $this->assertNotNull($ds);
            try {
                $ds->delete();
                $this->fail("Expected RuntimeException when deleting baseline DataSource #{$dsId}");
            } catch (\RuntimeException $e) {
                $this->assertStringContainsString('dilindungi dari penghapusan', $e->getMessage());
            }
        }
    }

    /**
     * Test 6: API endpoints return exact 3-dimensional standardized status for PVMBG, InSAR, and Curated Demo.
     */
    public function test_api_endpoints_return_standardized_provenance_for_curated_and_simulated_sources(): void
    {
        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $intel = User::where('role', User::ROLE_INTELLIGENCE)->first();

        // 1. Public API
        $publicRes = $this->getJson('/api/v1/public/data-sources');
        $publicRes->assertStatus(200);
        $publicData = collect($publicRes->json('data'));

        $pvmbgPublic = $publicData->firstWhere('id', 4);
        $this->assertNotNull($pvmbgPublic);
        $this->assertEquals('STATIC', $pvmbgPublic['connectivity_state']);
        $this->assertEquals('UNKNOWN', $pvmbgPublic['freshness_state']);
        $this->assertEquals('CURATED_REFERENCE', $pvmbgPublic['provenance_type']);

        $insarPublic = $publicData->firstWhere('id', 5);
        $this->assertNotNull($insarPublic);
        $this->assertEquals('STATIC', $insarPublic['connectivity_state']);
        $this->assertEquals('UNKNOWN', $insarPublic['freshness_state']);
        $this->assertEquals('CURATED_REFERENCE', $insarPublic['provenance_type']);

        $demoPublic = $publicData->firstWhere('id', 6);
        $this->assertNotNull($demoPublic);
        $this->assertEquals('OFFLINE', $demoPublic['connectivity_state']);
        $this->assertEquals('UNKNOWN', $demoPublic['freshness_state']);
        $this->assertEquals('SIMULATED', $demoPublic['provenance_type']);

        // 2. Admin API
        $adminRes = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/data-sources');
        $adminRes->assertStatus(200);
        $adminData = collect($adminRes->json('data'));

        $pvmbgAdmin = $adminData->firstWhere('id', 4);
        $this->assertEquals('STATIC', $pvmbgAdmin['connectivity_state']);
        $this->assertEquals('UNKNOWN', $pvmbgAdmin['freshness_state']);
        $this->assertEquals('CURATED_REFERENCE', $pvmbgAdmin['provenance_type']);

        // 3. Intelligence API
        $intelRes = $this->actingAs($intel, 'sanctum')->getJson('/api/v1/intel/data-sources');
        $intelRes->assertStatus(200);
        $intelData = collect($intelRes->json('data'));

        $insarIntel = $intelData->firstWhere('id', 5);
        $this->assertEquals('STATIC', $insarIntel['connectivity_state']);
        $this->assertEquals('UNKNOWN', $insarIntel['freshness_state']);
        $this->assertEquals('CURATED_REFERENCE', $insarIntel['provenance_type']);
    }
}
