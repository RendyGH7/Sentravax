<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    protected $table = 'user_notifications';

    protected $fillable = [
        'user_id',
        'alert_id',
        'title',
        'body',
        'type',
        'read_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
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
}
