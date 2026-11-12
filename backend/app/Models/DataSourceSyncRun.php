<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataSourceSyncRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'data_source_id',
        'status',
        'freshness_state',
        'items_fetched',
        'items_persisted',
        'duration_ms',
        'error_message',
        'provenance_metadata',
        'synced_at',
    ];

    protected $casts = [
        'items_fetched' => 'integer',
        'items_persisted' => 'integer',
        'duration_ms' => 'integer',
        'provenance_metadata' => 'array',
        'synced_at' => 'datetime',
    ];

    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DataSource::class);
    }
}

