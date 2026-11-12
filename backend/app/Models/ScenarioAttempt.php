<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScenarioAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'scenario_id',
        'score',
        'total_possible_score',
        'passed',
        'answers_summary',
        'completed_at',
    ];

    protected $casts = [
        'score' => 'integer',
        'total_possible_score' => 'integer',
        'passed' => 'boolean',
        'answers_summary' => 'array',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(EmergencyScenario::class, 'scenario_id');
    }
}

