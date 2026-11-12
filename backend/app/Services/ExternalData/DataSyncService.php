<?php

namespace App\Services\ExternalData;

use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use Illuminate\Support\Facades\Log;

class DataSyncService
{
    public function __construct(
        protected BmkgAdapter $bmkgAdapter,
        protected BnpbAdapter $bnpbAdapter,
        protected NasaFirmsAdapter $nasaFirmsAdapter
    ) {}

    /**
     * Trigger synchronization for a specific data source.
     */
    public function syncDataSource(DataSource $dataSource): DataSourceSyncRun
    {
        $res = match (true) {
            str_contains(strtolower($dataSource->name), 'bmkg') => $this->bmkgAdapter->sync($dataSource),
            str_contains(strtolower($dataSource->name), 'bnpb') => $this->bnpbAdapter->sync($dataSource),
            str_contains(strtolower($dataSource->name), 'firms') || str_contains(strtolower($dataSource->name), 'nasa') => $this->nasaFirmsAdapter->sync($dataSource),
            default => [
                'status' => 'SUCCESS',
                'freshness_state' => 'STATIC',
                'items_fetched' => 0,
                'items_persisted' => 0,
                'duration_ms' => 10,
                'provenance' => ['note' => 'Default telemetry sync.'],
            ],
        };

        return DataSourceSyncRun::create([
            'data_source_id' => $dataSource->id,
            'status' => $res['status'] ?? 'SUCCESS',
            'freshness_state' => $res['freshness_state'] ?? 'STATIC',
            'items_fetched' => $res['items_fetched'] ?? 0,
            'items_persisted' => $res['items_persisted'] ?? 0,
            'duration_ms' => $res['duration_ms'] ?? 0,
            'error_message' => $res['error_message'] ?? null,
            'provenance_metadata' => $res['provenance'] ?? null,
            'synced_at' => now(),
        ]);
    }

    /**
     * Sync all active data sources.
     *
     * @return array<int, DataSourceSyncRun>
     */
    public function syncAll(): array
    {
        $runs = [];
        $sources = DataSource::where('status', 'active')->get();

        foreach ($sources as $ds) {
            try {
                $runs[] = $this->syncDataSource($ds);
            } catch (\Throwable $e) {
                Log::error(sprintf("Data source sync failed for %s: %s", $ds->name, $e->getMessage()));
                $runs[] = DataSourceSyncRun::create([
                    'data_source_id' => $ds->id,
                    'status' => 'FAILED',
                    'freshness_state' => 'UNAVAILABLE',
                    'items_fetched' => 0,
                    'items_persisted' => 0,
                    'duration_ms' => 0,
                    'error_message' => $e->getMessage(),
                    'synced_at' => now(),
                ]);
            }
        }

        return $runs;
    }
}

