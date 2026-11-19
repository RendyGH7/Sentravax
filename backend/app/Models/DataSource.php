<?php

namespace App\Models;

use App\Models\Concerns\ProtectsBaselineRecords;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataSource extends Model
{
    protected $table = 'data_sources';

    use ProtectsBaselineRecords;

    public const BASELINE_IDS = [2, 3, 4, 5, 6, 7];

    protected $fillable = [
        'name',
        'provider',
        'source_type',
        'category',
        'endpoint_url',
        'status',
        'last_fetched_at',
        'last_successful_at',
        'notes',
        'sync_interval_minutes',
        'rate_limit_rpm',
        'terms_of_service',
        'last_observed_at',
        'is_simulated',
        'metadata',
    ];

    protected $appends = [
        'connectivity_state',
        'freshness_state',
        'provenance_type',
        'freshness_info',
    ];

    protected function casts(): array
    {
        return [
            'last_fetched_at' => 'datetime',
            'last_successful_at' => 'datetime',
            'last_observed_at' => 'datetime',
            'is_simulated' => 'boolean',
            'sync_interval_minutes' => 'integer',
            'rate_limit_rpm' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function getFreshnessInfoAttribute(): array
    {
        return app(\App\Services\ExternalData\FreshnessClassifierService::class)->classify($this);
    }

    public function getConnectivityStateAttribute(): string
    {
        return $this->freshness_info['connectivity_state'] ?? 'UNKNOWN';
    }

    public function getFreshnessStateAttribute(): string
    {
        return $this->freshness_info['freshness_state'] ?? 'UNKNOWN';
    }

    public function getProvenanceTypeAttribute(): string
    {
        return $this->freshness_info['provenance_type'] ?? 'CURATED_REFERENCE';
    }

    public function hazardEvents(): HasMany
    {
        return $this->hasMany(HazardEvent::class, 'data_source_id');
    }

    public function syncRuns(): HasMany
    {
        return $this->hasMany(DataSourceSyncRun::class, 'data_source_id');
    }
}
