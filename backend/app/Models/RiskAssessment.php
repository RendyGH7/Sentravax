<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RiskAssessment extends Model
{
    protected $table = 'risk_assessments';

    protected $fillable = [
        'hazard_event_id',
        'region_id',
        'hazard_type_id',
        'title',
        'risk_score',
        'risk_level',
        'methodology_version',
        'impact_radius_meters',
        'affected_population_estimate',
        'calculation_factors',
        'assessed_at',
    ];

    protected function casts(): array
    {
        return [
            'risk_score' => 'decimal:2',
            'impact_radius_meters' => 'integer',
            'affected_population_estimate' => 'integer',
            'calculation_factors' => 'array',
            'assessed_at' => 'datetime',
        ];
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

    public function aiInsights(): HasMany
    {
        return $this->hasMany(AiInsight::class, 'risk_assessment_id');
    }
}
