<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Models\CommunityReport;
use App\Services\Intelligence\IntelligenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserReportController extends Controller
{
    public function __construct(
        protected IntelligenceService $intelligenceService
    ) {}

    /**
     * Get list of community reports submitted by the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

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
                'verified_at',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->where('user_id', $user->id)
            ->with(['hazardType:id,slug,name,icon', 'region:id,code,name,level'])
            ->latest();

        if ($request->has('status') && in_array($request->query('status'), ['pending', 'verified', 'rejected'])) {
            $query->where('status', $request->query('status'));
        }

        $reports = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar laporan warga berhasil dimuat.',
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
     * Get details of a single report owned by the authenticated user.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $report = CommunityReport::query()
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
                'moderation_notes',
                'verified_by',
                'verified_at',
                'created_at',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->with([
                'hazardType:id,slug,name,icon',
                'region:id,code,name,level',
                'verifications.verifier:id,name,role',
            ])
            ->first();

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan bencana tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail laporan warga berhasil dimuat.',
            'data' => $report,
        ]);
    }

    /**
     * Submit a new citizen community disaster report.
     * Enriched with PostGIS coordinates and AI clustering analysis.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'],
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:2000'],
            'latitude' => ['required', 'numeric', 'between:-11.5,6.5'],
            'longitude' => ['required', 'numeric', 'between:95.0,141.5'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'], // max 5MB image
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('community_reports', 'public');
        }

        $user = $request->user();
        $lat = (float) $validated['latitude'];
        $lon = (float) $validated['longitude'];

        // PostGIS point geometry insertion
        $reportId = DB::table('community_reports')->insertGetId([
            'user_id' => $user->id,
            'hazard_type_id' => $validated['hazard_type_id'],
            'region_id' => $validated['region_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'photo_path' => $photoPath,
            'status' => 'pending',
            'location' => DB::raw("ST_SetSRID(ST_MakePoint({$lon}, {$lat}), 4326)"),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $report = CommunityReport::find($reportId);

        // Run deterministic AI clustering analysis (detect spatiotemporal duplicate cluster)
        $clustering = $this->intelligenceService->analyzeAndClusterReport($report);

        return response()->json([
            'success' => true,
            'message' => 'Laporan kejadian bencana berhasil dikirim dan masuk dalam antrean verifikasi.',
            'data' => [
                'id' => $report->id,
                'title' => $report->title,
                'status' => $report->status,
                'photo_url' => $photoPath ? Storage::disk('public')->url($photoPath) : null,
                'clustering' => $clustering,
                'created_at' => $report->created_at->toIso8601String(),
            ],
        ], 201);
    }
}
