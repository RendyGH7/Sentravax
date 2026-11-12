<?php

namespace App\Services\Notification;

use App\Models\Alert;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\UserSavedRegion;

class NotificationService
{
    /**
     * Distribute notifications to users who have saved the region of the alert.
     */
    public function distributeAlertNotifications(Alert $alert): int
    {
        if (!$alert->region_id) {
            return 0;
        }

        // Find users monitoring this region
        $targetUserIds = UserSavedRegion::where('region_id', $alert->region_id)
            ->where('notify_alerts', true)
            ->pluck('user_id')
            ->unique();

        $deliveredCount = 0;

        foreach ($targetUserIds as $userId) {
            // Deduplication & Cooldown check:
            // Do not send if an alert with identical title was already delivered within 4 hours
            $alreadySent = UserNotification::where('user_id', $userId)
                ->where('title', $alert->title)
                ->where('created_at', '>=', now()->subHours(4))
                ->exists();

            if (!$alreadySent) {
                UserNotification::create([
                    'user_id' => $userId,
                    'title' => $alert->title,
                    'message' => $alert->message,
                    'type' => $alert->broadcast_level, // advisory, watch, warning
                    'is_read' => false,
                    'data' => [
                        'alert_id' => $alert->id,
                        'alert_class' => $alert->alert_class,
                        'region_id' => $alert->region_id,
                        'hazard_type_id' => $alert->hazard_type_id,
                    ],
                ]);
                $deliveredCount++;
            }
        }

        return $deliveredCount;
    }
}

