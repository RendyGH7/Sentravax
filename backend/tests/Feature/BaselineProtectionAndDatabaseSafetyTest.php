<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\ReportVerification;
use App\Models\RiskAssessment;
use App\Models\Shelter;
use App\Models\User;
use App\Services\RiskEngine\RiskEngineService;
use Database\Seeders\SentravaxMasterSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use RuntimeException;
use Tests\TestCase;

class BaselineProtectionAndDatabaseSafetyTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);
        $this->adminUser = User::where('role', User::ROLE_ADMIN)->first();
    }

    /**
     * Test Eloquent instance delete() is blocked on all baseline models.
     */
    public function test_eloquent_instance_delete_blocked_on_all_baseline_models(): void
    {
        // 1. RiskAssessment #1
        $ra = RiskAssessment::find(1);
        $this->assertNotNull($ra);
        $this->expectException(RuntimeException::class);
        $ra->delete();
    }

    public function test_eloquent_instance_delete_blocked_on_ai_insight_1(): void
    {
        $ai = AiInsight::find(1);
        $this->assertNotNull($ai);
        $this->expectException(RuntimeException::class);
        $ai->delete();
    }

    public function test_eloquent_instance_delete_blocked_on_baseline_shelters(): void
    {
        $shelter = Shelter::find(1);
        $this->assertNotNull($shelter);
        $this->expectException(RuntimeException::class);
        $shelter->delete();
    }

    public function test_eloquent_instance_delete_blocked_on_baseline_community_report_1(): void
    {
        $report = CommunityReport::find(1);
        $this->assertNotNull($report);
        $this->expectException(RuntimeException::class);
        $report->delete();
    }

    public function test_eloquent_instance_delete_blocked_on_baseline_data_sources(): void
    {
        $ds = DataSource::find(2);
        $this->assertNotNull($ds);
        $this->expectException(RuntimeException::class);
        $ds->delete();
    }

    public function test_eloquent_instance_delete_blocked_on_baseline_hazard_event_1(): void
    {
        $he = HazardEvent::find(1);
        $this->assertNotNull($he);
        $this->expectException(RuntimeException::class);
        $he->delete();
    }

    /**
     * Test query builder delete() is intercepted and blocked for baseline records.
     */
    public function test_query_builder_delete_blocked_on_baseline_records(): void
    {
        // RiskAssessment by ID
        $caught = false;
        try {
            RiskAssessment::where('id', 1)->delete();
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'RiskAssessment::where("id", 1)->delete() should throw RuntimeException');

        // AiInsight by ID
        $caught = false;
        try {
            AiInsight::where('id', 1)->delete();
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'AiInsight::where("id", 1)->delete() should throw RuntimeException');

        // Shelter by whereIn
        $caught = false;
        try {
            Shelter::whereIn('id', [1, 9999])->delete();
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'Shelter::whereIn with baseline ID should throw RuntimeException');

        // CommunityReport by ID
        $caught = false;
        try {
            CommunityReport::where('id', 9)->delete();
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'CommunityReport::where("id", 9)->delete() should throw RuntimeException');

        // DataSource by ID
        $caught = false;
        try {
            DataSource::where('id', 3)->delete();
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'DataSource::where("id", 3)->delete() should throw RuntimeException');

        // HazardEvent by ID
        $caught = false;
        try {
            HazardEvent::where('id', 1)->delete();
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'HazardEvent::where("id", 1)->delete() should throw RuntimeException');
    }

    /**
     * Test query builder mass update() is intercepted and blocked for baseline records.
     */
    public function test_query_builder_mass_update_blocked_on_baseline_records(): void
    {
        // RiskAssessment mass update
        $caught = false;
        try {
            RiskAssessment::where('id', 1)->update(['risk_score' => 99.99]);
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'RiskAssessment::where("id", 1)->update() should throw RuntimeException');

        // Verify score is NOT altered
        $this->assertEquals(78.50, (float) RiskAssessment::find(1)->risk_score);

        // AiInsight mass update
        $caught = false;
        try {
            AiInsight::where('id', 1)->update(['confidence_score' => 0.123]);
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'AiInsight::where("id", 1)->update() should throw RuntimeException');

        // CommunityReport mass update
        $caught = false;
        try {
            CommunityReport::where('id', 1)->update(['title' => 'Tampered Title']);
        } catch (RuntimeException $e) {
            $caught = true;
            $this->assertStringContainsString('dilindungi dari operasi massal', $e->getMessage());
        }
        $this->assertTrue($caught, 'CommunityReport::where("id", 1)->update() should throw RuntimeException');
    }

    /**
     * Test non-baseline records can be queried, updated, and deleted normally.
     */
    public function test_non_baseline_records_can_be_managed_normally(): void
    {
        // 1. Create a non-baseline risk assessment
        $tempRa = RiskAssessment::create([
            'region_id' => 1,
            'hazard_type_id' => 2,
            'title' => 'Temporary Test Assessment Non-Baseline',
            'risk_level' => 'low',
            'risk_score' => 15.0,
            'methodology_version' => 'v1.0-test',
            'impact_radius_meters' => 500,
            'affected_population_estimate' => 100,
            'calculation_factors' => ['test' => true],
            'assessed_at' => now(),
        ]);

        $this->assertGreaterThan(1, $tempRa->id);

        // Update via query builder should succeed
        $affected = RiskAssessment::where('id', $tempRa->id)->update(['risk_score' => 22.5]);
        $this->assertEquals(1, $affected);
        $this->assertEquals(22.5, (float) $tempRa->fresh()->risk_score);

        // Delete via query builder should succeed
        $deleted = RiskAssessment::where('id', $tempRa->id)->delete();
        $this->assertEquals(1, $deleted);
        $this->assertNull(RiskAssessment::find($tempRa->id));
    }

    /**
     * Test RiskEngineService evaluateAndPersistRegionalRisk never overwrites baseline assessment #1.
     */
    public function test_risk_engine_evaluate_and_persist_never_overwrites_baseline_assessment_1(): void
    {
        $raBefore = RiskAssessment::find(1);
        $this->assertNotNull($raBefore);
        $originalTitle = $raBefore->title;
        $originalScore = (float) $raBefore->risk_score;
        $originalUpdatedAt = $raBefore->updated_at?->toIso8601String();

        // Target Region 3 (Jakarta Timur) & Hazard 1 (Banjir) - the exact region/hazard of Baseline #1
        $service = app(RiskEngineService::class);
        $persisted = $service->evaluateAndPersistRegionalRisk(3, 1, 'Dynamic Risk Assessment Evaluation');

        // Must create or update a distinct non-baseline record
        $this->assertNotEquals(1, $persisted->id, 'Persisted assessment must never use baseline ID 1');
        $this->assertEquals(3, $persisted->region_id);
        $this->assertEquals(1, $persisted->hazard_type_id);

        // Re-inspect Baseline #1: must be completely untouched
        $raAfter = RiskAssessment::find(1);
        $this->assertEquals($originalTitle, $raAfter->title);
        $this->assertEquals($originalScore, (float) $raAfter->risk_score);
        $this->assertEquals('v1.0-rules', $raAfter->methodology_version);
        $this->assertEquals($originalUpdatedAt, $raAfter->updated_at?->toIso8601String());

        // Clean up the dynamic assessment
        $persisted->delete();
    }

    /**
     * Test SentravaxMasterSeeder is idempotent and never mutates existing baseline records.
     */
    public function test_master_seeder_is_idempotent_and_does_not_mutate_baseline_records(): void
    {
        $raBefore = RiskAssessment::find(1);
        $aiBefore = AiInsight::find(1);
        $shelterBefore = Shelter::find(1);

        // Run the seeder again
        (new SentravaxMasterSeeder())->run();

        $raAfter = RiskAssessment::find(1);
        $aiAfter = AiInsight::find(1);
        $shelterAfter = Shelter::find(1);

        // Assert all fields and timestamps remain exact
        $this->assertEquals($raBefore->title, $raAfter->title);
        $this->assertEquals((float) $raBefore->risk_score, (float) $raAfter->risk_score);
        $this->assertEquals($raBefore->assessed_at?->toIso8601String(), $raAfter->assessed_at?->toIso8601String());
        $this->assertEquals($raBefore->updated_at?->toIso8601String(), $raAfter->updated_at?->toIso8601String());

        $this->assertEquals($aiBefore->title, $aiAfter->title);
        $this->assertEquals((float) $aiBefore->confidence_score, (float) $aiAfter->confidence_score);
        $this->assertEquals($aiBefore->updated_at?->toIso8601String(), $aiAfter->updated_at?->toIso8601String());

        $this->assertEquals($shelterBefore->name, $shelterAfter->name);
        $this->assertEquals($shelterBefore->updated_at?->toIso8601String(), $shelterAfter->updated_at?->toIso8601String());
    }

    /**
     * Test Admin API endpoints return 403 Forbidden when attempting to delete baseline records.
     */
    public function test_admin_api_endpoints_return_forbidden_on_baseline_deletion(): void
    {
        // 1. Shelter #1
        $resShelter = $this->actingAs($this->adminUser)->deleteJson('/api/v1/admin/shelters/1');
        $resShelter->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Operasi ditolak: Shelter baseline #1 merupakan fasilitas evakuasi resmi acuan dan dilindungi dari penghapusan.');

        // 2. Community Report #1
        $resReport = $this->actingAs($this->adminUser)->deleteJson('/api/v1/admin/reports/1');
        $resReport->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Operasi ditolak: Laporan baseline #1 merupakan data acuan audit dan dilindungi dari penghapusan.');

        // 3. Core Admin User #1
        $resUser = $this->actingAs($this->adminUser)->deleteJson("/api/v1/admin/users/{$this->adminUser->id}");
        // Controller rejects self-delete with 422 or core account with 403
        $this->assertTrue(in_array($resUser->status(), [403, 422], true));
    }

    /**
     * Test ReportVerification audit trail records are append-only immutable.
     */
    public function test_report_verification_audit_trail_is_append_only_immutable(): void
    {
        $rv = ReportVerification::first();
        if (! $rv) {
            $rv = ReportVerification::create([
                'community_report_id' => 1,
                'verified_by' => $this->adminUser->id,
                'previous_status' => 'pending',
                'new_status' => 'verified',
                'notes' => 'Test audit record',
            ]);
        }

        // Updating must throw RuntimeException
        $caughtUpdate = false;
        try {
            $rv->notes = 'Tampered verification notes';
            $rv->save();
        } catch (RuntimeException $e) {
            $caughtUpdate = true;
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
        $this->assertTrue($caughtUpdate, 'ReportVerification updating must throw RuntimeException');

        // Deleting must throw RuntimeException
        $caughtDelete = false;
        try {
            $rv->delete();
        } catch (RuntimeException $e) {
            $caughtDelete = true;
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
        $this->assertTrue($caughtDelete, 'ReportVerification deleting must throw RuntimeException');
    }
}
