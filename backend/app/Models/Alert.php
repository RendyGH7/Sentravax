<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    protected $table = 'alerts';

    protected $fillable = [
        'external_identifier',
        'hazard_event_id',
        'region_id',
        'hazard_type_id',
        'created_by',
        'title',
        'sender_name',
        'message',
        'instruction',
        'area_description',
        'alert_class',
        'broadcast_level',
        'cap_urgency',
        'cap_severity',
        'cap_certainty',
        'source_url',
        'polygon_coordinates',
        'raw_provenance',
        'status',
        'starts_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'raw_provenance' => 'array',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')
            ->orWhere(function ($q) {
                $q->whereNotNull('expires_at')->where('expires_at', '<=', now());
            });
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class, 'hazard_type_id');
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
