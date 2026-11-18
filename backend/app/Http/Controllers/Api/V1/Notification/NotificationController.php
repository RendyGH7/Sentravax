<?php

namespace App\Http\Controllers\Api\V1\Notification;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use App\Services\Notification\NotificationPreferenceService;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService,
        protected NotificationPreferenceService $preferenceService
    ) {}

    /**
     * List in-app notifications for authenticated user with filters & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['all', 'read', 'unread'])],
            'category' => ['nullable', 'string'],
            'urgency' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = UserNotification::where('user_id', $user->id)
            ->active()
            ->latest('created_at');

        // Filter by read/unread status
        $status = $validated['status'] ?? 'all';
        if ($status === 'unread') {
            $query->unread();
        } elseif ($status === 'read') {
            $query->read();
        }

        // Filter by category
        if (!empty($validated['category']) && $validated['category'] !== 'all') {
            $query->where('category', $validated['category']);
        }

        // Filter by urgency with canonical mapping compatibility
        if (!empty($validated['urgency']) && $validated['urgency'] !== 'all') {
            $urgencyValue = strtolower(trim($validated['urgency']));
            $mappedUrgencies = match ($urgencyValue) {
                'warning', 'critical' => ['critical', 'warning'],
                'watch', 'high' => ['high', 'watch'],
                'advisory', 'medium' => ['medium', 'advisory'],
                'low' => ['low'],
                default => [$urgencyValue],
            };
            $query->whereIn('urgency', $mappedUrgencies);
        }

        $perPage = (int) ($validated['per_page'] ?? 15);
        $paginator = $query->paginate($perPage);

        $unreadCount = UserNotification::where('user_id', $user->id)
            ->active()
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Daftar notifikasi pengguna berhasil dimuat.',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * Get single notification detail (strictly belonging to authenticated user).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = UserNotification::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail notifikasi berhasil dimuat.',
            'data' => $notification,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notification = UserNotification::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
        }

        $notification->markAsRead();

        $remainingUnread = UserNotification::where('user_id', $user->id)
            ->active()
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil ditandai telah dibaca.',
            'data' => [
                'id' => $notification->id,
                'read_at' => $notification->read_at?->toIso8601String(),
                'unread_count' => $remainingUnread,
            ],
        ]);
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $updatedCount = UserNotification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Seluruh notifikasi berhasil ditandai telah dibaca.',
            'data' => [
                'marked_count' => $updatedCount,
                'unread_count' => 0,
            ],
        ]);
    }

    /**
     * Get user notification preferences.
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        $preferences = $this->preferenceService->getUserPreferences($user);

        return response()->json([
            'success' => true,
            'message' => 'Preferensi notifikasi pengguna berhasil dimuat.',
            'data' => $preferences,
        ]);
    }

    /**
     * Update user notification preferences.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'enable_ai_insights' => ['nullable', 'boolean'],
            'enable_official_warnings' => ['nullable', 'boolean'],
            'enable_report_status' => ['nullable', 'boolean'],
            'enable_disaster_alerts' => ['nullable', 'boolean'],
            'enable_system' => ['nullable', 'boolean'],
            'min_urgency' => ['nullable', 'string', Rule::in(['info', 'advisory', 'watch', 'warning', 'low', 'medium', 'high', 'critical'])],
            'in_app_enabled' => ['nullable', 'boolean'],
        ]);

        $updated = $this->preferenceService->updateUserPreferences($user, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Preferensi notifikasi berhasil diperbarui.',
            'data' => $updated,
        ]);
    }
}
