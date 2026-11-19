<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\EducationContent;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\Shelter;
use App\Services\Intelligence\IntelligenceService;
use App\Services\Preparedness\PreparednessService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PublicController extends Controller
{
    public function __construct(
        protected PreparednessService $preparednessService,
        protected IntelligenceService $intelligenceService
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

            $raw = is_array($a->raw_provenance) ? $a->raw_provenance : (is_string($a->raw_provenance) ? json_decode($a->raw_provenance, true) : []);
            $sender = $raw['sender'] ?? null;
            $hasValidSender = !empty($sender) && (
                str_ends_with(strtolower($sender), '@bmkg.go.id') ||
                str_ends_with(strtolower($sender), '@bnpb.go.id') ||
                in_array(strtolower($sender), ['bmkg', 'bnpb', 'inatews'])
            );
            $hasOfficialSource = $dataSource && $dataSource->source_type === 'cap' && in_array($dataSource->provider, [
                'Badan Meteorologi, Klimatologi, dan Geofisika',
                'Badan Meteorologi Klimatologi dan Geofisika',
                'Badan Nasional Penanggulangan Bencana',
                'BNPB',
                'BMKG',
            ]);
            $isVerifiedCap = $a->alert_class === 'official_warning' && ($hasValidSender || $hasOfficialSource);
            $issuer = [
                'is_verified' => $isVerifiedCap,
                'name' => $isVerifiedCap ? ($a->sender_name ?: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)') : 'Penerbit tidak terverifikasi',
                'provider' => $isVerifiedCap ? ($dataSource?->provider ?? 'Badan Meteorologi, Klimatologi, dan Geofisika') : null,
                'source_type' => $isVerifiedCap ? 'official_cap' : null,
                'verification_basis' => $isVerifiedCap
                    ? 'Peringatan resmi terverifikasi melalui format Common Alerting Protocol (OASIS CAP v1.2) dengan identitas penerbit terotorisasi.'
                    : 'Tidak terdapat bukti eksplisit penerbit resmi tersertifikasi pada sistem peringatan dini.',
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
                'external_identifier' => $a->external_identifier,
                'title' => $a->title,
                'sender_name' => $a->sender_name,
                'message' => $a->message,
                'instruction' => $a->instruction,
                'area_description' => $a->area_description,
                'alert_class' => $a->alert_class,
                'broadcast_level' => $a->broadcast_level,
                'cap_urgency' => $a->cap_urgency,
                'cap_severity' => $a->cap_severity,
                'cap_certainty' => $a->cap_certainty,
                'source_url' => $a->source_url,
                'polygon_coordinates' => $a->polygon_coordinates,
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

        $raw = is_array($alert->raw_provenance) ? $alert->raw_provenance : (is_string($alert->raw_provenance) ? json_decode($alert->raw_provenance, true) : []);
        $sender = $raw['sender'] ?? null;
        $hasValidSender = !empty($sender) && (
            str_ends_with(strtolower($sender), '@bmkg.go.id') ||
            str_ends_with(strtolower($sender), '@bnpb.go.id') ||
            in_array(strtolower($sender), ['bmkg', 'bnpb', 'inatews'])
        );
        $hasOfficialSource = $dataSource && $dataSource->source_type === 'cap' && in_array($dataSource->provider, [
            'Badan Meteorologi, Klimatologi, dan Geofisika',
            'Badan Meteorologi Klimatologi dan Geofisika',
            'Badan Nasional Penanggulangan Bencana',
            'BNPB',
            'BMKG',
        ]);
        $isVerifiedCap = $alert->alert_class === 'official_warning' && ($hasValidSender || $hasOfficialSource);
        $issuer = [
            'is_verified' => $isVerifiedCap,
            'name' => $isVerifiedCap ? ($alert->sender_name ?: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)') : 'Penerbit tidak terverifikasi',
            'provider' => $isVerifiedCap ? ($dataSource?->provider ?? 'Badan Meteorologi, Klimatologi, dan Geofisika') : null,
            'source_type' => $isVerifiedCap ? 'official_cap' : null,
            'verification_basis' => $isVerifiedCap
                ? 'Peringatan resmi terverifikasi melalui format Common Alerting Protocol (OASIS CAP v1.2) dengan identitas penerbit terotorisasi.'
                : 'Tidak terdapat bukti eksplisit penerbit resmi tersertifikasi pada sistem peringatan dini.',
            'external_identifier' => $alert->external_identifier,
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
                'external_identifier' => $alert->external_identifier,
                'title' => $alert->title,
                'sender_name' => $alert->sender_name,
                'message' => $alert->message,
                'instruction' => $alert->instruction,
                'area_description' => $alert->area_description,
                'alert_class' => $alert->alert_class,
                'broadcast_level' => $alert->broadcast_level,
                'cap_urgency' => $alert->cap_urgency,
                'cap_severity' => $alert->cap_severity,
                'cap_certainty' => $alert->cap_certainty,
                'source_url' => $alert->source_url,
                'polygon_coordinates' => $alert->polygon_coordinates,
                'raw_provenance' => $alert->raw_provenance,
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

    /**
     * List Verified Shelters and Assembly Points with geospatial filtering.
     */
    public function shelters(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => ['nullable', 'string', 'max:100'],
            'facility_type' => ['nullable', 'string', 'max:50'],
            'operational_status' => ['nullable', 'string', Rule::in(['open', 'standby', 'full', 'closed', 'all'])],
            'verification_status' => ['nullable', 'string', Rule::in(['VERIFIED', 'PENDING_VERIFICATION', 'INACTIVE', 'UNKNOWN', 'SIMULATED', 'all'])],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'wheelchair_accessible' => ['nullable', 'boolean'],
            'elderly_friendly' => ['nullable', 'boolean'],
            'has_sanitation' => ['nullable', 'boolean'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lon' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:0.1', 'max:500'],
            'format' => ['nullable', 'string', Rule::in(['json', 'geojson'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter filter shelter tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $hasCoords = $request->filled('lat') && $request->filled('lon');
        $lat = $hasCoords ? (float) $request->query('lat') : null;
        $lon = $hasCoords ? (float) $request->query('lon') : null;
        $radiusKm = $request->query('radius_km') ? (float) $request->query('radius_km') : null;

        $query = Shelter::query()->with('region:id,code,name,level');

        // Verification Status Filter: Default to VERIFIED for public safety unless 'all' or explicit requested
        $verStatus = $request->query('verification_status', 'VERIFIED');
        if ($verStatus !== 'all') {
            $query->where('verification_status', $verStatus);
        }

        // Operational Status Filter: Default to open/standby/full unless explicit
        if ($request->filled('operational_status') && $request->query('operational_status') !== 'all') {
            $query->where('operational_status', $request->query('operational_status'));
        }

        if ($request->filled('facility_type') && $request->query('facility_type') !== 'all') {
            $query->where('facility_type', $request->query('facility_type'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->query('region_id'));
        }

        if ($request->boolean('wheelchair_accessible')) {
            $query->where('wheelchair_accessible', true);
        }

        if ($request->boolean('elderly_friendly')) {
            $query->where('elderly_friendly', true);
        }

        if ($request->boolean('has_sanitation')) {
            $query->where('has_sanitation', true);
        }

        if ($request->filled('q')) {
            $search = '%' . strtolower($request->query('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(address) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(verified_by_agency) LIKE ?', [$search]);
            });
        }

        // Geospatial distance and radius filtering
        if ($hasCoords) {
            $query->select('shelters.*')
                ->selectRaw('
                    ST_Distance(
                        location::geography,
                        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
                    ) / 1000.0 AS distance_km
                ', [$lon, $lat]);

            if ($radiusKm !== null) {
                $query->whereRaw('
                    ST_DWithin(
                        location::geography,
                        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                        ?
                    )
                ', [$lon, $lat, $radiusKm * 1000]);
            }

            $query->orderBy('distance_km', 'asc');
        } else {
            $query->latest('verified_at')->latest('id');
        }

        $format = $request->query('format', 'json');

        if ($format === 'geojson') {
            $shelters = $query->take(200)->get();
            $features = $shelters->map(function ($s) {
                return [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [$s->longitude, $s->latitude],
                    ],
                    'properties' => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'facility_type' => $s->facility_type,
                        'address' => $s->address,
                        'region' => $s->region ? ['id' => $s->region->id, 'name' => $s->region->name] : null,
                        'capacity' => $s->capacity,
                        'current_occupancy' => $s->current_occupancy,
                        'occupancy_rate' => $s->capacity > 0 ? round(($s->current_occupancy / $s->capacity) * 100, 1) : 0,
                        'has_sanitation' => (bool) $s->has_sanitation,
                        'sanitation_details' => $s->sanitation_details,
                        'wheelchair_accessible' => (bool) $s->wheelchair_accessible,
                        'elderly_friendly' => (bool) $s->elderly_friendly,
                        'contact_person' => $s->contact_person,
                        'contact_phone' => $s->contact_phone,
                        'operational_status' => $s->operational_status,
                        'verification_status' => $s->verification_status,
                        'is_verified' => $s->verification_status === 'VERIFIED',
                        'verified_at' => $s->verified_at?->toIso8601String(),
                        'verified_by_agency' => $s->verified_by_agency,
                        'source_name' => $s->source_name,
                        'source_url' => $s->source_url,
                        'evacuation_route_info' => $s->evacuation_route_info,
                        'distance_km' => isset($s->distance_km) ? round((float) $s->distance_km, 2) : null,
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'type' => 'FeatureCollection',
                'features' => $features,
                'meta' => [
                    'total_features' => count($features),
                    'disclaimer' => 'Titik kumpul dan shelter berstatus VERIFIED adalah fasilitas resmi tervalidasi BPBD/BNPB. Rute evakuasi hanya ditampilkan jika telah memiliki penetapan resmi dari instansi berwenang.',
                ],
            ]);
        }

        $perPage = $request->integer('per_page', 20);
        $paginated = $query->paginate($perPage);

        $paginated->getCollection()->transform(function ($s) {
            $s->distance_km = isset($s->distance_km) ? round((float) $s->distance_km, 2) : null;
            $s->is_verified = $s->verification_status === 'VERIFIED';
            $s->occupancy_rate = $s->capacity > 0 ? round(($s->current_occupancy / $s->capacity) * 100, 1) : 0;
            return $s;
        });

        return response()->json([
            'success' => true,
            'data' => $paginated,
            'meta' => [
                'disclaimer' => 'Titik kumpul dan shelter berstatus VERIFIED adalah fasilitas resmi tervalidasi BPBD/BNPB. Rute evakuasi hanya ditampilkan jika telah memiliki penetapan resmi dari instansi berwenang.',
            ],
        ]);
    }

    /**
     * Single Shelter Detail with full provenance & evacuation guidance.
     */
    public function shelterDetail(int $id, Request $request): JsonResponse
    {
        $hasCoords = $request->filled('lat') && $request->filled('lon');
        $lat = $hasCoords ? (float) $request->query('lat') : null;
        $lon = $hasCoords ? (float) $request->query('lon') : null;

        $query = Shelter::query()->with(['region:id,code,name,level']);

        if ($hasCoords) {
            $query->select('shelters.*')
                ->selectRaw('
                    ST_Distance(
                        location::geography,
                        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
                    ) / 1000.0 AS distance_km
                ', [$lon, $lat]);
        }

        // Only return officially verified shelters for public safety
        $shelter = $query->where('verification_status', 'VERIFIED')->find($id);

        if (!$shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Fasilitas shelter resmi terverifikasi tidak ditemukan.',
            ], 404);
        }

        $data = $shelter->toArray();
        $data['distance_km'] = isset($shelter->distance_km) ? round((float) $shelter->distance_km, 2) : null;
        $data['is_verified'] = $shelter->verification_status === 'VERIFIED';
        $data['occupancy_rate'] = $shelter->capacity > 0 ? round(($shelter->current_occupancy / $shelter->capacity) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Submit a community disaster report publicly without requiring authentication (Emergency Zero-Barrier).
     * Automatically clusters with nearby reports and queues for verification.
     */
    public function submitReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'],
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:2000'],
            'latitude' => ['required', 'numeric', 'between:-11.5,6.5'],
            'longitude' => ['required', 'numeric', 'between:95.0,141.5'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'],
            'reporter_name' => ['nullable', 'string', 'max:100'],
            'reporter_contact' => ['nullable', 'string', 'max:100'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('community_reports', 'public');
        }

        // Optional authenticated user, otherwise null for guest
        $userId = $request->user('sanctum')?->id;
        $lat = (float) $validated['latitude'];
        $lon = (float) $validated['longitude'];

        $mediaData = [
            'reporter_name' => $validated['reporter_name'] ?? ($userId ? $request->user('sanctum')->name : 'Warga Anonim'),
            'reporter_contact' => $validated['reporter_contact'] ?? null,
            'source' => $userId ? 'authenticated_citizen' : 'zero_barrier_public',
        ];

        $reportId = DB::table('community_reports')->insertGetId([
            'user_id' => $userId,
            'hazard_type_id' => $validated['hazard_type_id'],
            'region_id' => $validated['region_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'photo_path' => $photoPath,
            'media' => json_encode($mediaData),
            'status' => 'pending',
            'location' => DB::raw("ST_SetSRID(ST_MakePoint({$lon}, {$lat}), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $report = CommunityReport::find($reportId);

        // Run deterministic spatiotemporal clustering analysis
        $clustering = $this->intelligenceService->analyzeAndClusterReport($report);

        return response()->json([
            'success' => true,
            'message' => 'Laporan kejadian bencana darurat berhasil dikirim tanpa hambatan dan masuk antrean verifikasi.',
            'data' => [
                'id' => $report->id,
                'tracking_code' => 'SVX-REP-' . str_pad((string)$report->id, 5, '0', STR_PAD_LEFT),
                'title' => $report->title,
                'status' => $report->status,
                'photo_url' => $photoPath ? Storage::disk('public')->url($photoPath) : null,
                'clustering' => $clustering,
                'created_at' => $report->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Publicly check status of a submitted report by ID.
     */
    public function checkReportStatus(string $id): JsonResponse
    {
        $numericId = is_numeric($id) ? (int) $id : (int) preg_replace('/[^0-9]/', '', $id);
        if ($numericId <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan bencana dengan ID atau kode pelacakan tersebut tidak ditemukan.',
            ], 404);
        }

        $report = CommunityReport::query()
            ->select([
                'id',
                'hazard_type_id',
                'region_id',
                'title',
                'description',
                'photo_path',
                'status',
                'created_at',
                'verified_at',
                'moderation_notes',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->with(['hazardType:id,slug,name,icon', 'region:id,code,name,level'])
            ->find($numericId);

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan bencana dengan ID tersebut tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $report->id,
                'tracking_code' => 'SVX-REP-' . str_pad((string)$report->id, 5, '0', STR_PAD_LEFT),
                'title' => $report->title,
                'description' => $report->description,
                'status' => $report->status,
                'hazard_type' => $report->hazardType,
                'region' => $report->region,
                'latitude' => $report->latitude,
                'longitude' => $report->longitude,
                'photo_url' => $report->photo_path ? Storage::disk('public')->url($report->photo_path) : null,
                'moderation_notes' => $report->status === 'rejected' ? $report->moderation_notes : null,
                'created_at' => $report->created_at->toIso8601String(),
                'verified_at' => $report->verified_at?->toIso8601String(),
            ],
        ]);
    }
}
