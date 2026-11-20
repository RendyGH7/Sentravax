<?php

namespace App\Services\ExternalData;

use App\Models\DataSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BmkgWeatherRadarAdapter
{
    /**
     * Synchronize data from BMKG Weather Radar / Observation API.
     * Note: Current official BMKG Kong Gateway endpoint (https://api.bmkg.go.id/public/weather)
     * returns 404 (no route matched). This adapter handles this status truthfully without
     * inventing fake weather events or claiming false live status.
     *
     * @return array<string, mixed>
     */
    public function sync(DataSource $dataSource): array
    {
        $startTime = microtime(true);
        $endpoint = $dataSource->endpoint_url ?: 'https://api.bmkg.go.id/public/weather';

        try {
            $response = Http::timeout(3)->get($endpoint);

            $durationMs = (int) round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                // If in the future BMKG provisions a valid weather payload
                $payload = $response->json();
                $itemsPersisted = 0; // Extensible parser when schema is released

                $dataSource->update([
                    'status' => 'active',
                    'last_fetched_at' => now(),
                    'last_successful_at' => now(),
                ]);

                return [
                    'status' => 'SUCCESS',
                    'connectivity_state' => FreshnessClassifierService::CONNECTIVITY_LIVE,
                    'freshness_state' => FreshnessClassifierService::STATE_FRESH,
                    'provenance_type' => FreshnessClassifierService::PROVENANCE_OFFICIAL,
                    'items_fetched' => is_countable($payload) ? count($payload) : 1,
                    'items_persisted' => $itemsPersisted,
                    'duration_ms' => $durationMs,
                    'provenance' => [
                        'endpoint' => $endpoint,
                        'source' => 'BMKG Weather Radar & Observation API',
                        'note' => 'Pengamatan cuaca dan radar BMKG live berhasil disinkronisasi.',
                    ],
                ];
            }

            // HTTP error response (e.g. 404, 500, 503)
            $statusCode = $response->status();
            Log::warning(sprintf('BMKG Weather Radar endpoint returned HTTP %d: %s', $statusCode, $endpoint));

            $dataSource->update([
                'last_fetched_at' => now(),
            ]);

            return [
                'status' => 'FAILED',
                'connectivity_state' => FreshnessClassifierService::CONNECTIVITY_OFFLINE,
                'freshness_state' => FreshnessClassifierService::STATE_UNAVAILABLE,
                'provenance_type' => FreshnessClassifierService::PROVENANCE_OFFICIAL,
                'items_fetched' => 0,
                'items_persisted' => 0,
                'duration_ms' => $durationMs,
                'error_message' => sprintf('Endpoint cuaca BMKG mengembalikan status HTTP %d (Rute layanan belum aktif).', $statusCode),
                'provenance' => [
                    'endpoint' => $endpoint,
                    'source' => 'BMKG Weather Radar & Observation API',
                    'http_status' => $statusCode,
                    'note' => 'Integrasi pengamatan radar cuaca BMKG. Layanan eksternal mengembalikan HTTP ' . $statusCode . '; tidak menghasilkan data simulasi palsu.',
                ],
            ];
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            Log::warning('BMKG Weather Radar connection failure: ' . $e->getMessage());

            $dataSource->update([
                'last_fetched_at' => now(),
            ]);

            return [
                'status' => 'FAILED',
                'connectivity_state' => FreshnessClassifierService::CONNECTIVITY_OFFLINE,
                'freshness_state' => FreshnessClassifierService::STATE_UNAVAILABLE,
                'provenance_type' => FreshnessClassifierService::PROVENANCE_OFFICIAL,
                'items_fetched' => 0,
                'items_persisted' => 0,
                'duration_ms' => $durationMs,
                'error_message' => 'Koneksi ke endpoint cuaca BMKG gagal atau batas waktu (3s) terlampaui.',
                'provenance' => [
                    'endpoint' => $endpoint,
                    'source' => 'BMKG Weather Radar & Observation API',
                    'note' => 'Timeout atau kendala jaringan saat menghubungi BMKG.',
                ],
            ];
        }
    }
}
