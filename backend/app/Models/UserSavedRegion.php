<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSavedRegion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'region_id',
        'label',
        'is_primary',
        'notify_alerts',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'notify_alerts' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }
}

