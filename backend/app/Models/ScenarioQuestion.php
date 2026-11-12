<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScenarioQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'scenario_id',
        'question',
        'options',
        'points',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
        'points' => 'integer',
        'sort_order' => 'integer',
    ];

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(EmergencyScenario::class, 'scenario_id');
    }
}

