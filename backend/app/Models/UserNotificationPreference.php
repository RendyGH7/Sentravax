<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationPreference extends Model
{
    protected $table = 'user_notification_preferences';

    protected $fillable = [
        'user_id',
        'enable_ai_insights',
        'enable_official_warnings',
        'enable_report_status',
        'enable_disaster_alerts',
        'enable_system',
        'min_urgency',
        'in_app_enabled',
    ];

    protected function casts(): array
    {
        return [
            'enable_ai_insights' => 'boolean',
            'enable_official_warnings' => 'boolean',
            'enable_report_status' => 'boolean',
            'enable_disaster_alerts' => 'boolean',
            'enable_system' => 'boolean',
            'in_app_enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get default safe preferences for a user.
     *
     * @return array<string, mixed>
     */
    public static function defaultValues(int $userId): array
    {
        return [
            'user_id' => $userId,
            'enable_ai_insights' => true,
            'enable_official_warnings' => true,
            'enable_report_status' => true,
            'enable_disaster_alerts' => true,
            'enable_system' => true,
            'min_urgency' => 'info',
            'in_app_enabled' => true,
        ];
    }
}
