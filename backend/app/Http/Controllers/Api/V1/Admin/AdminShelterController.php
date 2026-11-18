<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shelter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminShelterController extends Controller
{
    /**
     * List Shelters with filtering, search, and operational statistics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Shelter::query()->with(['region:id,code,name,level', 'creator:id,name', 'updater:id,name']);

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if ($request->filled('q')) {
            $search = '%' . strtolower($request->query('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(address) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(verified_by_agency) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(source_name) LIKE ?', [$search]);
            });
        }

        if ($request->filled('facility_type') && $request->query('facility_type') !== 'all') {
            $query->where('facility_type', $request->query('facility_type'));
        }

        if ($request->filled('operational_status') && $request->query('operational_status') !== 'all') {
            $query->where('operational_status', $request->query('operational_status'));
        }

        if ($request->filled('verification_status') && $request->query('verification_status') !== 'all') {
            $query->where('verification_status', $request->query('verification_status'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->query('region_id'));
        }

        $perPage = $request->integer('per_page', 15);
        $shelters = $query->latest('id')->paginate($perPage);

        // Calculate summary statistics for the admin dashboard
        $stats = [
            'total' => Shelter::count(),
            'verified' => Shelter::where('verification_status', 'VERIFIED')->count(),
            'pending' => Shelter::where('verification_status', 'PENDING_VERIFICATION')->count(),
            'open' => Shelter::where('operational_status', 'open')->count(),
            'full' => Shelter::where('operational_status', 'full')->count(),
            'standby' => Shelter::where('operational_status', 'standby')->count(),
            'closed' => Shelter::where('operational_status', 'closed')->count(),
            'total_capacity' => (int) Shelter::sum('capacity'),
            'total_occupancy' => (int) Shelter::sum('current_occupancy'),
        ];

        return response()->json([
            'success' => true,
            'data' => $shelters,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created shelter in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:200'],
            'facility_type' => ['required', 'string', Rule::in([
                'assembly_point', 'community_hall', 'stadium', 'school',
                'tent_camp', 'health_facility', 'government_office', 'other'
            ])],
            'address' => ['required', 'string', 'max:1000'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'current_occupancy' => ['nullable', 'integer', 'min:0'],
            'has_sanitation' => ['nullable', 'boolean'],
            'sanitation_details' => ['nullable', 'string', 'max:255'],
            'wheelchair_accessible' => ['nullable', 'boolean'],
            'elderly_friendly' => ['nullable', 'boolean'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'operational_status' => ['required', 'string', Rule::in(['open', 'full', 'closed', 'standby'])],
            'verification_status' => ['required', 'string', Rule::in([
                'VERIFIED', 'PENDING_VERIFICATION', 'INACTIVE', 'UNKNOWN', 'SIMULATED'
            ])],
            'verified_by_agency' => ['nullable', 'string', 'max:150'],
            'source_name' => ['nullable', 'string', 'max:150'],
            'source_url' => ['nullable', 'string', 'max:255'],
            'evacuation_route_info' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi data shelter gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $admin = $request->user();

        $verifiedAt = null;
        if ($validated['verification_status'] === 'VERIFIED') {
            $verifiedAt = now();
        }

        $provenance = [
            'created_by_user_id' => $admin?->id,
            'created_by_user_name' => $admin?->name,
            'created_at' => now()->toIso8601String(),
            'audit_history' => [
                [
                    'action' => 'CREATED',
                    'user_id' => $admin?->id,
                    'user_name' => $admin?->name,
                    'timestamp' => now()->toIso8601String(),
                    'verification_status' => $validated['verification_status'],
                    'operational_status' => $validated['operational_status'],
                ]
            ],
        ];

        $shelter = Shelter::create([
            ...$validated,
            'verified_at' => $verifiedAt,
            'created_by' => $admin?->id,
            'updated_by' => $admin?->id,
            'provenance_metadata' => $provenance,
        ]);

        Log::info("[AUDIT_LOG] Admin [{$admin?->name} (#{$admin?->id})] created shelter [{$shelter->name} (#{$shelter->id})].");

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas shelter berhasil ditambahkan ke dalam registry.',
            'data' => $shelter->load('region:id,code,name,level'),
        ], 201);
    }

    /**
     * Show single shelter details.
     */
    public function show(int $id): JsonResponse
    {
        $shelter = Shelter::withTrashed()
            ->with(['region:id,code,name,level', 'creator:id,name', 'updater:id,name'])
            ->find($id);

        if (!$shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Shelter tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $shelter,
        ]);
    }

    /**
     * Update shelter details while maintaining complete audit history.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $shelter = Shelter::withTrashed()->find($id);
        if (!$shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Shelter tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'facility_type' => ['sometimes', 'required', 'string', Rule::in([
                'assembly_point', 'community_hall', 'stadium', 'school',
                'tent_camp', 'health_facility', 'government_office', 'other'
            ])],
            'address' => ['sometimes', 'required', 'string', 'max:1000'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'latitude' => ['sometimes', 'required', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'required', 'numeric', 'between:-180,180'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'current_occupancy' => ['nullable', 'integer', 'min:0'],
            'has_sanitation' => ['nullable', 'boolean'],
            'sanitation_details' => ['nullable', 'string', 'max:255'],
            'wheelchair_accessible' => ['nullable', 'boolean'],
            'elderly_friendly' => ['nullable', 'boolean'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'operational_status' => ['sometimes', 'required', 'string', Rule::in(['open', 'full', 'closed', 'standby'])],
            'verification_status' => ['sometimes', 'required', 'string', Rule::in([
                'VERIFIED', 'PENDING_VERIFICATION', 'INACTIVE', 'UNKNOWN', 'SIMULATED'
            ])],
            'verified_by_agency' => ['nullable', 'string', 'max:150'],
            'source_name' => ['nullable', 'string', 'max:150'],
            'source_url' => ['nullable', 'string', 'max:255'],
            'evacuation_route_info' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi pembaruan shelter gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $admin = $request->user();
        $validated = $validator->validated();

        // Capture previous state for audit log
        $oldVerification = $shelter->verification_status;
        $newVerification = $validated['verification_status'] ?? $oldVerification;

        $verifiedAt = $shelter->verified_at;
        if ($newVerification === 'VERIFIED' && $oldVerification !== 'VERIFIED') {
            $verifiedAt = now();
        }

        $provenance = $shelter->provenance_metadata ?? [];
        $history = $provenance['audit_history'] ?? [];
        $history[] = [
            'action' => 'UPDATED',
            'user_id' => $admin?->id,
            'user_name' => $admin?->name,
            'timestamp' => now()->toIso8601String(),
            'changed_fields' => array_keys($validated),
            'old_status' => [
                'operational' => $shelter->operational_status,
                'verification' => $shelter->verification_status,
            ],
            'new_status' => [
                'operational' => $validated['operational_status'] ?? $shelter->operational_status,
                'verification' => $newVerification,
            ],
        ];
        $provenance['audit_history'] = $history;
        $provenance['last_updated_by'] = $admin?->name;
        $provenance['last_updated_at'] = now()->toIso8601String();

        $shelter->update([
            ...$validated,
            'verified_at' => $verifiedAt,
            'updated_by' => $admin?->id,
            'provenance_metadata' => $provenance,
        ]);

        Log::info("[AUDIT_LOG] Admin [{$admin?->name} (#{$admin?->id})] updated shelter [{$shelter->name} (#{$shelter->id})].");

        return response()->json([
            'success' => true,
            'message' => 'Informasi shelter berhasil diperbarui.',
            'data' => $shelter->fresh()->load('region:id,code,name,level'),
        ]);
    }

    /**
     * Quick status update (Operational Status & Verification Status).
     */
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $shelter = Shelter::withTrashed()->find($id);
        if (!$shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Shelter tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'operational_status' => ['nullable', 'string', Rule::in(['open', 'full', 'closed', 'standby'])],
            'verification_status' => ['nullable', 'string', Rule::in([
                'VERIFIED', 'PENDING_VERIFICATION', 'INACTIVE', 'UNKNOWN', 'SIMULATED'
            ])],
            'current_occupancy' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Data status tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $admin = $request->user();
        $validated = $validator->validated();

        $updateData = ['updated_by' => $admin?->id];

        if (isset($validated['operational_status'])) {
            $updateData['operational_status'] = $validated['operational_status'];
        }

        if (isset($validated['current_occupancy'])) {
            $updateData['current_occupancy'] = $validated['current_occupancy'];
        }

        if (isset($validated['verification_status'])) {
            $updateData['verification_status'] = $validated['verification_status'];
            if ($validated['verification_status'] === 'VERIFIED' && $shelter->verification_status !== 'VERIFIED') {
                $updateData['verified_at'] = now();
            }
        }

        $provenance = $shelter->provenance_metadata ?? [];
        $history = $provenance['audit_history'] ?? [];
        $history[] = [
            'action' => 'STATUS_CHANGE',
            'user_id' => $admin?->id,
            'user_name' => $admin?->name,
            'timestamp' => now()->toIso8601String(),
            'notes' => $validated['notes'] ?? null,
            'previous' => [
                'operational' => $shelter->operational_status,
                'verification' => $shelter->verification_status,
                'occupancy' => $shelter->current_occupancy,
            ],
            'updated' => $updateData,
        ];
        $provenance['audit_history'] = $history;
        $updateData['provenance_metadata'] = $provenance;

        $shelter->update($updateData);

        Log::info("[AUDIT_LOG] Admin [{$admin?->name} (#{$admin?->id})] changed status for shelter [{$shelter->name} (#{$shelter->id})].");

        return response()->json([
            'success' => true,
            'message' => 'Status operasional dan verifikasi shelter berhasil diperbarui.',
            'data' => $shelter->fresh(),
        ]);
    }

    /**
     * Soft-deactivate shelter (never permanently delete history that was visible to the public).
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $shelter = Shelter::find($id);
        if (!$shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Shelter tidak ditemukan atau sudah dinonaktifkan.',
            ], 404);
        }

        $admin = $request->user();

        // Mark inactive and record deletion in provenance before soft delete
        $provenance = $shelter->provenance_metadata ?? [];
        $history = $provenance['audit_history'] ?? [];
        $history[] = [
            'action' => 'DEACTIVATED_AND_ARCHIVED',
            'user_id' => $admin?->id,
            'user_name' => $admin?->name,
            'timestamp' => now()->toIso8601String(),
        ];
        $provenance['audit_history'] = $history;

        $shelter->update([
            'operational_status' => 'closed',
            'verification_status' => 'INACTIVE',
            'updated_by' => $admin?->id,
            'provenance_metadata' => $provenance,
        ]);

        $shelter->delete();

        Log::info("[AUDIT_LOG] Admin [{$admin?->name} (#{$admin?->id})] soft-deactivated and archived shelter [{$shelter->name} (#{$shelter->id})].");

        return response()->json([
            'success' => true,
            'message' => 'Shelter berhasil dinonaktifkan dan diarsipkan tanpa menghapus histori publik.',
        ]);
    }
}
