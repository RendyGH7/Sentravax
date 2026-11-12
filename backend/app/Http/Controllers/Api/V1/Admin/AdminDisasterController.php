<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\EducationContent;
use App\Models\HazardEvent;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminDisasterController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    // ==========================================
    // 1. HAZARD EVENTS MANAGEMENT
    // ==========================================

    public function listEvents(Request $request): JsonResponse
    {
        $query = HazardEvent::query()
            ->select([
                'id',
                'region_id',
                'hazard_type_id',
                'data_source_id',
                'external_id',
                'title',
                'description',
                'severity',
                'status',
                'occurred_at',
                'reported_at',
                'created_at',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->with(['hazardType:id,slug,name,icon', 'region:id,code,name,level', 'dataSource:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('hazard_type_id')) {
            $query->where('hazard_type_id', $request->query('hazard_type_id'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->query('region_id'));
        }

        $events = $query->latest('occurred_at')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar kejadian bencana terkurasi berhasil dimuat.',
            'data' => $events->items(),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    public function showEvent(int $id): JsonResponse
    {
        $event = HazardEvent::query()
            ->select([
                'id',
                'region_id',
                'hazard_type_id',
                'data_source_id',
                'external_id',
                'title',
                'description',
                'severity',
                'status',
                'occurred_at',
                'reported_at',
                'source_metadata',
                'created_at',
                'updated_at',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->with(['hazardType', 'region', 'dataSource', 'alerts', 'riskAssessments'])
            ->find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Kejadian bencana tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail kejadian bencana berhasil dimuat.',
            'data' => $event,
        ]);
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'],
            'data_source_id' => ['nullable', 'integer', 'exists:data_sources,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'severity' => ['required', 'string', Rule::in(['minor', 'moderate', 'severe', 'extreme'])],
            'status' => ['required', 'string', Rule::in(['active', 'contained', 'resolved'])],
            'latitude' => ['required', 'numeric', 'between:-11.5,6.5'],
            'longitude' => ['required', 'numeric', 'between:95.0,141.5'],
            'occurred_at' => ['required', 'date'],
            'source_metadata' => ['nullable', 'array'],
        ]);

        $lat = (float) $validated['latitude'];
        $lon = (float) $validated['longitude'];

        $dataSourceId = $validated['data_source_id'] ?? (\App\Models\DataSource::first()?->id ?? 1);

        $eventId = DB::table('hazard_events')->insertGetId([
            'region_id' => $validated['region_id'],
            'hazard_type_id' => $validated['hazard_type_id'],
            'data_source_id' => $dataSourceId,
            'external_id' => 'MANUAL-' . strtoupper(Str::random(8)),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'severity' => $validated['severity'],
            'status' => $validated['status'],
            'location' => DB::raw("ST_SetSRID(ST_MakePoint({$lon}, {$lat}), 4326)"),
            'occurred_at' => $validated['occurred_at'],
            'reported_at' => now(),
            'source_metadata' => json_encode($validated['source_metadata'] ?? ['curated_by' => 'admin']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $event = HazardEvent::with(['hazardType', 'region'])->find($eventId);

        return response()->json([
            'success' => true,
            'message' => 'Kejadian bencana resmi berhasil ditambahkan.',
            'data' => $event,
        ], 201);
    }

    public function updateEvent(Request $request, int $id): JsonResponse
    {
        $event = HazardEvent::find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Kejadian bencana tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'severity' => ['sometimes', 'string', Rule::in(['minor', 'moderate', 'severe', 'extreme'])],
            'status' => ['sometimes', 'string', Rule::in(['active', 'contained', 'resolved'])],
            'latitude' => ['sometimes', 'numeric', 'between:-11.5,6.5'],
            'longitude' => ['sometimes', 'numeric', 'between:95.0,141.5'],
            'occurred_at' => ['sometimes', 'date'],
        ]);

        if (isset($validated['title'])) $event->title = $validated['title'];
        if (array_key_exists('description', $validated)) $event->description = $validated['description'];
        if (isset($validated['severity'])) $event->severity = $validated['severity'];
        if (isset($validated['status'])) $event->status = $validated['status'];
        if (isset($validated['occurred_at'])) $event->occurred_at = $validated['occurred_at'];

        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $lat = (float) $validated['latitude'];
            $lon = (float) $validated['longitude'];
            DB::statement(
                'UPDATE hazard_events SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326), updated_at = NOW() WHERE id = ?',
                [$lon, $lat, $event->id]
            );
        }

        $event->save();

        return response()->json([
            'success' => true,
            'message' => 'Kejadian bencana berhasil diperbarui.',
            'data' => $event->fresh(['hazardType', 'region']),
        ]);
    }

    public function destroyEvent(int $id): JsonResponse
    {
        $event = HazardEvent::find($id);

        if (! $event) {
            return response()->json([
                'success' => false,
                'message' => 'Kejadian bencana tidak ditemukan.',
            ], 404);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kejadian bencana berhasil dihapus.',
        ]);
    }

    // ==========================================
    // 2. CAP DISASTER ALERTS MANAGEMENT
    // ==========================================

    public function listAlerts(Request $request): JsonResponse
    {
        $query = Alert::query()
            ->with(['hazardType:id,slug,name,icon', 'region:id,code,name,level', 'hazardEvent:id,title', 'creator:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $alerts = $query->latest('starts_at')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar peringatan dini berhasil dimuat.',
            'data' => $alerts->items(),
            'meta' => [
                'current_page' => $alerts->currentPage(),
                'last_page' => $alerts->lastPage(),
                'per_page' => $alerts->perPage(),
                'total' => $alerts->total(),
            ],
        ]);
    }

    public function showAlert(int $id): JsonResponse
    {
        $alert = Alert::with(['hazardType', 'region', 'hazardEvent', 'creator'])->find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Peringatan dini tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail peringatan dini berhasil dimuat.',
            'data' => $alert,
        ]);
    }

    public function storeAlert(Request $request): JsonResponse
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

        // Automatically disseminate targeted notifications to registered citizens in the region
        $distributedCount = $this->notificationService->distributeAlertNotifications($alert);

        return response()->json([
            'success' => true,
            'message' => "Peringatan dini berhasil diterbitkan dan disebarkan ke {$distributedCount} warga terdaftar.",
            'data' => $alert->load(['hazardType', 'region']),
        ], 201);
    }

    public function updateAlert(Request $request, int $id): JsonResponse
    {
        $alert = Alert::find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Peringatan dini tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'message' => ['sometimes', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'cancelled', 'expired'])],
            'expires_at' => ['sometimes', 'date'],
        ]);

        $alert->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Peringatan dini berhasil diperbarui.',
            'data' => $alert->fresh(['hazardType', 'region']),
        ]);
    }

    public function destroyAlert(int $id): JsonResponse
    {
        $alert = Alert::find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Peringatan dini tidak ditemukan.',
            ], 404);
        }

        $alert->delete();

        return response()->json([
            'success' => true,
            'message' => 'Peringatan dini berhasil dihapus.',
        ]);
    }

    // ==========================================
    // 3. EDUCATION MITIGATION MANAGEMENT
    // ==========================================

    public function listEducation(Request $request): JsonResponse
    {
        $query = EducationContent::with('hazardType:id,slug,name');

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $articles = $query->orderBy('sort_order')->latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar konten edukasi berhasil dimuat.',
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    public function storeEducation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hazard_type_id' => ['nullable', 'integer', 'exists:hazard_types,id'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(['mitigation', 'preparedness', 'response', 'recovery'])],
            'summary' => ['required', 'string', 'max:500'],
            'content_body' => ['required', 'string'],
            'content_type' => ['nullable', 'string', Rule::in(['article', 'guide', 'infographic', 'video'])],
            'is_published' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $article = EducationContent::create([
            'hazard_type_id' => $validated['hazard_type_id'] ?? null,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
            'category' => $validated['category'],
            'summary' => $validated['summary'],
            'content_body' => $validated['content_body'],
            'content_type' => $validated['content_type'] ?? 'guide',
            'is_published' => $validated['is_published'] ?? true,
            'published_at' => ($validated['is_published'] ?? true) ? now() : null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Panduan edukasi mitigasi berhasil dibuat.',
            'data' => $article->load('hazardType'),
        ], 201);
    }

    public function updateEducation(Request $request, int $id): JsonResponse
    {
        $article = EducationContent::find($id);

        if (! $article) {
            return response()->json([
                'success' => false,
                'message' => 'Konten edukasi tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'summary' => ['sometimes', 'string', 'max:500'],
            'content_body' => ['sometimes', 'string'],
            'category' => ['sometimes', 'string', Rule::in(['mitigation', 'preparedness', 'response', 'recovery'])],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['is_published']) && $validated['is_published'] && ! $article->published_at) {
            $article->published_at = now();
        }

        $article->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Konten edukasi berhasil diperbarui.',
            'data' => $article->fresh('hazardType'),
        ]);
    }

    public function destroyEducation(int $id): JsonResponse
    {
        $article = EducationContent::find($id);

        if (! $article) {
            return response()->json([
                'success' => false,
                'message' => 'Konten edukasi tidak ditemukan.',
            ], 404);
        }

        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'Konten edukasi berhasil dihapus.',
        ]);
    }
}
