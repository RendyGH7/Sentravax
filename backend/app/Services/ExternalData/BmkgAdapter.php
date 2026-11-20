<?php

namespace App\Services\ExternalData;

use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BmkgAdapter
{
    public const BMKG_AUTOGEMPA_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';

    /**
     * Synchronize data from BMKG public data feed.
     *
     * @return array<string, mixed>
     */
    public function sync(DataSource $dataSource): array
    {
        $startTime = microtime(true);
        $earthquakeHazard = HazardType::where('slug', 'earthquake')->first();

        try {
            // Attempt to fetch from official BMKG open public endpoint with 3s timeout
            $response = Http::timeout(3)->get(self::BMKG_AUTOGEMPA_URL);

            if ($response->successful()) {
                $payload = $response->json();
                $gempa = $payload['Infogempa']['gempa'] ?? null;

                if ($gempa) {
                    $observedAt = null;
                    if (!empty($gempa['DateTime'])) {
                        try {
                            $observedAt = Carbon::parse($gempa['DateTime']);
                        } catch (\Throwable) {
                            $observedAt = null;
                        }
                    }
                    if (!$observedAt && !empty($gempa['Tanggal']) && !empty($gempa['Jam'])) {
                        try {
                            $observedAt = Carbon::parse($gempa['Tanggal'] . ' ' . $gempa['Jam']);
                        } catch (\Throwable) {
                            $observedAt = null;
                        }
                    }
                    $observedAt = $observedAt ?? now();

                    $itemsPersisted = $this->persistBmkgEarthquake($gempa, $dataSource, $earthquakeHazard, $observedAt);

                    $durationMs = (int) round((microtime(true) - $startTime) * 1000);
                    $dataSource->update([
                        'status' => 'active',
                        'last_fetched_at' => now(),
                        'last_successful_at' => now(),
                        'last_observed_at' => $observedAt,
                    ]);

                    return [
                        'status' => 'SUCCESS',
                        'connectivity_state' => FreshnessClassifierService::CONNECTIVITY_LIVE,
                        'freshness_state' => 'LIVE',
                        'provenance_type' => FreshnessClassifierService::PROVENANCE_OFFICIAL,
                        'items_fetched' => 1,
                        'items_persisted' => $itemsPersisted,
                        'duration_ms' => $durationMs,
                        'observed_at' => $observedAt,
                        'provenance' => [
                            'endpoint' => self::BMKG_AUTOGEMPA_URL,
                            'event_time' => ($gempa['Tanggal'] ?? '') . ' ' . ($gempa['Jam'] ?? ''),
                            'observed_at' => $observedAt->toIso8601String(),
                            'magnitude' => $gempa['Magnitude'] ?? null,
                            'wilayah' => $gempa['Wilayah'] ?? null,
                            'source' => 'BMKG Open Data Feed',
                        ],
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('BMKG Public Feed unavailable or timed out: ' . $e->getMessage());
        }

        // Honest Fallback: Return UNAVAILABLE / FAILED status without concealing feed disruption
        $durationMs = (int) round((microtime(true) - $startTime) * 1000);
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
            'error_message' => 'BMKG public data feed unreachable or timed out',
            'provenance' => [
                'note' => 'BMKG open network offline or timed out; retaining baseline PostGIS records without claiming live status.',
                'source' => 'BMKG TEWS Open Data API',
            ],
        ];
    }

    private function persistBmkgEarthquake(array $gempa, DataSource $dataSource, ?HazardType $hazardType, ?Carbon $observedAt = null): int
    {
        $coords = explode(',', $gempa['Coordinates'] ?? '0,0');
        $lat = (float) trim($coords[0] ?? '0');
        $lon = (float) trim($coords[1] ?? '0');
        $title = sprintf("Gempa Bumi Mag %.1f %s", (float) ($gempa['Magnitude'] ?? 0), $gempa['Wilayah'] ?? 'Indonesia');

        // Prefer dedicated BMKG TEWS data source if registered
        $actualSource = DataSource::where('endpoint_url', self::BMKG_AUTOGEMPA_URL)->first() ?? $dataSource;

        // Match nearest region
        $region = Region::orderByRaw('ST_Distance(center_point, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [$lon, $lat])->first();

        $severity = ((float) ($gempa['Magnitude'] ?? 0)) >= 6.0 ? 'high' : (((float) ($gempa['Magnitude'] ?? 0)) >= 5.0 ? 'medium' : 'low');

        $event = HazardEvent::updateOrCreate(
            ['title' => $title],
            [
                'description' => sprintf("Kedalaman: %s. Potensi: %s.", $gempa['Kedalaman'] ?? '-', $gempa['Potensi'] ?? '-'),
                'hazard_type_id' => $hazardType?->id,
                'data_source_id' => $actualSource->id,
                'region_id' => $region?->id,
                'severity' => $severity,
                'status' => 'active',
                'occurred_at' => $observedAt ?? now(),
                'reported_at' => now(),
                'source_metadata' => $gempa,
            ]
        );

        DB::statement('
            UPDATE hazard_events 
            SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)
            WHERE id = ?
        ', [$lon, $lat, $event->id]);

        return 1;
    }
}

