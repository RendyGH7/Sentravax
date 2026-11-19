<?php

namespace Tests\Feature;

use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use Database\Seeders\SentravaxMasterSeeder;
use Tests\TestCase;

class IntelligenceApiTest extends TestCase
{
    protected User $intel;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->intel = User::where('email', 'intelligence@sentravax.go.id')->first();
        $this->admin = User::where('email', 'admin@sentravax.go.id')->first();
    }

    public function test_intel_overview_returns_telemetry_and_simulation_projection(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/overview');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'telemetry' => [
                        'stream_status' => 'STREAMING AKTIF',
                    ],
                    'simulation_projection' => [
                        'scenario_name' => 'Simulasi Proyeksi Genangan dan Bahaya Spasial',
                        'hazard_type' => 'Banjir Luapan',
                        'metrics' => [
                            'exposed_population' => 42150,
                        ],
                    ],
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'telemetry',
                    'metrics' => [
                        'active_threats',
                        'unverified_reports',
                        'active_cap_alerts',
                        'proactive_insights_generated',
                    ],
                    'simulation_projection',
                    'recent_insights',
                ],
            ]);
    }

    public function test_intel_map_returns_geojson_layers(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/map');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'FeatureCollection',
                ],
            ])
            ->assertJsonStructure([
                'data' => ['features'],
            ]);
    }

    public function test_intel_risk_engine_evaluation(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $response = $this->actingAs($this->intel)->postJson('/api/v1/intel/risk/evaluate', [
            'region_id' => $region->id,
            'hazard_type_id' => $hazardType->id,
            'title' => 'Evaluasi Risiko Komprehensif Siklon Tropis',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'region_id',
                    'hazard_type_id',
                    'risk_score',
                    'risk_level',
                    'methodology_version',
                    'calculation_factors',
                ],
            ]);

        // Clean up test-created assessment to maintain baseline database purity
        $evalId = $response->json('data.id');
        if ($evalId && $evalId > 1) {
            \App\Models\RiskAssessment::where('id', $evalId)->delete();
        }
    }

    public function test_intel_list_assessments_endpoint_returns_latest_assessments(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/risk/assessments?limit=10');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar penilaian risiko regional terkini berhasil dimuat.',
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'region_id',
                        'hazard_type_id',
                        'risk_score',
                        'risk_level',
                        'assessed_at',
                        'region',
                        'hazard_type',
                    ],
                ],
            ]);
    }

    public function test_unauthenticated_and_regular_users_cannot_access_risk_assessments(): void
    {
        // 1. Unauthenticated visitor receives 401
        $guestResponse = $this->getJson('/api/v1/intel/risk/assessments');
        $guestResponse->assertStatus(401);

        // 2. Regular citizen user receives 403 Forbidden
        $regularUser = User::where('role', 'user')->first();
        $userResponse = $this->actingAs($regularUser)->getJson('/api/v1/intel/risk/assessments');
        $userResponse->assertStatus(403);
    }

    public function test_intel_list_insights_endpoint(): void
    {
        // 1. Unauthenticated visitor receives 401
        $guestResponse = $this->getJson('/api/v1/intel/insights');
        $guestResponse->assertStatus(401);

        // 2. Regular citizen user receives 403 Forbidden
        $regularUser = User::where('role', 'user')->first();
        $userResponse = $this->actingAs($regularUser)->getJson('/api/v1/intel/insights');
        $userResponse->assertStatus(403);

        // 3. Authenticated intelligence user can list insights
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/insights?limit=10');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Daftar AI Proactive Insights berhasil dimuat.',
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'summary',
                        'confidence_score',
                        'confidence_level',
                        'region',
                        'hazard_type',
                        'evidence',
                        'created_at',
                    ],
                ],
            ]);
    }

    public function test_intel_proactive_insight_generation(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $response = $this->actingAs($this->intel)->postJson('/api/v1/intel/insights/generate', [
            'region_id' => $region->id,
            'hazard_type_id' => $hazardType->id,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'insight_type' => 'proactive_resilience',
                    'generation_mode' => 'rule_based',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'summary',
                    'recommendations',
                    'confidence_score',
                    'confidence_level',
                    'evidence' => [
                        'region_code',
                        'hazard_slug',
                        'confidence_level',
                        'confidence_basis',
                        'threat_escalation' => [
                            'is_escalating',
                            'level',
                            'triggers',
                        ],
                        'indicators',
                        'data_sources',
                    ],
                ],
            ]);

        // Clean up test-created insight to maintain baseline purity
        $insightId = $response->json('data.id');
        if ($insightId && $insightId > 1) {
            \App\Models\AiInsight::where('id', $insightId)->delete();
        }
    }

    /**
     * Regression Test: Verify AI insight confidence score strictly represents
     * empirical evidence strength, not a disaster probability percentage.
     */
    public function test_ai_insight_evidence_strength_is_not_labeled_as_disaster_probability(): void
    {
        $response = $this->actingAs($this->intel)->getJson('/api/v1/intel/insights?limit=1');
        $response->assertStatus(200);

        $insight = $response->json('data.data.0') ?? $response->json('data.0');
        if ($insight) {
            $this->assertArrayHasKey('confidence_score', $insight);
            $this->assertArrayHasKey('confidence_level', $insight);
            $this->assertContains($insight['confidence_level'], ['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA']);

            // Verify evidence basis is present and documents multi-source correlation
            if (isset($insight['evidence']['confidence_basis'])) {
                $this->assertNotEmpty($insight['evidence']['confidence_basis']);
                $this->assertStringNotContainsStringIgnoringCase('probabilitas bencana', $insight['evidence']['confidence_basis']);
            }
        }
    }

    public function test_admin_and_user_and_guest_are_strictly_forbidden_from_all_intelligence_endpoints(): void
    {
        $endpoints = [
            ['GET', '/api/v1/intel/insights', []],
            ['POST', '/api/v1/intel/insights/generate', ['region_id' => 1, 'hazard_type_id' => 1]],
            ['GET', '/api/v1/intel/reports/queue', []],
            ['GET', '/api/v1/intel/reports/1', []],
            ['POST', '/api/v1/intel/reports/1/verify', ['status' => 'verified']],
        ];

        // 1. Unauthenticated visitor receives 401 across all 5 endpoints
        foreach ($endpoints as [$method, $uri, $payload]) {
            $res = $method === 'GET' ? $this->getJson($uri) : $this->postJson($uri, $payload);
            $res->assertStatus(401);
        }

        // 2. Regular citizen user receives 403 Forbidden across all 5 endpoints
        $regularUser = User::where('role', 'user')->first();
        foreach ($endpoints as [$method, $uri, $payload]) {
            $res = $method === 'GET'
                ? $this->actingAs($regularUser)->getJson($uri)
                : $this->actingAs($regularUser)->postJson($uri, $payload);
            $res->assertStatus(403);
        }

        // 3. Admin user receives 403 Forbidden across all 5 endpoints (strict role separation)
        foreach ($endpoints as [$method, $uri, $payload]) {
            $res = $method === 'GET'
                ? $this->actingAs($this->admin)->getJson($uri)
                : $this->actingAs($this->admin)->postJson($uri, $payload);
            $res->assertStatus(403);
        }
    }

    public function test_intel_reports_queue_and_verification_audit(): void
    {
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        // 1. Insert temporary test report in 'pending' status
        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Anomali Pergerakan Tanah Lereng Uji',
            'description' => 'Retakan memanjang 15 meter dengan bukaan 5 cm setelah hujan intensitas tinggi.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            // 2. Fetch reports queue with status filter
            $resQueue = $this->actingAs($this->intel)->getJson('/api/v1/intel/reports/queue?status=pending');
            $resQueue->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'title',
                            'status',
                            'priority_score',
                            'priority_level',
                            'priority_reasons',
                            'duplicate_detection' => [
                                'is_duplicate_suspect',
                                'cluster_id',
                                'nearby_count',
                                'candidates',
                            ],
                        ],
                    ],
                ]);

            // 3. Fetch single report detail
            $resDetail = $this->actingAs($this->intel)->getJson("/api/v1/intel/reports/{$reportId}");
            $resDetail->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $reportId,
                        'status' => 'pending',
                    ],
                ]);

            // 4. Update status to 'investigating' with audit log
            $resInvestigate = $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
                'status' => 'investigating',
                'notes' => 'Petugas lapangan TRC diberangkatkan untuk survei drone.',
            ]);
            $resInvestigate->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'status' => 'investigating',
                    ],
                ]);

            $this->assertDatabaseHas('report_verifications', [
                'community_report_id' => $reportId,
                'verified_by' => $this->intel->id,
                'previous_status' => 'pending',
                'new_status' => 'investigating',
            ]);

            // 5. Update status to 'verified' with audit log
            $resVerify = $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
                'status' => 'verified',
                'notes' => 'Korelasi citra radar dan sensor retakan PVMBG mengonfirmasi anomali retakan tanah.',
            ]);
            $resVerify->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'status' => 'verified',
                    ],
                ]);

            $this->assertDatabaseHas('report_verifications', [
                'community_report_id' => $reportId,
                'verified_by' => $this->intel->id,
                'previous_status' => 'investigating',
                'new_status' => 'verified',
            ]);

            // 6. Verify detail endpoint now returns the complete verification history audit trail
            $resDetailAfter = $this->actingAs($this->intel)->getJson("/api/v1/intel/reports/{$reportId}");
            $resDetailAfter->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $reportId,
                        'status' => 'verified',
                    ],
                ]);
            $this->assertCount(2, $resDetailAfter->json('data.verifications'));

        } finally {
            // Clean up test report and verification records to maintain database purity
            \DB::table('report_verifications')->where('community_report_id', $reportId)->delete();
            \DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }

    public function test_triage_score_factors_clamping_and_level_mapping(): void
    {
        $service = app(\App\Services\Intelligence\IntelligenceService::class);
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        // 1. Minimal report (no photo, short description, created 10 hours ago)
        $minimalReport = new \App\Models\CommunityReport([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Singkat',
            'description' => 'Genangan air',
            'status' => 'pending',
            'created_at' => now()->subHours(10),
        ]);
        $minimalReport->id = 999991;

        $triageMin = $service->calculateReportTriage($minimalReport);
        $this->assertGreaterThanOrEqual(10, $triageMin['priority_score']);
        $this->assertLessThanOrEqual(100, $triageMin['priority_score']);
        $this->assertContains($triageMin['priority_level'], ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

        // 2. Full report with detailed description (>40 chars), photo, recent (<2 hours)
        $fullReport = new \App\Models\CommunityReport([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Lengkap Genangan Luapan Kanal Utama',
            'description' => 'Air meluap setinggi 45 cm dengan arus deras memotong akses jalan utama pemukiman warga.',
            'photo_path' => 'reports/photos/test_evidence.jpg',
            'status' => 'pending',
            'created_at' => now()->subMinutes(15),
        ]);
        $fullReport->id = 999992;
        $fullReport->created_at = now()->subMinutes(15);

        $triageFull = $service->calculateReportTriage($fullReport);
        $this->assertGreaterThanOrEqual(50, $triageFull['priority_score']);
        $this->assertLessThanOrEqual(100, $triageFull['priority_score']);

        // Assert reasons clearly designate description and photo as completeness indicators, not proof of truth
        $reasonsStr = implode(' ', $triageFull['priority_reasons']);
        $this->assertStringContainsString('indikator kelengkapan informasi, bukan bukti kebenaran', $reasonsStr);
    }

    public function test_symmetric_spatiotemporal_duplicate_detection(): void
    {
        $service = app(\App\Services\Intelligence\IntelligenceService::class);
        $user = User::where('role', 'user')->first();
        $floodHazard = HazardType::where('slug', 'flood')->first() ?? HazardType::first();
        $quakeHazard = HazardType::where('slug', '!=', $floodHazard->slug)->first() ?? HazardType::find(2);
        $region = Region::first();

        $refTime = now()->subHours(3);

        // 1. Reference report
        $refId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $floodHazard->id,
            'region_id' => $region->id,
            'title' => 'Titik Acuan Uji Klaster',
            'description' => 'Genangan di pertigaan jalan kampung selokan meluap.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8450, -6.2080), 4326)"),
            'created_at' => $refTime,
            'updated_at' => $refTime,
        ]);

        // 2. Candidate A: filed 2 hours BEFORE reference report, 200m away, same hazard
        $candAId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $floodHazard->id,
            'region_id' => $region->id,
            'title' => 'Titik A 2 Jam Sebelumnya',
            'description' => 'Laporan warga lebih awal air mulai masuk halaman.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8460, -6.2085), 4326)"),
            'created_at' => $refTime->copy()->subHours(2),
            'updated_at' => $refTime->copy()->subHours(2),
        ]);

        // 3. Candidate B: filed 2 hours AFTER reference report, 300m away, same hazard
        $candBId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $floodHazard->id,
            'region_id' => $region->id,
            'title' => 'Titik B 2 Jam Setelahnya',
            'description' => 'Laporan warga susulan tinggi air bertambah 10 cm.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8440, -6.2075), 4326)"),
            'created_at' => $refTime->copy()->addHours(2),
            'updated_at' => $refTime->copy()->addHours(2),
        ]);

        // 4. Candidate C: within 100m and 30 mins, but DIFFERENT hazard type
        $candCId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $quakeHazard->id,
            'region_id' => $region->id,
            'title' => 'Titik C Jenis Bahaya Berbeda',
            'description' => 'Getaran terasa tapi bukan genangan air.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8451, -6.2081), 4326)"),
            'created_at' => $refTime->copy()->addMinutes(15),
            'updated_at' => $refTime->copy()->addMinutes(15),
        ]);

        try {
            $refReport = \App\Models\CommunityReport::find($refId);
            $triage = $service->calculateReportTriage($refReport);

            $this->assertTrue($triage['duplicate_detection']['is_duplicate_suspect']);
            $this->assertGreaterThanOrEqual(2, $triage['duplicate_detection']['nearby_count']);

            $candidateIds = array_map(fn ($c) => $c->id, $triage['duplicate_detection']['candidates']);

            // Reference report must NEVER detect itself as a duplicate candidate
            $this->assertNotContains($refId, $candidateIds, 'Reference report must never detect itself as a duplicate candidate.');

            // Both before and after reports of same hazard must be detected
            $this->assertContains($candAId, $candidateIds, 'Candidate A (2h before) was detected symmetrically.');
            $this->assertContains($candBId, $candidateIds, 'Candidate B (2h after) was detected symmetrically.');

            // Different hazard type must NOT be considered duplicate
            $this->assertNotContains($candCId, $candidateIds, 'Candidate C (different hazard) was properly excluded.');

            // All reports must remain stored intact (never auto-deleted or merged)
            $this->assertDatabaseHas('community_reports', ['id' => $candAId]);
            $this->assertDatabaseHas('community_reports', ['id' => $candBId]);
            $this->assertDatabaseHas('community_reports', ['id' => $candCId]);

        } finally {
            \DB::table('community_reports')->whereIn('id', [$refId, $candAId, $candBId, $candCId])->delete();
        }
    }

    public function test_verification_audit_trail_is_append_only_and_requires_notes_for_rejection(): void
    {
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Uji Penolakan & Append-Only',
            'description' => 'Laporan uji coba validasi verifikasi.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            // 1. Attempting to reject without notes fails with 422
            $resEmptyNote = $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
                'status' => 'rejected',
                'notes' => '',
            ]);
            $resEmptyNote->assertStatus(422)
                ->assertJsonValidationErrors(['notes']);

            // 2. Rejecting with proper justification succeeds
            $resRejected = $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
                'status' => 'rejected',
                'notes' => 'Hasil verifikasi patroli TRC BPBD menunjukkan tidak ada genangan di lokasi.',
            ]);
            $resRejected->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'status' => 'rejected',
                    ],
                ]);

            // 3. Find created audit record
            $verification = \App\Models\ReportVerification::where('community_report_id', $reportId)->first();
            $this->assertNotNull($verification);
            $this->assertEquals('pending', $verification->previous_status);
            $this->assertEquals('rejected', $verification->new_status);

            // 4. Eloquent append-only enforcement: attempting to update throws RuntimeException
            try {
                $verification->notes = 'Attempted tampered note';
                $verification->save();
                $this->fail('Expected RuntimeException on updating audit record was not thrown.');
            } catch (\RuntimeException $e) {
                $this->assertStringContainsString('append-only', $e->getMessage());
            }

            // 5. Eloquent append-only enforcement: attempting to delete throws RuntimeException
            try {
                $verification->delete();
                $this->fail('Expected RuntimeException on deleting audit record was not thrown.');
            } catch (\RuntimeException $e) {
                $this->assertStringContainsString('append-only', $e->getMessage());
            }

        } finally {
            \DB::table('report_verifications')->where('community_report_id', $reportId)->delete();
            \DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }

    public function test_intel_cap_alert_dispatch_and_dissemination(): void
    {
        $region = Region::first();
        $hazardType = HazardType::first();

        $response = $this->actingAs($this->intel)->postJson('/api/v1/intel/alerts/dispatch', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'DISSEMINASI CAP: Siaga Banjir Luapan DAS Ciliwung Hilir',
            'message' => 'Status TMA Bendung Katulampa meningkat menjadi Siaga 2. Jalur bantaran sungai waspada limpasan dalam 6-9 jam ke depan.',
            'alert_class' => 'warning',
            'broadcast_level' => 'regional',
            'starts_at' => now()->toIso8601String(),
            'expires_at' => now()->addHours(12)->toIso8601String(),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dissemination' => [
                        'cap_status' => 'DISTRIBUTED',
                    ],
                ],
            ]);

        // Clean up test-created alert to prevent leaking into shared DB
        $alertId = $response->json('data.alert.id');
        if ($alertId) {
            \App\Models\Alert::where('id', $alertId)->delete();
        }
    }

    public function test_cross_role_access_rejection_between_admin_and_intelligence(): void
    {
        // 1. Intelligence user trying to access Admin Console receives 403 Forbidden
        $resIntelToAdmin = $this->actingAs($this->intel)->getJson('/api/v1/admin/overview');
        $resIntelToAdmin->assertStatus(403);

        // 2. Admin user trying to access Intelligence Center receives 403 Forbidden
        $resAdminToIntel = $this->actingAs($this->admin)->getJson('/api/v1/intel/overview');
        $resAdminToIntel->assertStatus(403);
    }

    public function test_verification_transaction_atomicity_and_invalid_state_handling(): void
    {
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Uji Rollback Transaksi',
            'description' => 'Memastikan integritas status jika terjadi input tidak valid.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            // 1. Invalid status request fails with 422 and does NOT change report status
            $resInvalid = $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
                'status' => 'invalid_status_value',
            ]);
            $resInvalid->assertStatus(422);

            $reportAfter = \App\Models\CommunityReport::find($reportId);
            $this->assertEquals('pending', $reportAfter->status);
            $this->assertNull($reportAfter->verified_by);

            // 2. Non-existent report returns 404
            $res404 = $this->actingAs($this->intel)->postJson('/api/v1/intel/reports/99999999/verify', [
                'status' => 'verified',
            ]);
            $res404->assertStatus(404);
        } finally {
            \DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }

    public function test_report_never_detects_itself_as_duplicate(): void
    {
        $service = app(\App\Services\Intelligence\IntelligenceService::class);
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Uji Eksklusi Diri Sendiri',
            'description' => 'Memastikan laporan tidak pernah mendeteksi dirinya sendiri sebagai duplikat.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $report = \App\Models\CommunityReport::find($reportId);
            $triage = $service->calculateReportTriage($report);

            $candidateIds = array_map(fn ($c) => $c->id, $triage['duplicate_detection']['candidates']);
            $this->assertNotContains($reportId, $candidateIds, 'Laporan yang sedang dianalisis tidak boleh muncul dalam daftar kandidat duplikat.');

            $clusterResult = $service->analyzeAndClusterReport($report, 106.8456, -6.2088);
            $nearbyIds = array_map(fn ($c) => $c->id, $clusterResult['nearby_reports']);
            $this->assertNotContains($reportId, $nearbyIds, 'Laporan tidak boleh mendeteksi dirinya sendiri dalam clustering.');
        } finally {
            \DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }

    public function test_verification_transaction_rolls_back_if_audit_record_fails(): void
    {
        $user = User::where('role', 'user')->first();
        $hazardType = HazardType::first();
        $region = Region::first();

        $reportId = \DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Uji Rollback DB Transaction',
            'description' => 'Memastikan status laporan di-rollback jika pembuatan audit log gagal.',
            'status' => 'pending',
            'location' => \DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Temporarily register an Eloquent creating listener that throws on ReportVerification
        $eventName = 'eloquent.creating: ' . \App\Models\ReportVerification::class;
        \Illuminate\Support\Facades\Event::listen($eventName, function () {
            throw new \RuntimeException('Simulated audit trail persistence failure.');
        });

        try {
            try {
                $this->actingAs($this->intel)->postJson("/api/v1/intel/reports/{$reportId}/verify", [
                    'status' => 'verified',
                    'notes' => 'Catatan verifikasi yang seharusnya gagal rollback.',
                ]);
            } catch (\Throwable $e) {
                // Expected exception
            }

            // Assert that community report status remains 'pending' (transaction rollback)
            $reportAfter = \App\Models\CommunityReport::find($reportId);
            $this->assertEquals('pending', $reportAfter->status, 'Report status must roll back to pending on audit failure.');
            $this->assertNull($reportAfter->verified_by, 'verified_by must remain null after rollback.');
        } finally {
            \Illuminate\Support\Facades\Event::forget($eventName);
            \DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }

    public function test_privacy_and_isolation_of_internal_audit_notes_and_pii(): void
    {
        // 1. Citizen fetching their own report cannot see internal verifications audit trail
        $citizen = User::where('role', 'user')->first();
        $resUser = $this->actingAs($citizen)->getJson('/api/v1/user/reports/1');
        if ($resUser->status() === 200) {
            $this->assertArrayNotHasKey('verifications', $resUser->json('data'));
        }

        // 2. Admin viewing report does not receive verifications audit trail or reporter email/phone
        $resAdmin = $this->actingAs($this->admin)->getJson('/api/v1/admin/reports/1');
        if ($resAdmin->status() === 200) {
            $this->assertArrayNotHasKey('verifications', $resAdmin->json('data'));
            $this->assertArrayNotHasKey('email', $resAdmin->json('data.user') ?? []);
            $this->assertArrayNotHasKey('phone', $resAdmin->json('data.user') ?? []);
        }

        // 3. Intelligence queue only exposes id and name for reporter, no email or phone
        $resIntelQueue = $this->actingAs($this->intel)->getJson('/api/v1/intel/reports/queue');
        $resIntelQueue->assertStatus(200);
        foreach ($resIntelQueue->json('data') as $rep) {
            if (!empty($rep['user'])) {
                $this->assertArrayNotHasKey('email', $rep['user']);
                $this->assertArrayNotHasKey('phone', $rep['user']);
            }
        }
    }
}

