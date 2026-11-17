<?php

namespace App\Services\Notification;

use App\Models\NotificationDeliveryLog;

class NotificationDeliveryService
{
    /**
     * Record a delivery attempt or suppression in the audit log.
     *
     * @param array<string, mixed> $metadata
     */
    public function recordLog(
        int $userId,
        ?int $notificationId,
        string $status,
        ?string $fingerprint,
        ?string $category = null,
        ?string $urgency = null,
        ?string $reason = null,
        array $metadata = []
    ): NotificationDeliveryLog {
        return NotificationDeliveryLog::create([
            'user_id' => $userId,
            'notification_id' => $notificationId,
            'channel' => 'in_app',
            'status' => $status,
            'category' => $category,
            'urgency' => $urgency,
            'event_fingerprint' => $fingerprint,
            'reason' => $reason,
            'metadata' => $metadata,
        ]);
    }
}
