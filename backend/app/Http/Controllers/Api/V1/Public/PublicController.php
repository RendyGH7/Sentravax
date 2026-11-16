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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

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
                    'status' => $latestSync?->status ?? 'UNAVAILABLE',
                    'freshness' => $latestSync?->freshness_state ?? 'UNAVAILABLE',
                    'last_synced_at' => $latestSync?->synced_at,
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
     * List Disaster Events with multi-criteria filtering, validation, and pagination.
     */
    public function events(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => ['nullable', 'string', 'max:100'],
            'hazard_type_id' => ['nullable', 'integer', 'exists:hazard_types,id'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'severity' => ['nullable', 'string', Rule::in(['minor', 'moderate', 'severe', 'extreme', 'low', 'medium', 'high'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'contained', 'resolved', 'all'])],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort_by' => ['nullable', 'string', Rule::in(['occurred_at', 'severity', 'title', 'created_at'])],
            'sort_order' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi parameter kejadian bencana gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = HazardEvent::selectRaw('hazard_events.*, ST_X(location) as lon, ST_Y(location) as lat')
            ->with(['hazardType', 'region', 'dataSource']);

        // Text search (q)
        if ($request->filled('q')) {
            $search = '%' . strtolower($request->input('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$search]);
            });
        }

        if ($request->filled('hazard_type_id')) {
            $query->where('hazard_type_id', $request->input('hazard_type_id'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->input('region_id'));
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        // Status handling: default 'active'. If 'all', do not filter status.
        $status = $request->input('status');
        if ($status === 'all') {
            // Include all statuses
        } elseif (!empty($status)) {
            $query->where('status', $status);
        } else {
            $query->where('status', 'active');
        }

        // Date range filtering
        if ($request->filled('date_from')) {
            $query->where('occurred_at', '>=', Carbon::parse($request->input('date_from'))->startOfDay());
        }
        if ($request->filled('date_to')) {
            $query->where('occurred_at', '<=', Carbon::parse($request->input('date_to'))->endOfDay());
        }

        // Safe sort whitelist
        $sortBy = $request->input('sort_by', 'occurred_at');
        $sortOrder = strtolower($request->input('sort_order', 'desc'));
        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('per_page', 15);
        $events = $query->paginate($perPage);

        // Format coordinates and provenance metadata (no N+1: ST_X/ST_Y selected in base query)
        $transformed = $events->through(function ($ev) {
            $lat = $ev->lat !== null ? (float) $ev->lat : null;
            $lon = $ev->lon !== null ? (float) $ev->lon : null;
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
                    'latitude' => $lat,
                    'longitude' => $lon,
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
     * Enhanced Single Hazard Event Detail with spatial nearby events, guidelines & timeline.
     */
    public function eventDetail(int $id): JsonResponse
    {
        $ev = HazardEvent::with(['hazardType', 'region', 'dataSource', 'alerts'])->find($id);

        if (!$ev) {
            return response()->json([
                'success' => false,
                'message' => 'Kejadian bencana tidak ditemukan.',
            ], 404);
        }

        $coords = DB::selectOne("SELECT ST_X(location) as lon, ST_Y(location) as lat FROM hazard_events WHERE id = ?", [$ev->id]);

        // 1. Spatial nearby events via PostGIS ST_DWithin (<= 50 km, max 3, excluding self)
        $nearbyEvents = [];
        if ($coords && $coords->lon !== null && $coords->lat !== null) {
            $nearbyRecords = DB::select("
                SELECT id, title, severity, status, occurred_at, hazard_type_id,
                       ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as distance_meters,
                       ST_X(location) as lon, ST_Y(location) as lat
                FROM hazard_events
                WHERE id != ?
                  AND location IS NOT NULL
                  AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, 50000)
                ORDER BY distance_meters ASC
                LIMIT 3
            ", [$coords->lon, $coords->lat, $ev->id, $coords->lon, $coords->lat]);

            $nearbyHazardTypeIds = array_filter(array_column($nearbyRecords, 'hazard_type_id'));
            $nearbyHazardTypes = empty($nearbyHazardTypeIds) ? collect() : HazardType::whereIn('id', $nearbyHazardTypeIds)->get()->keyBy('id');

            $nearbyEvents = array_map(function ($nr) use ($nearbyHazardTypes) {
                $ht = $nearbyHazardTypes->get($nr->hazard_type_id);
                return [
                    'id' => $nr->id,
                    'title' => $nr->title,
                    'severity' => $nr->severity,
                    'status' => $nr->status,
                    'distance_km' => round($nr->distance_meters / 1000, 1),
                    'distance_meters' => (float) round($nr->distance_meters, 0),
                    'coordinates' => [
                        'latitude' => $nr->lat ? (float) $nr->lat : null,
                        'longitude' => $nr->lon ? (float) $nr->lon : null,
                    ],
                    'hazard_type' => $ht ? [
                        'id' => $ht->id,
                        'name' => $ht->name,
                        'slug' => $ht->slug,
                        'icon' => $ht->icon,
                    ] : null,
                    'occurred_at' => $nr->occurred_at ? Carbon::parse($nr->occurred_at)->toIso8601String() : null,
                ];
            }, $nearbyRecords);
        }

        // 2. Published Safety Guidelines for this hazard type (max 2)
        $safetyGuidelines = EducationContent::where('hazard_type_id', $ev->hazard_type_id)
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->limit(2)
            ->get(['id', 'title', 'slug', 'category', 'summary', 'published_at'])
            ->map(function ($edu) {
                return [
                    'id' => $edu->id,
                    'title' => $edu->title,
                    'slug' => $edu->slug,
                    'category' => $edu->category,
                    'summary' => $edu->summary,
                    'published_at' => $edu->published_at?->toIso8601String(),
                ];
            });

        // 3. Truthful timeline strictly mapped to verified database timestamps (zero fabricated stages)
        $timeline = [];
        if ($ev->occurred_at) {
            $timeline[] = [
                'entity' => 'hazard_event',
                'field' => 'occurred_at',
                'label' => 'Waktu Kejadian Bencana',
                'timestamp' => $ev->occurred_at->toIso8601String(),
                'description' => 'Waktu kejadian ' . strtolower($ev->hazardType?->name ?? 'peristiwa bencana') . ' sebagaimana tercatat pada data sumber.',
            ];
        }
        if ($ev->reported_at) {
            $timeline[] = [
                'entity' => 'hazard_event',
                'field' => 'reported_at',
                'label' => 'Waktu Pelaporan Kejadian',
                'timestamp' => $ev->reported_at->toIso8601String(),
                'description' => 'Waktu pelaporan peristiwa bencana sebagaimana tercatat dalam sistem.',
            ];
        }
        foreach ($ev->alerts as $alert) {
            if ($alert->status !== 'draft') {
                if ($alert->starts_at) {
                    $timeline[] = [
                        'entity' => 'alert',
                        'alert_id' => $alert->id,
                        'field' => 'starts_at',
                        'label' => 'Waktu Mulai Berlaku Peringatan',
                        'timestamp' => $alert->starts_at->toIso8601String(),
                        'description' => 'Mulai berlakunya peringatan: ' . $alert->title . '.',
                    ];
                }
                if ($alert->expires_at) {
                    $timeline[] = [
                        'entity' => 'alert',
                        'alert_id' => $alert->id,
                        'field' => 'expires_at',
                        'label' => 'Waktu Berakhir Peringatan',
                        'timestamp' => $alert->expires_at->toIso8601String(),
                        'description' => 'Batas waktu berlakunya peringatan: ' . $alert->title . '.',
                    ];
                }
            }
        }
        usort($timeline, fn($a, $b) => strcmp($a['timestamp'], $b['timestamp']));

        // 4. Filtered safe source metadata allowlist
        $rawMeta = $ev->source_metadata ?? [];
        $safeMetadata = [];
        $allowedMetaKeys = [
            'Magnitude', 'Kedalaman', 'Wilayah', 'Potensi', 'Shakemap', 'Tanggal', 'Jam', 'Dirasakan',
            'water_level_m', 'rainfall_rate_mmh', 'flow_rate_m3s', 'alert_threshold_m', 'telemetry_reading'
        ];
        foreach ($allowedMetaKeys as $key) {
            if (isset($rawMeta[$key])) {
                $safeMetadata[$key] = $rawMeta[$key];
            }
        }

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
                'source_metadata' => $safeMetadata,
                'occurred_at' => $ev->occurred_at?->toIso8601String(),
                'reported_at' => $ev->reported_at?->toIso8601String(),
                'alerts' => $ev->alerts,
                'nearby_events' => $nearbyEvents,
                'safety_guidelines' => $safetyGuidelines,
                'timeline' => $timeline,
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
     * List Official & Public Alerts with filtering, draft protection, and pagination.
     */
    public function alerts(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => ['nullable', 'string', 'max:100'],
            'alert_class' => ['nullable', 'string', Rule::in(['official_warning', 'platform_advisory', 'advisory', 'watch', 'warning'])],
            'broadcast_level' => ['nullable', 'string', Rule::in(['local', 'regional', 'national'])],
            'hazard_type_id' => ['nullable', 'integer', 'exists:hazard_types,id'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'status' => ['nullable', 'string', Rule::in(['active', 'expired', 'cancelled', 'all'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi parameter peringatan dini gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = Alert::with(['hazardType', 'region', 'hazardEvent.dataSource'])
            ->where('status', '!=', 'draft'); // STRICT: NEVER expose draft alerts publicly

        // Text search (q)
        if ($request->filled('q')) {
            $search = '%' . strtolower($request->input('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(message) LIKE ?', [$search]);
            });
        }

        if ($request->filled('alert_class')) {
            $query->where('alert_class', $request->input('alert_class'));
        }

        if ($request->filled('broadcast_level')) {
            $query->where('broadcast_level', $request->input('broadcast_level'));
        }

        if ($request->filled('hazard_type_id')) {
            $query->where('hazard_type_id', $request->input('hazard_type_id'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->input('region_id'));
        }

        // Status handling
        $status = $request->input('status', 'active');
        if ($status === 'active') {
            $query->where('status', 'active')
                  ->where(function ($q) {
                      $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                  });
        } elseif ($status === 'expired') {
            $query->where(function ($q) {
                $q->where('status', 'expired')
                  ->orWhere(function ($sub) {
                      $sub->whereNotNull('expires_at')->where('expires_at', '<=', now());
                  });
            });
        } elseif ($status === 'cancelled') {
            $query->where('status', 'cancelled');
        } elseif ($status === 'all') {
            // Keep all non-draft alerts
        }

        $perPage = (int) $request->input('per_page', 15);
        $alerts = $query->orderBy('starts_at', 'desc')->paginate($perPage);

        // Transform items: strictly separate Alert Issuer from Event Data Source
        $transformed = $alerts->through(function ($a) {
            $dataSource = $a->hazardEvent?->dataSource;

            // Alert Issuer: without explicit verifiable issuer certification, alert issuer is unverified
            $issuer = [
                'is_verified' => false,
                'name' => 'Penerbit tidak terverifikasi',
                'provider' => null,
                'source_type' => null,
                'verification_basis' => 'Tidak terdapat bukti eksplisit penerbit resmi tersertifikasi pada sistem peringatan dini.',
            ];

            // Event Data Source: distinct provenance of the associated hazard event
            $eventDataSource = $dataSource ? [
                'id' => $dataSource->id,
                'name' => $dataSource->name,
                'provider' => $dataSource->provider,
                'source_type' => $dataSource->source_type,
            ] : null;

            return [
                'id' => $a->id,
                'title' => $a->title,
                'message' => $a->message,
                'alert_class' => $a->alert_class,
                'broadcast_level' => $a->broadcast_level,
                'status' => $a->status,
                'is_active' => ($a->status === 'active' && (!$a->expires_at || $a->expires_at->isFuture())),
                'starts_at' => $a->starts_at?->toIso8601String(),
                'expires_at' => $a->expires_at?->toIso8601String(),
                'created_at' => $a->created_at?->toIso8601String(),
                'issuer' => $issuer,
                'event_data_source' => $eventDataSource,
                'hazard_type' => $a->hazardType ? [
                    'id' => $a->hazardType->id,
                    'name' => $a->hazardType->name,
                    'slug' => $a->hazardType->slug,
                    'icon' => $a->hazardType->icon,
                ] : null,
                'region' => $a->region ? [
                    'id' => $a->region->id,
                    'name' => $a->region->name,
                    'code' => $a->region->code,
                ] : null,
                'hazard_event_id' => $a->hazard_event_id,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformed,
        ]);
    }

    /**
     * Single Public Alert Detail with verified issuer attribution and linked hazard event.
     */
    public function alertDetail(int $id): JsonResponse
    {
        $alert = Alert::with(['hazardType', 'region', 'hazardEvent.dataSource', 'hazardEvent.hazardType', 'hazardEvent.region', 'creator'])
            ->where('status', '!=', 'draft') // Strictly exclude draft alerts
            ->find($id);

        if (!$alert) {
            return response()->json([
                'success' => false,
                'message' => 'Peringatan dini tidak ditemukan atau belum dipublikasikan.',
            ], 404);
        }

        $dataSource = $alert->hazardEvent?->dataSource;

        // Alert Issuer: without explicit verifiable issuer certification, alert issuer is unverified
        $issuer = [
            'is_verified' => false,
            'name' => 'Penerbit tidak terverifikasi',
            'provider' => null,
            'source_type' => null,
            'verification_basis' => 'Tidak terdapat bukti eksplisit penerbit resmi tersertifikasi pada sistem peringatan dini.',
        ];

        // Event Data Source: distinct provenance of the associated hazard event
        $eventDataSource = $dataSource ? [
            'id' => $dataSource->id,
            'name' => $dataSource->name,
            'provider' => $dataSource->provider,
            'source_type' => $dataSource->source_type,
        ] : null;

        $coords = null;
        if ($alert->region_id) {
            $coords = DB::selectOne("SELECT ST_X(center_point) as lon, ST_Y(center_point) as lat FROM regions WHERE id = ?", [$alert->region_id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail peringatan dini berhasil diambil.',
            'data' => [
                'id' => $alert->id,
                'title' => $alert->title,
                'message' => $alert->message,
                'alert_class' => $alert->alert_class,
                'broadcast_level' => $alert->broadcast_level,
                'status' => $alert->status,
                'is_active' => ($alert->status === 'active' && (!$alert->expires_at || $alert->expires_at->isFuture())),
                'starts_at' => $alert->starts_at?->toIso8601String(),
                'expires_at' => $alert->expires_at?->toIso8601String(),
                'created_at' => $alert->created_at?->toIso8601String(),
                'issuer' => $issuer,
                'event_data_source' => $eventDataSource,
                'hazard_type' => $alert->hazardType ? [
                    'id' => $alert->hazardType->id,
                    'name' => $alert->hazardType->name,
                    'slug' => $alert->hazardType->slug,
                    'icon' => $alert->hazardType->icon,
                ] : null,
                'region' => $alert->region ? [
                    'id' => $alert->region->id,
                    'name' => $alert->region->name,
                    'code' => $alert->region->code,
                    'level' => $alert->region->level,
                    'center' => [
                        'latitude' => $coords?->lat ?? null,
                        'longitude' => $coords?->lon ?? null,
                    ],
                ] : null,
                'hazard_event' => $alert->hazardEvent ? [
                    'id' => $alert->hazardEvent->id,
                    'title' => $alert->hazardEvent->title,
                    'severity' => $alert->hazardEvent->severity,
                    'status' => $alert->hazardEvent->status,
                    'occurred_at' => $alert->hazardEvent->occurred_at?->toIso8601String(),
                    'data_source' => $eventDataSource,
                ] : null,
            ],
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
