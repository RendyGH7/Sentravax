<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\DataSource;
use App\Models\EducationContent;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Services\Preparedness\PreparednessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
{
    public function __construct(
        protected PreparednessService $preparednessService
    ) {}

    /**
     * Public Disaster & Platform Overview.
     */
    public function overview(): JsonResponse
    {
        $activeEventsCount = HazardEvent::where('status', 'active')->count();
        $activeAlertsCount = Alert::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })->count();

        $regionsCount = Region::count();
        $latestSync = DB::table('data_source_sync_runs')->latest('synced_at')->first();

        return response()->json([
            'success' => true,
            'message' => 'Overview publik berhasil diambil.',
            'data' => [
                'platform' => 'SENTRAVAX Disaster Intelligence',
                'active_hazard_events' => $activeEventsCount,
                'active_alerts' => $activeAlertsCount,
                'monitored_regions' => $regionsCount,
                'system_status' => 'operational',
                'telemetry_sync' => [
                    'status' => $latestSync?->status ?? 'SUCCESS',
                    'freshness' => $latestSync?->freshness_state ?? 'LIVE',
                    'last_synced_at' => $latestSync?->synced_at ?? now()->toIso8601String(),
                ],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Flagship Feature: SENTRAVAX SIAGA PERSONAL — Cek Risiko Lokasi Mandiri
     */
    public function checkLocation(Request $request): JsonResponse
    {
        // Support both latitude/lat and longitude/lon
        $lat = $request->input('latitude') ?? $request->input('lat');
        $lon = $request->input('longitude') ?? $request->input('lon');

        $request->merge([
            'latitude' => $lat,
            'longitude' => $lon,
        ]);

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
        ]);

        $result = $this->preparednessService->checkLocation(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            isset($validated['region_id']) ? (int) $validated['region_id'] : null
        );

        return response()->json([
            'success' => true,
            'message' => 'Analisis risiko lokasi Siaga Personal berhasil diproses.',
            'data' => $result,
        ]);
    }

    /**
     * List Disaster Events with filtering and pagination.
     */
    public function events(Request $request): JsonResponse
    {
        $query = HazardEvent::with(['hazardType', 'region', 'dataSource']);

        if ($request->filled('hazard_type_id')) {
            $query->where('hazard_type_id', $request->input('hazard_type_id'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->input('region_id'));
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        } else {
            $query->where('status', 'active');
        }

        $events = $query->orderBy('occurred_at', 'desc')->paginate($request->input('per_page', 15));

        // Format coordinates
        $transformed = $events->through(function ($ev) {
            $coords = DB::selectOne("SELECT ST_X(location) as lon, ST_Y(location) as lat FROM hazard_events WHERE id = ?", [$ev->id]);
            return [
                'id' => $ev->id,
                'title' => $ev->title,
                'description' => $ev->description,
                'severity' => $ev->severity,
                'status' => $ev->status,
                'hazard_type' => $ev->hazardType ? [
                    'id' => $ev->hazardType->id,
                    'slug' => $ev->hazardType->slug,
                    'name' => $ev->hazardType->name,
                    'icon' => $ev->hazardType->icon,
                ] : null,
                'region' => $ev->region ? [
                    'id' => $ev->region->id,
                    'name' => $ev->region->name,
                    'code' => $ev->region->code,
                ] : null,
                'coordinates' => [
                    'latitude' => $coords?->lat ?? null,
                    'longitude' => $coords?->lon ?? null,
                ],
                'occurred_at' => $ev->occurred_at?->toIso8601String(),
                'source' => $ev->dataSource?->name ?? 'SENTRAVAX',
                'source_name' => $ev->dataSource?->name ?? 'SENTRAVAX',
                'provider_name' => $ev->dataSource?->provider ?? 'SENTRAVAX',
                'provenance_status' => in_array($ev->dataSource?->source_type, ['api', 'stream']) ? 'LIVE' : 'STATIC',
                'provenance_label' => in_array($ev->dataSource?->source_type, ['api', 'stream'])
                    ? ($ev->hazardType?->slug === 'earthquake' ? 'LIVE (BMKG TEWS)' : 'LIVE (TELEMETRI)')
                    : 'STATIC (TERKURASI)',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformed,
        ]);
    }

    /**
     * Single Hazard Event Detail.
     */
    public function eventDetail(int $id): JsonResponse
    {
        $ev = HazardEvent::with(['hazardType', 'region', 'dataSource', 'alerts'])->findOrFail($id);

        $coords = DB::selectOne("SELECT ST_X(location) as lon, ST_Y(location) as lat FROM hazard_events WHERE id = ?", [$ev->id]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ev->id,
                'title' => $ev->title,
                'description' => $ev->description,
                'severity' => $ev->severity,
                'status' => $ev->status,
                'hazard_type' => $ev->hazardType,
                'region' => $ev->region,
                'coordinates' => [
                    'latitude' => $coords?->lat ?? null,
                    'longitude' => $coords?->lon ?? null,
                ],
                'source_metadata' => $ev->source_metadata,
                'occurred_at' => $ev->occurred_at?->toIso8601String(),
                'reported_at' => $ev->reported_at?->toIso8601String(),
                'alerts' => $ev->alerts,
                'data_source' => $ev->dataSource ? [
                    'id' => $ev->dataSource->id,
                    'name' => $ev->dataSource->name,
                    'provider' => $ev->dataSource->provider,
                    'source_type' => $ev->dataSource->source_type,
                    'status' => $ev->dataSource->status,
                    'provenance_status' => in_array($ev->dataSource->source_type, ['api', 'stream']) ? 'LIVE' : 'STATIC',
                    'provenance_label' => in_array($ev->dataSource->source_type, ['api', 'stream'])
                        ? ($ev->hazardType?->slug === 'earthquake' ? 'LIVE (BMKG TEWS)' : 'LIVE (TELEMETRI)')
                        : 'STATIC (TERKURASI)',
                ] : null,
            ],
        ]);
    }

    /**
     * Map Features GeoJSON-like payload for interactive map.
     */
    public function mapFeatures(): JsonResponse
    {
        $events = DB::select("
            SELECT he.id, he.title, he.severity, he.status, he.occurred_at,
                   ht.slug as hazard_slug, ht.name as hazard_name, ht.icon as hazard_icon,
                   ds.id as data_source_id, ds.name as source_name, ds.provider as provider_name, ds.source_type,
                   ST_X(he.location) as lon, ST_Y(he.location) as lat
            FROM hazard_events he
            JOIN hazard_types ht ON he.hazard_type_id = ht.id
            LEFT JOIN data_sources ds ON he.data_source_id = ds.id
            WHERE he.status = 'active'
              AND he.location IS NOT NULL
        ");

        $features = array_map(function ($ev) {
            $sourceType = strtolower($ev->source_type ?? '');
            $isLiveFeed = ($sourceType === 'api' || $sourceType === 'stream');

            $provenanceStatus = $isLiveFeed ? 'LIVE' : 'STATIC';
            $provenanceLabel = $isLiveFeed
                ? ($ev->hazard_slug === 'earthquake' ? 'LIVE (BMKG TEWS)' : 'LIVE (TELEMETRI)')
                : 'STATIC (TERKURASI)';

            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [(float) $ev->lon, (float) $ev->lat],
                ],
                'properties' => [
                    'id' => $ev->id,
                    'title' => $ev->title,
                    'hazard_slug' => $ev->hazard_slug,
                    'hazard_name' => $ev->hazard_name,
                    'hazard_icon' => $ev->hazard_icon,
                    'severity' => $ev->severity,
                    'occurred_at' => $ev->occurred_at,
                    'source_name' => $ev->source_name ?? 'SENTRAVAX',
                    'provider_name' => $ev->provider_name ?? 'SENTRAVAX',
                    'provenance_status' => $provenanceStatus,
                    'provenance_label' => $provenanceLabel,
                ],
            ];
        }, $events);

        return response()->json([
            'success' => true,
            'type' => 'FeatureCollection',
            'features' => $features,
        ]);
    }

    /**
     * List Active Official Alerts.
     */
    public function alerts(Request $request): JsonResponse
    {
        $query = Alert::with(['hazardType', 'region', 'hazardEvent'])
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if ($request->filled('broadcast_level')) {
            $query->where('broadcast_level', $request->input('broadcast_level'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->input('region_id'));
        }

        $alerts = $query->orderBy('starts_at', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $alerts,
        ]);
    }

    /**
     * List Hazard Types.
     */
    public function hazardTypes(): JsonResponse
    {
        $types = HazardType::where('is_active', true)->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $types,
        ]);
    }

    /**
     * Search & List Regions.
     */
    public function regions(Request $request): JsonResponse
    {
        $query = Region::query();

        if ($request->filled('q')) {
            $search = '%' . strtolower($request->input('q')) . '%';
            $query->whereRaw('LOWER(name) LIKE ? OR LOWER(code) LIKE ?', [$search, $search]);
        }

        if ($request->filled('level')) {
            $query->where('level', $request->input('level'));
        }

        $regions = $query->orderBy('name')->get();

        $data = $regions->map(function ($r) {
            $coords = DB::selectOne("SELECT ST_X(center_point) as lon, ST_Y(center_point) as lat FROM regions WHERE id = ?", [$r->id]);
            return [
                'id' => $r->id,
                'code' => $r->code,
                'name' => $r->name,
                'level' => $r->level,
                'center' => [
                    'latitude' => $coords?->lat ?? null,
                    'longitude' => $coords?->lon ?? null,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * List Published Education Contents.
     */
    public function education(Request $request): JsonResponse
    {
        $query = EducationContent::with('hazardType')
            ->where('is_published', true);

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('hazard_type_id')) {
            $query->where('hazard_type_id', $request->input('hazard_type_id'));
        }

        $contents = $query->orderBy('sort_order')->orderBy('published_at', 'desc')->paginate($request->input('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => $contents,
        ]);
    }

    /**
     * Single Education Article Detail.
     */
    public function educationDetail(string $slug): JsonResponse
    {
        $article = EducationContent::with('hazardType')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $article,
        ]);
    }

    /**
     * Public Data Sources Health Status.
     */
    public function dataSources(): JsonResponse
    {
        $sources = DataSource::with(['syncRuns' => function ($q) {
            $q->latest('synced_at')->take(1);
        }])->get();

        $data = $sources->map(function ($ds) {
            $lastRun = $ds->syncRuns->first();
            return [
                'id' => $ds->id,
                'name' => $ds->name,
                'provider' => $ds->provider,
                'category' => $ds->category,
                'status' => $ds->status,
                'last_fetched_at' => $ds->last_fetched_at?->toIso8601String(),
                'freshness_state' => $lastRun?->freshness_state ?? 'LIVE',
                'notes' => $ds->notes,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
