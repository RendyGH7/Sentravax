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
        protected CapAdapter $capAdapter,
        protected FreshnessClassifierService $freshnessClassifier
    ) {}

    /**
     * Trigger synchronization for a specific data source.
     */
    public function syncDataSource(DataSource $dataSource): DataSourceSyncRun
    {
        $startTime = microtime(true);

        try {
            $name = strtolower($dataSource->name);
            $sourceType = strtolower($dataSource->source_type ?? '');

            $res = match (true) {
                str_contains($name, 'cap') || $sourceType === 'cap' => $this->capAdapter->sync($dataSource),
                str_contains($name, 'bmkg') => $this->bmkgAdapter->sync($dataSource),
                str_contains($name, 'bnpb') => $this->bnpbAdapter->sync($dataSource),
                str_contains($name, 'firms') || str_contains($name, 'nasa') => $this->nasaFirmsAdapter->sync($dataSource),
                default => [
                    'status' => 'SUCCESS',
                    'connectivity_state' => $dataSource->is_simulated ? 'OFFLINE' : 'STATIC',
                    'freshness_state' => 'UNKNOWN',
                    'provenance_type' => $dataSource->is_simulated ? 'SIMULATED' : 'CURATED_REFERENCE',
                    'items_fetched' => 0,
                    'items_persisted' => 0,
                    'duration_ms' => 15,
                    'provenance' => [
                        'provider_name' => $dataSource->provider,
                        'endpoint' => $dataSource->endpoint_url,
                        'source_type' => $dataSource->source_type,
                        'is_simulated' => (bool) $dataSource->is_simulated,
                        'terms' => $dataSource->terms_of_service,
                        'note' => $dataSource->is_simulated
                            ? 'Skenario demonstrasi terkurasi lokal berlabel simulasi permanen.'
                            : 'Data referensi terkurasi geologi/satelit (baseline statis, bukan streaming sensor live).',
                    ],
                ],
            };
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $sanitizedError = $this->sanitizeErrorMessage($e->getMessage());

            Log::error(sprintf("Sync execution threw exception for %s: %s", $dataSource->name, $sanitizedError));

            $res = [
                'status' => 'FAILED',
                'connectivity_state' => 'UNKNOWN',
                'freshness_state' => 'UNAVAILABLE',
                'provenance_type' => $dataSource->is_simulated ? 'SIMULATED' : 'CURATED_REFERENCE',
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
        $freshnessState = $res['freshness_state'] ?? 'UNKNOWN';
        $connectivityState = $res['connectivity_state'] ?? $this->freshnessClassifier->resolveConnectivity($dataSource);
        $provenanceType = $res['provenance_type'] ?? $this->freshnessClassifier->resolveProvenance($dataSource);
        $errorMsg = isset($res['error_message']) ? $this->sanitizeErrorMessage((string) $res['error_message']) : null;

        // Structured provenance payload with temporal attributes across all 3 dimensions
        $provenance = array_merge([
            'provider_name' => $dataSource->provider,
            'source_type' => $dataSource->source_type,
            'endpoint' => $dataSource->endpoint_url,
            'connectivity_state' => $connectivityState,
            'freshness_state' => $freshnessState,
            'provenance_type' => $provenanceType,
            'fetched_at' => now()->toIso8601String(),
            'observed_at' => ($res['observed_at'] ?? $dataSource->last_observed_at)?->toIso8601String(),
            'is_simulated' => (bool) $dataSource->is_simulated,
            'terms_of_service' => $dataSource->terms_of_service,
        ], $res['provenance'] ?? []);

        // Update timestamps on data source model
        // Never claim live observation for curated reference (PVMBG/InSAR) or simulated sources
        $updatePayload = [
            'last_fetched_at' => now(),
        ];
        if ($status === 'SUCCESS') {
            $nameLower = strtolower($dataSource->name ?? '');
            $isCuratedReference = in_array($dataSource->id, [4, 5, 6], true)
                || $dataSource->is_simulated
                || str_contains($nameLower, 'pvmbg')
                || str_contains($nameLower, 'insar')
                || str_contains($nameLower, 'sentinel')
                || in_array($dataSource->source_type, ['curated', 'satellite'], true);

            if (! $isCuratedReference) {
                $updatePayload['last_successful_at'] = now();
            }
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

        // Distributions across all 3 standardized dimensions
        $connectivityCounts = [
            'LIVE' => 0,
            'STATIC' => 0,
            'OFFLINE' => 0,
            'UNKNOWN' => 0,
        ];
        $freshnessCounts = [
            'FRESH' => 0,
            'DELAYED' => 0,
            'STALE' => 0,
            'UNAVAILABLE' => 0,
            'UNKNOWN' => 0,
            'SIMULATED' => 0, // legacy backward-compatibility slot
        ];
        $provenanceCounts = [
            'OFFICIAL' => 0,
            'OBSERVED' => 0,
            'COMMUNITY_REPORT' => 0,
            'SENTRAVAX_INSIGHT' => 0,
            'SIMULATED' => 0,
            'CURATED_REFERENCE' => 0,
        ];

        foreach (DataSource::all() as $src) {
            $fState = $src->freshness_state;
            if (isset($freshnessCounts[$fState])) {
                $freshnessCounts[$fState]++;
            } else {
                $freshnessCounts['UNKNOWN']++;
            }

            $cState = $src->connectivity_state;
            if (isset($connectivityCounts[$cState])) {
                $connectivityCounts[$cState]++;
            } else {
                $connectivityCounts['UNKNOWN']++;
            }

            $pType = $src->provenance_type;
            if (isset($provenanceCounts[$pType])) {
                $provenanceCounts[$pType]++;
            } else {
                $provenanceCounts['CURATED_REFERENCE']++;
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
            'connectivity_distribution' => $connectivityCounts,
            'freshness_distribution' => $freshnessCounts,
            'provenance_distribution' => $provenanceCounts,
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
