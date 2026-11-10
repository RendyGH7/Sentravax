<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HazardEvent extends Model
{
    protected $table = 'hazard_events';

    protected $fillable = [
        'region_id',
        'hazard_type_id',
        'data_source_id',
        'external_id',
        'title',
        'description',
        'severity',
        'status',
        'occurred_at',
        'reported_at',
        'source_metadata',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'reported_at' => 'datetime',
            'source_metadata' => 'array',
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

    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DataSource::class, 'data_source_id');
    }

    public function riskAssessments(): HasMany
    {
        return $this->hasMany(RiskAssessment::class, 'hazard_event_id');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class, 'hazard_event_id');
    }
}
