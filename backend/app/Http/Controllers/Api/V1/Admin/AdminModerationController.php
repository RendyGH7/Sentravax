<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommunityReport;
use App\Models\ReportVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminModerationController extends Controller
{
    /**
     * List community reports for administrative curation and moderation.
     */
    public function index(Request $request): JsonResponse
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
                'verified_by',
                'verified_at',
                'created_at',
                DB::raw('ST_Y(location) as latitude'),
                DB::raw('ST_X(location) as longitude'),
            ])
            ->with([
                'hazardType:id,slug,name,icon',
                'region:id,code,name,level',
                'user:id,name,email',
                'verifier:id,name',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('hazard_type_id')) {
            $query->where('hazard_type_id', $request->query('hazard_type_id'));
        }

        if ($request->filled('cluster_id')) {
            $query->where('cluster_id', $request->query('cluster_id'));
        }

        $reports = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar moderasi laporan warga berhasil dimuat.',
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
     * Get detail of a specific citizen disaster report with audit trail.
     */
    public function show(int $id): JsonResponse
    {
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
            ->with([
                'hazardType',
                'region',
                'user:id,name,email,phone',
                'verifier:id,name,role',
                'verifications.verifier:id,name,role',
            ])
            ->find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan bencana tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail laporan moderasi berhasil dimuat.',
            'data' => $report,
        ]);
    }

    /**
     * Approve or reject a citizen disaster report.
     * Writes to audit trail `report_verifications`.
     */
    public function verify(Request $request, int $id): JsonResponse
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

        $admin = $request->user();

        $previousStatus = $report->status;

        // Update the report
        $report->status = $validated['status'];
        $report->verified_by = $admin->id;
        $report->verified_at = now();
        $report->moderation_notes = $validated['notes'] ?? null;
        $report->save();

        // Record immutable audit verification trail
        ReportVerification::create([
            'community_report_id' => $report->id,
            'verified_by' => $admin->id,
            'previous_status' => $previousStatus,
            'new_status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Laporan #{$report->id} berhasil diubah statusnya menjadi '{$report->status}'.",
            'data' => [
                'id' => $report->id,
                'status' => $report->status,
                'verified_by' => $admin->name,
                'verified_at' => $report->verified_at->toIso8601String(),
                'moderation_notes' => $report->moderation_notes,
            ],
        ]);
    }

    /**
     * Delete report (spam / offensive submission).
     */
    public function destroy(int $id): JsonResponse
    {
        $report = CommunityReport::find($id);

        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan bencana tidak ditemukan.',
            ], 404);
        }

        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Laporan warga berhasil dihapus.',
        ]);
    }
}
