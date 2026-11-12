<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmergencyScenario extends Model
{
    use HasFactory;

    protected $fillable = [
        'hazard_type_id',
        'title',
        'slug',
        'difficulty',
        'description',
        'context_brief',
        'estimated_minutes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'estimated_minutes' => 'integer',
    ];

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ScenarioQuestion::class, 'scenario_id')->orderBy('sort_order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ScenarioAttempt::class, 'scenario_id');
    }
}

