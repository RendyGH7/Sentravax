<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiInsight extends Model
{
    protected $table = 'ai_insights';

    protected $fillable = [
        'risk_assessment_id',
        'insight_type',
        'summary',
        'recommendations',
        'confidence_score',
        'generation_mode',
        'model_name',
        'evidence',
    ];

    protected function casts(): array
    {
        return [
            'recommendations' => 'array',
            'confidence_score' => 'decimal:3',
            'evidence' => 'array',
        ];
    }

    public function riskAssessment(): BelongsTo
    {
        return $this->belongsTo(
            RiskAssessment::class,
            'risk_assessment_id'
        );
    }
}
