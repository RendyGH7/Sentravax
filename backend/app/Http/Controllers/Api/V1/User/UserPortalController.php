<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Region;
use App\Models\UserNotification;
use App\Models\UserSavedRegion;
use App\Services\Preparedness\PreparednessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserPortalController extends Controller
{
    public function __construct(
        protected PreparednessService $preparednessService
    ) {}

    /**
     * User Personal Dashboard Summary.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $preparedness = $this->preparednessService->getUserPreparednessOverview($user);

        // Fetch active alerts for user's saved regions
        $savedRegionIds = $user->savedRegions()->pluck('region_id');
        $regionalAlerts = Alert::where('status', 'active')
            ->whereIn('region_id', $savedRegionIds)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->with(['hazardType', 'region'])
            ->orderBy('starts_at', 'desc')
            ->take(5)
            ->get();

        // Unread notifications count
        $unreadCount = UserNotification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'preparedness_summary' => $preparedness['checklist_summary'],
                'saved_regions_count' => count($preparedness['saved_regions']),
                'emergency_contacts_count' => count($preparedness['contacts']),
                'active_regional_alerts' => $regionalAlerts,
                'unread_notifications_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * Get and Update User Profile.
     */
    public function profile(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user->update(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user,
        ]);
    }

    /**
     * Change authenticated user's account password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', Password::min(8), 'confirmed', 'different:current_password'],
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'current_password.current_password' => 'Kata sandi saat ini tidak cocok dengan data terdaftar.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal harus terdiri dari :min karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
            'password.different' => 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.',
        ]);

        DB::transaction(function () use ($user, $validated) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            // Security policy: Revoke all personal access tokens to disallow stale credentials on external devices
            $user->tokens()->delete();
        });

        // Sessional safeguard: Regenerate session ID only if request has an active web session
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi akun Anda berhasil diperbarui.',
        ]);
    }

    /**
     * List User Saved Regions.
     */
    public function savedRegions(Request $request): JsonResponse
    {
        $regions = $request->user()->savedRegions()->with('region')->get();

        return response()->json([
            'success' => true,
            'data' => $regions,
        ]);
    }

    /**
     * Save / Follow a Region.
     */
    public function saveRegion(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'label' => ['nullable', 'string', 'max:50'],
            'is_primary' => ['nullable', 'boolean'],
            'notify_alerts' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['is_primary'])) {
            UserSavedRegion::where('user_id', $user->id)->update(['is_primary' => false]);
        }

        $saved = UserSavedRegion::updateOrCreate(
            ['user_id' => $user->id, 'region_id' => $validated['region_id']],
            [
                'label' => $validated['label'] ?? 'Wilayah Pantauan',
                'is_primary' => $validated['is_primary'] ?? false,
                'notify_alerts' => $validated['notify_alerts'] ?? true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Wilayah berhasil disimpan ke daftar pantauan.',
            'data' => $saved->load('region'),
        ], 201);
    }

    /**
     * Delete Saved Region.
     */
    public function deleteSavedRegion(Request $request, int $id): JsonResponse
    {
        $saved = UserSavedRegion::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();
        $saved->delete();

        return response()->json([
            'success' => true,
            'message' => 'Wilayah berhasil dihapus dari daftar pantauan.',
        ]);
    }

    /**
     * List User Notifications.
     */
    public function notifications(Request $request): JsonResponse
    {
        $notifications = UserNotification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Mark Notification as Read.
     */
    public function markNotificationAsRead(Request $request, int $id): JsonResponse
    {
        $notif = UserNotification::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();
        $notif->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }

    /**
     * Mark All Notifications as Read.
     */
    public function markAllNotificationsAsRead(Request $request): JsonResponse
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Seluruh notifikasi ditandai telah dibaca.',
        ]);
    }
}
