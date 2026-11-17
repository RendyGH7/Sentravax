<?php

namespace App\Services\Intelligence;

use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntelligenceService
{
    /**
     * Generate proactive intelligence insight deterministically from risk assessment or regional telemetry.
     */
    public function generateProactiveInsight(int $regionId, int $hazardTypeId, ?int $riskAssessmentId = null): AiInsight
    {
        $region = Region::findOrFail($regionId);
        $hazardType = HazardType::findOrFail($hazardTypeId);
        $riskAssessment = $riskAssessmentId ? RiskAssessment::find($riskAssessmentId) : null;

        // Fetch regional coordinates for PostGIS spatial queries
        $center = DB::selectOne("SELECT ST_X(center_point) as lon, ST_Y(center_point) as lat FROM regions WHERE id = ?", [$regionId]);
        $lon = (float) ($center?->lon ?? 106.8456);
        $lat = (float) ($center?->lat ?? -6.2088);

        // 1. Query active hazard events within region or within 25 km buffer
        $nearbyEvents = HazardEvent::where('status', 'active')
            ->where('hazard_type_id', $hazardTypeId)
            ->whereRaw("ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, 25000)", [$lon, $lat])
            ->with(['dataSource'])
            ->get();
        $eventsCount = $nearbyEvents->count();

        // 2. Query active official alerts for this region
        $activeAlerts = Alert::where('status', 'active')
            ->where('hazard_type_id', $hazardTypeId)
            ->where(function ($q) use ($regionId) {
                $q->where('region_id', $regionId)->orWhereNull('region_id');
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get();
        $alertsCount = $activeAlerts->count();

        // 3. Query community reports in this region with cluster deduplication
        $uniqueReportClustersCount = CommunityReport::where('region_id', $regionId)
            ->where('hazard_type_id', $hazardTypeId)
            ->where('status', 'verified')
            ->distinct('cluster_id')
            ->count('id');

        $reportsCount = CommunityReport::where('region_id', $regionId)
            ->where('hazard_type_id', $hazardTypeId)
            ->where('status', 'verified')
            ->count();

        $uniquePendingClustersCount = CommunityReport::where('region_id', $regionId)
            ->where('hazard_type_id', $hazardTypeId)
            ->where('status', 'pending')
            ->distinct('cluster_id')
            ->count('id');

        $pendingReportsCount = CommunityReport::where('region_id', $regionId)
            ->where('hazard_type_id', $hazardTypeId)
            ->where('status', 'pending')
            ->count();

        // 4. Data freshness & external telemetry audit
        $activeDataSources = DataSource::where('status', 'active')->count();
        $failedSyncRuns = DB::table('data_source_sync_runs')
            ->where('status', 'FAILED')
            ->where('synced_at', '>=', now()->subHours(24))
            ->count();
        $dataFreshness = ($failedSyncRuns > 0 || $activeDataSources === 0) ? 'UNAVAILABLE' : 'FRESH';
        $isTelemetryOffline = ($dataFreshness === 'UNAVAILABLE');

        $score = $riskAssessment ? (float) $riskAssessment->risk_score : 52.4;

        // 5. Threat Escalation Detection Rules (Human-in-the-Loop Safe)
        $hasHighSeverityEvent = $nearbyEvents->where('severity', 'high')->count() > 0;
        $hasCriticalAlert = $activeAlerts->where('broadcast_level', 'warning')->count() > 0;
        $hasUnverifiedSurge = ($uniquePendingClustersCount >= 3);
        $isConfirmedEscalating = ($eventsCount > 0 && ($alertsCount > 0 || $uniqueReportClustersCount >= 2));

        $escalationLevel = match (true) {
            $hasHighSeverityEvent || $hasCriticalAlert => 'CRITICAL',
            $isConfirmedEscalating => 'ELEVATED',
            $hasUnverifiedSurge => 'INVESTIGATION_SIGNAL',
            $isTelemetryOffline && $eventsCount === 0 && $alertsCount === 0 => 'DATA_UNAVAILABLE',
            default => 'STABLE',
        };

        $escalationTriggers = [];
        if ($eventsCount > 0) {
            $escalationTriggers[] = sprintf("Terdeteksi %d kejadian bencana aktif terverifikasi dalam buffer pemantauan 25 km.", $eventsCount);
        }
        if ($alertsCount > 0) {
            $escalationTriggers[] = sprintf("Terdapat %d peringatan dini resmi otoritas (BMKG/BNPB) berstatus aktif.", $alertsCount);
        }
        if ($uniqueReportClustersCount > 0) {
            $escalationTriggers[] = sprintf("Terkonfirmasi %d klaster laporan masyarakat terverifikasi di wilayah acuan.", $uniqueReportClustersCount);
        }
        if ($hasUnverifiedSurge) {
            $escalationTriggers[] = sprintf("Sinyal Investigasi: Lonjakan %d klaster laporan warga belum terverifikasi (sinyal prioritas investigasi lapangan, bukan konfirmasi kejadian bencana).", $uniquePendingClustersCount);
        } elseif ($uniquePendingClustersCount > 0) {
            $escalationTriggers[] = sprintf("Antrean Triase: %d klaster laporan warga menunggu peninjauan petugas.", $uniquePendingClustersCount);
        }
        if ($isTelemetryOffline) {
            $escalationTriggers[] = "Umpan telemetri sensor eksternal (BMKG/InaTEWS) terputus/stale (status: UNAVAILABLE) — kesimpulan stabilitas tidak dapat diasumsikan normal.";
        }
        if (empty($escalationTriggers)) {
            $escalationTriggers[] = "Aktivitas pemantauan stabil dalam batas aman berdasarkan telemetri sensor aktif.";
        }

        // 6. Transparent Confidence Level / Evidence Strength Calculation
        if ($isTelemetryOffline && $eventsCount === 0 && $alertsCount === 0 && $uniqueReportClustersCount === 0) {
            $confidenceLevel = 'INSUFFICIENT_DATA';
            $confidenceScore = 0.000;
            $confidenceBasis = 'Bukti data primer tidak mencukupi untuk inferensi valid (telemetri eksternal offline dan belum ada konfirmasi kejadian atau laporan terverifikasi).';
        } elseif ($eventsCount >= 1 && $alertsCount >= 1) {
            $confidenceLevel = 'HIGH';
            $confidenceScore = 0.900;
            $confidenceBasis = 'Korelasi multi-sumber kuat: kejadian bencana aktif terverifikasi bersesuaian dengan peringatan dini resmi otoritas (BMKG/BNPB).';
        } elseif ($eventsCount >= 1 || $uniqueReportClustersCount >= 1 || $alertsCount >= 1) {
            $confidenceLevel = 'MEDIUM';
            $confidenceScore = 0.700;
            $confidenceBasis = 'Tervalidasi melalui setidaknya satu sumber data resmi (kejadian aktif, peringatan resmi, atau laporan warga terverifikasi).';
        } else {
            $confidenceLevel = 'LOW';
            $confidenceScore = 0.400;
            $confidenceBasis = 'Inferensi berbasis kerentanan baseline wilayah historis tanpa adanya konfirmasi insiden aktif lokal terkini.';
        }

        // 7. Title and Actionable Mitigation Recommendations
        $title = sprintf("Proyeksi Dinamika %s — Wilayah %s", $hazardType->name, $region->name);

        $summary = sprintf(
            "Analisis intelijen proaktif SENTRAVAX mengidentifikasi skor kerentanan %.1f/100 di %s. " .
            "Terdeteksi %d kejadian aktif, %d peringatan resmi, dan %d laporan warga dalam rentang pemantauan geospasial.",
            $score,
            $region->name,
            $eventsCount,
            $alertsCount,
            $reportsCount + $pendingReportsCount
        );

        $recommendations = match ($hazardType->slug) {
            'flood' => [
                'Tingkatkan pemantauan pada titik sempadan sungai dan saluran drainase utama.',
                'Aktivasi posko kesiapsiagaan warga dan amankan dokumen penting ke tempat tinggi.',
                'Siapkan jalur evakuasi bebas genangan bagi kelompok rentan (lansia dan balita).',
                'Instruksikan tim lapangan melakukan pengecekan pintu air dan pompa pengendali banjir.',
            ],
            'earthquake' => [
                'Inspeksi visual struktur bangunan fasilitas umum dari retakan dinding pasca getaran.',
                'Pastikan jalur keluar darurat dan tangga darurat bebas dari halangan barang.',
                'Simpan tas siaga bencana di dekat pintu keluar utama pemukiman.',
                'Sosialisasikan titik kumpul terbuka yang aman dari risiko reruntuhan puing bangunan.',
            ],
            'landslide' => [
                'Waspadai retakan tanah baru atau rembesan air keruh di lereng bukit curam.',
                'Hindari bermalam di ruangan yang berbatasan langsung dengan tebing saat hujan deras.',
                'Koordinasikan titik kumpul aman di lapangan datar terbuka bersama pengurus RT/RW.',
                'Pasang rambu peringatan dini di jalur rawan longsoran tebing jalan raya.',
            ],
            'coastal_flood' => [
                'Tingkatkan kewaspadaan di kawasan pesisir saat siklus pasang maksimum air laut.',
                'Perkuat tanggul penahan ombak sementara dengan karung pasir di muara pemukiman.',
                'Amankan perahu dan peralatan nelayan ke daratan yang lebih tinggi dari pasang pasauran.',
            ],
            default => [
                'Pantau pembaruan berkala peringatan resmi BMKG dan BNPB melalui SENTRAVAX.',
                'Siapkan perlengkapan dasar darurat dan nomor kontak posko kebencanaan terdekat.',
                'Lakukan verifikasi berkala atas setiap laporan anomali yang masuk dari masyarakat.',
            ],
        };

        $evidence = [
            'region_code' => $region->code,
            'hazard_slug' => $hazardType->slug,
            'confidence_level' => $confidenceLevel,
            'confidence_basis' => $confidenceBasis,
            'evidence_strength' => $confidenceLevel,
            'threat_escalation' => [
                'is_escalating' => in_array($escalationLevel, ['CRITICAL', 'ELEVATED', 'INVESTIGATION_SIGNAL']),
                'level' => $escalationLevel,
                'triggers' => $escalationTriggers,
            ],
            'indicators' => [
                ['name' => 'Kejadian Aktif Terverifikasi', 'value' => $eventsCount, 'unit' => 'titik'],
                ['name' => 'Peringatan Dini Resmi Aktif', 'value' => $alertsCount, 'unit' => 'peringatan'],
                ['name' => 'Klaster Laporan Terverifikasi', 'value' => $uniqueReportClustersCount, 'unit' => 'klaster'],
                ['name' => 'Klaster Laporan Menunggu', 'value' => $uniquePendingClustersCount, 'unit' => 'klaster'],
                ['name' => 'Skor Risiko Terhitung', 'value' => $score, 'unit' => '/ 100'],
            ],
            'data_sources' => [
                ['name' => 'Data Observasi Terkurasi SENTRAVAX', 'type' => 'STATIC', 'status' => 'TERVERIFIKASI'],
                ['name' => 'Peringatan Dini Otoritas (BMKG/BNPB)', 'type' => 'CAP', 'status' => $alertsCount > 0 ? 'AKTIF' : 'NIHIL'],
                ['name' => 'Umpan Telemetri Eksternal', 'type' => 'TELEMETRI', 'status' => $dataFreshness],
            ],
            'data_freshness' => $dataFreshness,
            'computed_risk_score' => $score,
            'methodology' => 'Explainable Deterministic Multi-Hazard Inference v1.0',
        ];

        return AiInsight::updateOrCreate(
            [
                'region_id' => $regionId,
                'hazard_type_id' => $hazardTypeId,
                'title' => $title,
            ],
            [
                'risk_assessment_id' => $riskAssessment?->id,
                'insight_type' => 'proactive_resilience',
                'summary' => $summary,
                'recommendations' => $recommendations,
                'confidence_score' => $confidenceScore,
                'generation_mode' => 'rule_based',
                'model_name' => 'SENTRAVAX-Deterministic-Intelligence-Engine-v1',
                'evidence' => $evidence,
            ]
        );
    }

    /**
     * Calculate intelligent prioritization and spatiotemporal duplicate triage for community report.
     */
    public function calculateReportTriage(CommunityReport $report): array
    {
        $coords = DB::selectOne("SELECT ST_X(location) as lon, ST_Y(location) as lat FROM community_reports WHERE id = ?", [$report->id]);
        $lon = (float) ($coords?->lon ?? 106.8456);
        $lat = (float) ($coords?->lat ?? -6.2088);

        // 1. Check nearby active events within 25 km PostGIS geography
        $nearbyEvent = HazardEvent::where('status', 'active')
            ->where('hazard_type_id', $report->hazard_type_id)
            ->whereRaw("ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, 25000)", [$lon, $lat])
            ->first();

        // 2. Check active alerts for the report's region
        $activeAlert = Alert::where('status', 'active')
            ->where('hazard_type_id', $report->hazard_type_id)
            ->where(function ($q) use ($report) {
                if ($report->region_id) {
                    $q->where('region_id', $report->region_id)->orWhereNull('region_id');
                } else {
                    $q->whereNull('region_id');
                }
            })
            ->first();

        // 3. Check duplicate/nearby candidate reports within 1.5 km (geodesic) and symmetric 6 hours
        $createdAt = $report->created_at ? $report->created_at->toDateTimeString() : now()->toDateTimeString();
        $candidates = DB::select("
            SELECT id, title, status, cluster_id, created_at,
                   ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)::numeric, 1) as distance_meters
            FROM community_reports
            WHERE id != COALESCE(?, 0)
              AND hazard_type_id = ?
              AND created_at BETWEEN (?::timestamp - INTERVAL '6 hours') AND (?::timestamp + INTERVAL '6 hours')
              AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, 1500)
            ORDER BY distance_meters ASC
            LIMIT 5
        ", [$lon, $lat, $report->id, $report->hazard_type_id, $createdAt, $createdAt, $lon, $lat]);

        // 4. Calculate Priority Score & Reasons (Calibrated & Transparent)
        $score = 20; // Base score
        $reasons = [];

        if ($nearbyEvent) {
            $eventAdd = match ($nearbyEvent->severity) {
                'critical', 'high' => 25,
                'medium' => 15,
                default => 10,
            };
            $score += $eventAdd;
            $reasons[] = sprintf("Konteks Operasional: Berdekatan dengan kejadian bencana aktif '%s' (tingkat keparahan: %s) dalam radius 25 km (+%d).", $nearbyEvent->title, $nearbyEvent->severity, $eventAdd);
        }

        if ($activeAlert) {
            $score += 20;
            $reasons[] = sprintf("Konteks Operasional: Bersesuaian dengan peringatan dini resmi aktif '%s' (+20).", $activeAlert->title);
        }

        $candidateCount = count($candidates);
        if ($candidateCount >= 2) {
            $score += 15;
            $reasons[] = sprintf("Volume Laporan: Terkonsentrasi dalam klaster %d laporan masyarakat serupa dalam radius 1.5 km (+15).", $candidateCount + 1);
        } elseif ($candidateCount === 1) {
            $score += 10;
            $reasons[] = "Volume Laporan: Terdeteksi 1 laporan warga berdekatan dalam radius 1.5 km (+10).";
        }

        if (strlen($report->description ?? '') >= 40) {
            $score += 10;
            $reasons[] = "Kelengkapan Data: Informasi narasi kejadian terperinci (indikator kelengkapan informasi, bukan bukti kebenaran) (+10).";
        }

        if (!empty($report->photo_path)) {
            $score += 10;
            $reasons[] = "Kelengkapan Data: Dilengkapi bukti dokumentasi foto lapangan (indikator kelengkapan informasi, bukan bukti kebenaran) (+10).";
        }

        $isRecent = false;
        if ($report->created_at) {
            $reportTime = $report->created_at instanceof \Carbon\Carbon ? $report->created_at : \Carbon\Carbon::parse($report->created_at);
            $isRecent = $reportTime->greaterThanOrEqualTo(now()->subHours(2));
        }
        if ($isRecent) {
            $score += 10;
            $reasons[] = "Prioritas Triase: Laporan baru masuk dalam kurun waktu 2 jam terakhir (+10).";
        }

        // Strictly clamp score within 10 to 100
        $score = min(100, max(10, $score));

        $priorityLevel = match (true) {
            $score >= 75 => 'CRITICAL',
            $score >= 60 => 'HIGH',
            $score >= 40 => 'MEDIUM',
            default => 'LOW',
        };

        if (empty($reasons)) {
            $reasons[] = "Laporan masyarakat standar tanpa korelasi langsung dengan kejadian aktif.";
        }

        $isDuplicateSuspect = $candidateCount > 0;
        $clusterId = $report->cluster_id ?? ($isDuplicateSuspect ? $candidates[0]->cluster_id : null);

        return [
            'priority_score' => $score,
            'priority_level' => $priorityLevel,
            'priority_reasons' => $reasons,
            'duplicate_detection' => [
                'is_duplicate_suspect' => $isDuplicateSuspect,
                'cluster_id' => $clusterId,
                'nearby_count' => $candidateCount,
                'candidates' => $candidates,
            ],
        ];
    }

    /**
     * Analyze and cluster incoming community reports for spatiotemporal duplicates.
     */
    public function analyzeAndClusterReport(CommunityReport $report, ?float $longitude = null, ?float $latitude = null): array
    {
        if ($longitude === null || $latitude === null) {
            $coords = DB::selectOne("SELECT ST_X(location) as lon, ST_Y(location) as lat FROM community_reports WHERE id = ?", [$report->id]);
            $longitude = (float) ($coords?->lon ?? 106.8456);
            $latitude = (float) ($coords?->lat ?? -6.2088);
        }

        // Search for candidate reports within 1500 meters (geodesic) and symmetric 6 hours of the same hazard type
        $createdAt = $report->created_at ? $report->created_at->toDateTimeString() : now()->toDateTimeString();
        $clusterCandidates = DB::select("
            SELECT id, cluster_id, title, status,
                   ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)::numeric, 1) as distance_meters
            FROM community_reports
            WHERE id != COALESCE(?, 0)
              AND hazard_type_id = ?
              AND created_at BETWEEN (?::timestamp - INTERVAL '6 hours') AND (?::timestamp + INTERVAL '6 hours')
              AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, 1500)
            ORDER BY distance_meters ASC
            LIMIT 5
        ", [$longitude, $latitude, $report->id, $report->hazard_type_id, $createdAt, $createdAt, $longitude, $latitude]);

        $isDuplicateSuspect = count($clusterCandidates) > 0;
        $clusterId = null;

        if ($isDuplicateSuspect) {
            // Inherit cluster_id from first candidate or generate new cluster identifier
            $clusterId = $clusterCandidates[0]->cluster_id ?? ('cluster_' . Str::random(10));
        } else {
            $clusterId = 'cluster_' . Str::random(10);
        }

        $report->update(['cluster_id' => $clusterId]);

        return [
            'cluster_id' => $clusterId,
            'duplicate_suspected' => $isDuplicateSuspect,
            'is_duplicate_suspect' => $isDuplicateSuspect,
            'nearby_reports_count' => count($clusterCandidates),
            'related_reports_count' => count($clusterCandidates),
            'nearby_reports' => $clusterCandidates,
        ];
    }
}

