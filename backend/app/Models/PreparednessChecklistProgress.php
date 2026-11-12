<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreparednessChecklistProgress extends Model
{
    use HasFactory;

    protected $table = 'preparedness_checklist_progress';

    protected $fillable = [
        'user_id',
        'checklist_item_id',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(PreparednessChecklistItem::class, 'checklist_item_id');
    }
}

