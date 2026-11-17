<?php

namespace App\Services\Notification;

use App\Models\User;
use App\Models\UserNotificationPreference;

class NotificationPreferenceService
{
    protected const URGENCY_WEIGHTS = [
        'info' => 1,
        'low' => 2,
        'advisory' => 3,
        'medium' => 3,
        'watch' => 4,
        'high' => 4,
        'warning' => 5,
        'critical' => 5,
    ];

    /**
     * Check if a notification should be delivered based on recipient preferences.
     */
    public function shouldDeliver(User $user, string $category, string $urgency = 'info'): bool
    {
        $pref = $user->notificationPreference ?? UserNotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            UserNotificationPreference::defaultValues($user->id)
        );

        if (!$pref->in_app_enabled) {
            return false;
        }

        // 1. Category check
        $categoryAllowed = match ($category) {
            'ai_insight' => $pref->enable_ai_insights,
            'official_warning' => $pref->enable_official_warnings,
            'report_status' => $pref->enable_report_status,
            'disaster_alert' => $pref->enable_disaster_alerts,
            'system' => $pref->enable_system,
            default => true,
        };

        if (!$categoryAllowed) {
            return false;
        }

        // 2. Urgency check
        $itemWeight = self::URGENCY_WEIGHTS[strtolower($urgency)] ?? 1;
        $minWeight = self::URGENCY_WEIGHTS[strtolower($pref->min_urgency ?? 'info')] ?? 1;

        return $itemWeight >= $minWeight;
    }

    /**
     * Retrieve user preferences or default values.
     *
     * @return array<string, mixed>
     */
    public function getUserPreferences(User $user): array
    {
        $pref = UserNotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            UserNotificationPreference::defaultValues($user->id)
        );

        return [
            'enable_ai_insights' => (bool) $pref->enable_ai_insights,
            'enable_official_warnings' => (bool) $pref->enable_official_warnings,
            'enable_report_status' => (bool) $pref->enable_report_status,
            'enable_disaster_alerts' => (bool) $pref->enable_disaster_alerts,
            'enable_system' => (bool) $pref->enable_system,
            'min_urgency' => $pref->min_urgency ?? 'info',
            'in_app_enabled' => (bool) $pref->in_app_enabled,
            'updated_at' => $pref->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Update user preferences.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function updateUserPreferences(User $user, array $data): array
    {
        $pref = UserNotificationPreference::updateOrCreate(
            ['user_id' => $user->id],
            [
                'enable_ai_insights' => $data['enable_ai_insights'] ?? true,
                'enable_official_warnings' => $data['enable_official_warnings'] ?? true,
                'enable_report_status' => $data['enable_report_status'] ?? true,
                'enable_disaster_alerts' => $data['enable_disaster_alerts'] ?? true,
                'enable_system' => $data['enable_system'] ?? true,
                'min_urgency' => strtolower($data['min_urgency'] ?? 'info'),
                'in_app_enabled' => $data['in_app_enabled'] ?? true,
            ]
        );

        return $this->getUserPreferences($user);
    }
}
