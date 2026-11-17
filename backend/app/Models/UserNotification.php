<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserNotification extends Model
{
    protected $table = 'user_notifications';

    public const CATEGORY_AI_INSIGHT = 'ai_insight';
    public const CATEGORY_OFFICIAL_WARNING = 'official_warning';
    public const CATEGORY_REPORT_STATUS = 'report_status';
    public const CATEGORY_DISASTER_ALERT = 'disaster_alert';
    public const CATEGORY_SYSTEM = 'system';

    public const URGENCY_CRITICAL = 'critical';
    public const URGENCY_HIGH = 'high';
    public const URGENCY_MEDIUM = 'medium';
    public const URGENCY_LOW = 'low';
    public const URGENCY_INFO = 'info';

    protected $fillable = [
        'user_id',
        'alert_id',
        'title',
        'body',
        'type',
        'category',
        'urgency',
        'related_type',
        'related_id',
        'event_fingerprint',
        'read_at',
        'expires_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'expires_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class, 'alert_id');
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(NotificationDeliveryLog::class, 'notification_id');
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead(Builder $query): Builder
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function markAsRead(): bool
    {
        if ($this->read_at === null) {
            return $this->update(['read_at' => now()]);
        }
        return true;
    }
}
