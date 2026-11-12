<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserHazardPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hazard_type_id',
        'min_severity',
        'in_app_notify',
    ];

    protected $casts = [
        'in_app_notify' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class);
    }
}

