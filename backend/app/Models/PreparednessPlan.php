<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreparednessPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'primary_meeting_point',
        'secondary_meeting_point',
        'evacuation_notes',
        'custom_provisions',
    ];

    protected $casts = [
        'custom_provisions' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

