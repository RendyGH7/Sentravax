<?php

namespace App\Services\Notification;

use App\Models\NotificationDeliveryLog;
use App\Models\UserNotification;

class NotificationDeduplicationService
{
    /**
     * Compute a deterministic event fingerprint.
     */
    public function generateFingerprint(string $category, string|int $entityId, ?string $materialKey = null): string
    {
        $payload = sprintf('%s:%s:%s', strtolower($category), (string) $entityId, (string) ($materialKey ?? 'base'));
        return hash('sha256', $payload);
    }

    /**
     * Check if the notification is a duplicate for the recipient.
     */
    public function isDuplicate(int $userId, string $fingerprint, int $cooldownMinutes = 240): bool
    {
        // 1. Direct fingerprint match in stored user notifications
        $existsInNotifications = UserNotification::where('user_id', $userId)
            ->where('event_fingerprint', $fingerprint)
            ->exists();

        if ($existsInNotifications) {
            return true;
        }

        // 2. Cooldown check in delivery logs within cooldown window
        $recentLog = NotificationDeliveryLog::where('user_id', $userId)
            ->where('event_fingerprint', $fingerprint)
            ->where('status', NotificationDeliveryLog::STATUS_DELIVERED)
            ->where('created_at', '>=', now()->subMinutes($cooldownMinutes))
            ->exists();

        return $recentLog;
    }

    /**
     * Check category and region-level cooldown for macro-broadcasts.
     */
    public function isUnderRegionalCooldown(int $userId, string $category, int $regionId, int $cooldownMinutes = 60): bool
    {
        return UserNotification::where('user_id', $userId)
            ->where('category', $category)
            ->where('payload->region_id', $regionId)
            ->where('created_at', '>=', now()->subMinutes($cooldownMinutes))
            ->exists();
    }
}
