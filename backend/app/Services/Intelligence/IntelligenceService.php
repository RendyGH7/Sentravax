<?php

namespace App\Services\Intelligence;

use App\Models\AiInsight;
use App\Models\CommunityReport;
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

        // Query active events and reports in region
        $eventsCount = HazardEvent::where('region_id', $regionId)
            ->where('hazard_type_id', $hazardTypeId)
            ->where('status', 'active')
            ->count();

        $reportsCount = CommunityReport::where('region_id', $regionId)
            ->where('hazard_type_id', $hazardTypeId)
            ->where('status', 'verified')
            ->count();

        $score = $riskAssessment?->risk_score ?? 65.0;

        // Determine title and actionable recommendations
        $title = sprintf("Proyeksi Dinamika %s — Wilayah %s", $hazardType->name, $region->name);

        $summary = sprintf(
            "Analisis spasial multi-hazard SENTRAVAX mengidentifikasi skor kerentanan %.1f/100 di %s. " .
            "Terdeteksi %d kejadian aktif dan %d laporan warga terverifikasi dalam rentang pemantauan geospasial.",
            $score,
            $region->name,
            $eventsCount,
            $reportsCount
        );

        $recommendations = match ($hazardType->slug) {
            'flood' => [
                'Tingkatkan pemantauan pada titik sempadan sungai dan saluran drainase utama.',
                'Aktivasi posko kesiapsiagaan warga dan amankan dokumen penting ke tempat tinggi.',
                'Siapkan jalur evakuasi bebas genangan bagi kelompok rentan (lansia dan balita).',
            ],
            'earthquake' => [
                'Inspeksi visual struktur bangunan fasilitas umum dari retakan dinding pasca getaran.',
                'Pastikan jalur keluar darurat dan tangga bebas dari halangan barang.',
                'Simpan tas siaga bencana di dekat pintu keluar utama rumah.',
            ],
            'landslide' => [
                'Waspadai retakan tanah baru atau rembesan air keruh di lereng bukit.',
                'Hindari bermalam di ruangan yang berbatasan langsung dengan tebing curam saat hujan deras.',
                'Koordinasikan titik kumpul aman di lapangan datar terbuka bersama pengurus RT/RW.',
            ],
            default => [
                'Pantau pembaruan berkala peringatan resmi BMKG dan BNPB melalui SENTRAVAX.',
                'Siapkan perlengkapan dasar darurat dan nomor kontak darurat keluarga.',
            ],
        };

        $evidence = [
            'region_code' => $region->code,
            'hazard_slug' => $hazardType->slug,
            'active_hazard_events' => $eventsCount,
            'verified_community_reports' => $reportsCount,
            'computed_risk_score' => $score,
            'telemetry_sync' => 'PostGIS_Spatial_Buffer',
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
                'confidence_score' => 0.915,
                'generation_mode' => 'rule_based',
                'model_name' => 'SENTRAVAX-Deterministic-Intelligence-Engine-v1',
                'evidence' => $evidence,
            ]
        );
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

        // Search for existing active reports within 1500 meters and 6 hours of the same hazard type
        $clusterCandidates = DB::select("
            SELECT id, cluster_id, title, status,
                   ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance_deg
            FROM community_reports
            WHERE id != ?
              AND hazard_type_id = ?
              AND created_at >= NOW() - INTERVAL '6 hours'
              AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326), 0.015) -- ~1.5km
            ORDER BY distance_deg ASC
            LIMIT 5
        ", [$longitude, $latitude, $report->id, $report->hazard_type_id, $longitude, $latitude]);

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
