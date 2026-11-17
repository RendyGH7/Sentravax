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
        protected NasaFirmsAdapter $nasaFirmsAdapter,
        protected FreshnessClassifierService $freshnessClassifier
    ) {}

    /**
     * Trigger synchronization for a specific data source.
     */
    public function syncDataSource(DataSource $dataSource): DataSourceSyncRun
    {
        $startTime = microtime(true);

        try {
            $res = match (true) {
                str_contains(strtolower($dataSource->name), 'bmkg') => $this->bmkgAdapter->sync($dataSource),
                str_contains(strtolower($dataSource->name), 'bnpb') => $this->bnpbAdapter->sync($dataSource),
                str_contains(strtolower($dataSource->name), 'firms') || str_contains(strtolower($dataSource->name), 'nasa') => $this->nasaFirmsAdapter->sync($dataSource),
                default => [
                    'status' => 'SUCCESS',
                    'freshness_state' => $dataSource->is_simulated ? 'SIMULATED' : 'STATIC',
                    'items_fetched' => 0,
                    'items_persisted' => 0,
                    'duration_ms' => 15,
                    'provenance' => [
                        'provider_name' => $dataSource->provider,
                        'endpoint' => $dataSource->endpoint_url,
                        'source_type' => $dataSource->source_type,
                        'is_simulated' => (bool) $dataSource->is_simulated,
                        'terms' => $dataSource->terms_of_service,
                        'note' => 'Synchronized local curated telemetry baseline.',
                    ],
                ],
            };
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $sanitizedError = $this->sanitizeErrorMessage($e->getMessage());

            Log::error(sprintf("Sync execution threw exception for %s: %s", $dataSource->name, $sanitizedError));

            $res = [
                'status' => 'FAILED',
                'freshness_state' => 'UNAVAILABLE',
                'items_fetched' => 0,
                'items_persisted' => 0,
                'duration_ms' => $durationMs,
                'error_message' => $sanitizedError,
                'provenance' => [
                    'provider_name' => $dataSource->provider,
                    'endpoint' => $dataSource->endpoint_url,
                    'is_simulated' => (bool) $dataSource->is_simulated,
                    'failure_reason' => $sanitizedError,
                ],
            ];
        }

        $status = $res['status'] ?? 'SUCCESS';
        $freshnessState = $res['freshness_state'] ?? ($dataSource->is_simulated ? 'SIMULATED' : 'STATIC');
        $errorMsg = isset($res['error_message']) ? $this->sanitizeErrorMessage((string) $res['error_message']) : null;

        // Structured provenance payload with temporal attributes
        $provenance = array_merge([
            'provider_name' => $dataSource->provider,
            'source_type' => $dataSource->source_type,
            'endpoint' => $dataSource->endpoint_url,
            'fetched_at' => now()->toIso8601String(),
            'observed_at' => ($res['observed_at'] ?? $dataSource->last_observed_at ?? now())->toIso8601String(),
            'is_simulated' => (bool) $dataSource->is_simulated,
            'terms_of_service' => $dataSource->terms_of_service,
        ], $res['provenance'] ?? []);

        // Update timestamps on data source model
        $updatePayload = [
            'last_fetched_at' => now(),
        ];
        if ($status === 'SUCCESS') {
            $updatePayload['last_successful_at'] = now();
            if (isset($res['observed_at'])) {
                $updatePayload['last_observed_at'] = $res['observed_at'];
            }
        }
        $dataSource->update($updatePayload);

        return DataSourceSyncRun::create([
            'data_source_id' => $dataSource->id,
            'status' => $status,
            'freshness_state' => $freshnessState,
            'items_fetched' => $res['items_fetched'] ?? 0,
            'items_persisted' => $res['items_persisted'] ?? 0,
            'duration_ms' => $res['duration_ms'] ?? 0,
            'error_message' => $errorMsg,
            'provenance_metadata' => $provenance,
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
            $runs[] = $this->syncDataSource($ds);
        }

        return $runs;
    }

    /**
     * Aggregate sync statistics for operational monitoring telemetry.
     */
    public function getAggregationMetrics(): array
    {
        $totalSources = DataSource::count();
        $activeSources = DataSource::where('status', 'active')->count();
        $inactiveSources = DataSource::where('status', 'inactive')->count();

        $runsQuery = DataSourceSyncRun::query();
        $totalSyncRuns = $runsQuery->count();
        $successfulSyncRuns = DataSourceSyncRun::where('status', 'SUCCESS')->count();
        $failedSyncRuns = DataSourceSyncRun::where('status', 'FAILED')->count();
        $avgDurationMs = (int) round(DataSourceSyncRun::avg('duration_ms') ?? 0);
        $totalItemsPersisted = (int) DataSourceSyncRun::sum('items_persisted');

        // Freshness distribution across all sources
        $freshnessCounts = [
            'FRESH' => 0,
            'DELAYED' => 0,
            'STALE' => 0,
            'UNAVAILABLE' => 0,
            'SIMULATED' => 0,
            'UNKNOWN' => 0,
        ];

        foreach (DataSource::all() as $src) {
            $state = $src->freshness_state;
            if (isset($freshnessCounts[$state])) {
                $freshnessCounts[$state]++;
            } else {
                $freshnessCounts['UNKNOWN']++;
            }
        }

        return [
            'sources' => [
                'total' => $totalSources,
                'active' => $activeSources,
                'inactive' => $inactiveSources,
            ],
            'sync_runs' => [
                'total_runs' => $totalSyncRuns,
                'successful_runs' => $successfulSyncRuns,
                'failed_runs' => $failedSyncRuns,
                'success_rate' => $totalSyncRuns > 0 ? round(($successfulSyncRuns / $totalSyncRuns) * 100, 1) : 100.0,
                'avg_duration_ms' => $avgDurationMs,
                'total_items_persisted' => $totalItemsPersisted,
            ],
            'freshness_distribution' => $freshnessCounts,
        ];
    }

    /**
     * Sanitize error message from credentials, passwords, tokens, and internal paths.
     */
    public function sanitizeErrorMessage(string $message): string
    {
        // Redact URL userinfo credentials (e.g. https://user:password@host)
        $sanitized = preg_replace('#://([^:/@\s]+):([^/@\s]+)@#', '://$1:[REDACTED]@', $message);

        // Redact query parameters or key-value pairs containing passwords or tokens
        $sanitized = preg_replace('/(password|token|secret|key|api_key)\s*[:=]\s*([^&\s,]+)/i', '$1=[REDACTED]', $sanitized ?? $message);

        // Redact potential IP addresses with optional ports
        $sanitized = preg_replace('/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/', '[SERVER_IP]', $sanitized ?? $message);

        // Redact internal absolute file paths
        $sanitized = preg_replace('#(/[a-zA-Z0-9_\.-]+)+/[a-zA-Z0-9_\.-]+\.php#', '[INTERNAL_PATH]', $sanitized ?? $message);
        $sanitized = preg_replace('/[a-zA-Z]:\\\\[^:\n\r]+/', '[INTERNAL_PATH]', $sanitized ?? $message);

        // Truncate to reasonable length
        return mb_substr($sanitized ?? $message, 0, 300);
    }
}
