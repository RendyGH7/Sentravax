<?php

namespace App\Models;

use App\Models\Concerns\ProtectsBaselineRecords;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiInsight extends Model
{
    protected $table = 'ai_insights';

    protected $fillable = [
        'risk_assessment_id',
        'title',
        'region_id',
        'hazard_type_id',
        'insight_type',
        'summary',
        'recommendations',
        'confidence_score',
        'generation_mode',
        'model_name',
        'evidence',
    ];

    protected $appends = [
        'confidence_level',
    ];

    protected function casts(): array
    {
        return [
            'recommendations' => 'array',
            'confidence_score' => 'decimal:3',
            'evidence' => 'array',
        ];
    }

    public function getConfidenceLevelAttribute(): string
    {
        return $this->evidence['confidence_level'] ?? (
            (float) $this->confidence_score <= 0.05
                ? 'INSUFFICIENT_DATA'
                : ((float) $this->confidence_score >= 0.900
                    ? 'HIGH'
                    : ((float) $this->confidence_score >= 0.700
                        ? 'MEDIUM'
                        : 'LOW'))
        );
    }

    use ProtectsBaselineRecords;

    public const BASELINE_IDS = [1];

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class, 'hazard_type_id');
    }

    public function riskAssessment(): BelongsTo
    {
        return $this->belongsTo(
            RiskAssessment::class,
            'risk_assessment_id'
        );
    }
}
