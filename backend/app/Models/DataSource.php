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
    ];

    protected function casts(): array
    {
        return [
            'last_fetched_at' => 'datetime',
            'last_successful_at' => 'datetime',
        ];
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
