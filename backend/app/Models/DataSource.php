<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataSource extends Model
{
    protected $table = 'data_sources';

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
        'freshness_state',
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

    public function getFreshnessStateAttribute(): string
    {
        return $this->freshness_info['freshness_state'] ?? 'UNKNOWN';
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
