<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationDeliveryLog extends Model
{
    protected $table = 'notification_delivery_logs';

    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_DEDUPLICATED = 'deduplicated';
    public const STATUS_PREFERENCE_FILTERED = 'preference_filtered';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'notification_id',
        'channel',
        'status',
        'category',
        'urgency',
        'event_fingerprint',
        'reason',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function notification(): BelongsTo
    {
        return $this->belongsTo(UserNotification::class, 'notification_id');
    }
}
