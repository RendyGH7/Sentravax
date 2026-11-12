<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PreparednessChecklistItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'hazard_type_id',
        'category',
        'name',
        'description',
        'sort_order',
        'is_essential',
    ];

    protected $casts = [
        'is_essential' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(PreparednessChecklistProgress::class, 'checklist_item_id');
    }
}

