<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    protected $table = 'alerts';

    protected $fillable = [
        'hazard_event_id',
        'created_by',
        'title',
        'message',
        'alert_class',
        'broadcast_level',
        'status',
        'starts_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function hazardEvent(): BelongsTo
    {
        return $this->belongsTo(HazardEvent::class, 'hazard_event_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function userNotifications(): HasMany
    {
        return $this->hasMany(UserNotification::class, 'alert_id');
    }
}
