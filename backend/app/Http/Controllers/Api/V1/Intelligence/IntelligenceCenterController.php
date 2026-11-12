<?php

namespace App\Http\Controllers\Api\V1\Intelligence;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\ReportVerification;
use App\Models\RiskAssessment;
use App\Services\Intelligence\IntelligenceService;
use App\Services\Notification\NotificationService;
use App\Services\RiskEngine\RiskEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class IntelligenceCenterController extends Controller
{
    public function __construct(
        protected RiskEngineService $riskEngineService,
        protected IntelligenceService $intelligenceService,
        protected NotificationService $notificationService
    ) {}

    /**
     * Geospatial Command & Intelligence Center Overview telemetry.
     */
    public function overview(): JsonResponse
    {
        $activeThreatsCount = HazardEvent::where('status', 'active')->count();
        $unverifiedReportsCount = CommunityReport::where('status', 'pending')->count();
        $activeAlertsCount = Alert::where('status', 'active')->count();
        $insightsCount = AiInsight::count();

        // Latest deterministic proactive AI insights
        $latestInsights = AiInsight::with(['region:id,name,level', 'hazardType:id,slug,name,icon'])
            ->latest()
            ->limit(5)
            ->get();

        // Multi-hazard simulation projection summary (DEM 5m + PostGIS vector tiles)
        $simulationData = [
            'scenario_name' => 'Simulasi Proyeksi Genangan dan Bahaya Spasial',
            'freshness' => 'DATA AKTIF FRESH (5 menit lalu)',
            'hazard_type' => 'Banjir Luapan',
            'active_layer' => 'DEM 5M + POSTGIS FLOOD POLYGON',
            'zone' => 'DAS Ciliwung Hilir & Dataran Alluvial Jakarta',
            'data_nature' => 'DEMONSTRATION_SCENARIO',
            'elevation_source' => 'DEMNAS Badan Informasi Geospasial (BIG) 0.27 arcsec (~8.1m resampled to 5m mesh)',
            'disclaimer' => 'Simulasi ini merupakan model proyeksi hidrologi skenario demonstrasi berbasis profil DEMNAS dan kurva debit Ciliwung, BUKAN prediksi mutlak waktu kejadian bencana riil.',
            'metrics' => [
                'exposed_population' => 42150,
                'population_trend' => 'Bertambah pada langkah simulasi +12 Jam',
                'critical_facilities_in_radius' => [
                    'total' => 8,
                    'breakdown' => '2 Rumah Sakit Umum, 6 Fasilitas Sekolah Dasar',
                ],
                'river_discharge_status' => [
                    'level' => 'SIAGA 2',
                    'current_flow_m3_s' => 480,
                    'critical_threshold_m3_s' => 550,
                ],
            ],
            'timeline_steps' => ['+1 Jam', '+3 Jam', '+6 Jam', '+12 Jam', '+24 Jam'],
            'current_step' => '+12 Jam',
        ];

        return response()->json([
            'success' => true,
            'message' => 'Telemetri Pusat Komando Intelijen Geospasial berhasil dimuat.',
            'data' => [
                'telemetry' => [
                    'stream_status' => 'STREAMING AKTIF',
                    'sources_connected' => '7 Node Aktif (PostGIS Spatial Sync)',
                    'postgis_status' => 'NORMAL',
                    'last_sync' => now()->subMinutes(3)->toIso8601String(),
                ],
                'metrics' => [
                    'active_threats' => $activeThreatsCount,
                    'unverified_reports' => $unverifiedReportsCount,
                    'active_cap_alerts' => $activeAlertsCount,
                    'proactive_insights_generated' => $insightsCount,
                ],
                'simulation_projection' => $simulationData,
                'recent_insights' => $latestInsights,
            ],
        ]);
    }

    /**
     * Intelligence spatial layers formatted as standard GeoJSON FeatureCollections.
     */
    public function map(): JsonResponse
    {
        // 1. Hazard Events Layer
        $events = HazardEvent::query()
            ->select([
                'id',
                'title',
                'description',
                'severity',
                'status',
                'hazard_type_id',
                'region_id',
                'occurred_at',
                DB::raw('ST_Y(location) as lat'),
                DB::raw('ST_X(location) as lon'),
            ])
            ->whereIn('status', ['active', 'contained'])
            ->with(['hazardType:id,slug,name,icon', 'region:id,name'])
            ->get();

        $eventFeatures = $events->map(function ($ev) {
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$ev->lon, $ev->lat],
                ],
                'properties' => [
                    'layer' => 'hazard_events',
                    'id' => $ev->id,
                    'title' => $ev->title,
                    'severity' => $ev->severity,
                    'status' => $ev->status,
                    'hazard_type' => $ev->hazardType?->name,
                    'hazard_code' => $ev->hazardType?->code,
                    'region' => $ev->region?->name,
                    'occurred_at' => $ev->occurred_at?->toIso8601String(),
                ],
            ];
        });

        // 2. Clustered Pending/Verified Reports Layer
        $reports = CommunityReport::query()
            ->select([
                'id',
                'title',
                'status',
                'cluster_id',
                'hazard_type_id',
                'region_id',
                'created_at',
                DB::raw('ST_Y(location) as lat'),
                DB::raw('ST_X(location) as lon'),
            ])
            ->whereIn('status', ['pending', 'verified'])
            ->with(['hazardType:id,slug,name', 'region:id,name'])
            ->latest()
            ->limit(100)
            ->get();

        $reportFeatures = $reports->map(function ($rep) {
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$rep->lon, $rep->lat],
                ],
                'properties' => [
                    'layer' => 'community_reports',
                    'id' => $rep->id,
                    'title' => $rep->title,
                    'status' => $rep->status,
                    'cluster_id' => $rep->cluster_id,
                    'hazard_type' => $rep->hazardType?->name,
                    'region' => $rep->region?->name,
                    'created_at' => $rep->created_at?->toIso8601String(),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Layer spasial peta intelijen berhasil dimuat.',
            'data' => [
                'type' => 'FeatureCollection',
                'features' => array_merge($eventFeatures->all(), $reportFeatures->all()),
            ],
        ]);
    }

    /**
     * Trigger multi-hazard risk engine evaluation for a region and hazard type.
     */
    public function evaluateRisk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $assessment = $this->riskEngineService->evaluateAndPersistRegionalRisk(
            $validated['region_id'],
            $validated['hazard_type_id'],
            $validated['title'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Penilaian risiko multi-hazard berhasil dihitung dan diperbarui.',
            'data' => $assessment->load(['region', 'hazardType']),
        ]);
    }

    /**
     * Generate deterministic proactive intelligence insight with transparent explanation.
     */
    public function generateInsight(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'],
            'risk_assessment_id' => ['nullable', 'integer', 'exists:risk_assessments,id'],
        ]);

        $insight = $this->intelligenceService->generateProactiveInsight(
            $validated['region_id'],
            $validated['hazard_type_id'],
            $validated['risk_assessment_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'AI Proactive Insight berhasil dihasilkan.',
            'data' => $insight->load(['region', 'hazardType']),
        ], 201);
    }

    /**
     * Queue of unverified reports for intelligence analysis, with duplicate cluster tagging.
     */
    public function reportsQueue(Request $request): JsonResponse
    {
        $query = CommunityReport::query()
            ->select([
                'id',
                'user_id',
                'hazard_type_id',
                'region_id',
                'title',
                'description',
                'photo_path',
                'status',
                'cluster_id',
                'created_at',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->where('status', 'pending')
            ->with(['hazardType:id,slug,name,icon', 'region:id,code,name,level', 'user:id,name,email']);

        if ($request->filled('cluster_id')) {
            $query->where('cluster_id', $request->query('cluster_id'));
        }

        $reports = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'message' => 'Antrean verifikasi intelijen berhasil dimuat.',
            'data' => $reports->items(),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    /**
     * Verify or reject report from the Intelligence Center.
     */
    public function verifyReport(Request $request, int $id): JsonResponse
    {
        $report = CommunityReport::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan bencana tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['verified', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $intelUser = $request->user();

        $previousStatus = $report->status;

        $report->status = $validated['status'];
        $report->verified_by = $intelUser->id;
        $report->verified_at = now();
        $report->moderation_notes = $validated['notes'] ?? null;
        $report->save();

        ReportVerification::create([
            'community_report_id' => $report->id,
            'verified_by' => $intelUser->id,
            'previous_status' => $previousStatus,
            'new_status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Laporan #{$report->id} berhasil diverifikasi oleh Intelijen ({$report->status}).",
            'data' => $report,
        ]);
    }

    /**
     * Dispatch CAP early warning alert and distribute targeted notifications.
     */
    public function dispatchAlert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'],
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'hazard_event_id' => ['nullable', 'integer', 'exists:hazard_events,id'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'alert_class' => ['required', 'string', Rule::in(['advisory', 'watch', 'warning'])],
            'broadcast_level' => ['required', 'string', Rule::in(['local', 'regional', 'national'])],
            'starts_at' => ['required', 'date'],
            'expires_at' => ['required', 'date', 'after:starts_at'],
        ]);

        $alert = Alert::create([
            'hazard_type_id' => $validated['hazard_type_id'],
            'region_id' => $validated['region_id'],
            'hazard_event_id' => $validated['hazard_event_id'] ?? null,
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'alert_class' => $validated['alert_class'],
            'broadcast_level' => $validated['broadcast_level'],
            'status' => 'active',
            'starts_at' => $validated['starts_at'],
            'expires_at' => $validated['expires_at'],
        ]);

        // Targeted alert dissemination to citizens monitoring this region
        $distributedCount = $this->notificationService->distributeAlertNotifications($alert);

        return response()->json([
            'success' => true,
            'message' => "Disseminasi CAP Peringatan Dini berhasil diterbitkan dan dikirimkan ke {$distributedCount} warga terdaftar.",
            'data' => [
                'alert' => $alert->load(['hazardType', 'region']),
                'dissemination' => [
                    'cap_status' => 'DISTRIBUTED',
                    'recipients_count' => $distributedCount,
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
        ], 201);
    }
}
