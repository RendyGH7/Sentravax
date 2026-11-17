<?php

namespace App\Services\ExternalData;

use App\Models\DataSource;
use Illuminate\Support\Carbon;

class FreshnessClassifierService
{
    public const STATE_FRESH = 'FRESH';
    public const STATE_DELAYED = 'DELAYED';
    public const STATE_STALE = 'STALE';
    public const STATE_UNAVAILABLE = 'UNAVAILABLE';
    public const STATE_SIMULATED = 'SIMULATED';
    public const STATE_UNKNOWN = 'UNKNOWN';

    public const STATES = [
        self::STATE_FRESH,
        self::STATE_DELAYED,
        self::STATE_STALE,
        self::STATE_UNAVAILABLE,
        self::STATE_SIMULATED,
        self::STATE_UNKNOWN,
    ];

    /**
     * Determine accurate source-specific freshness classification.
     *
     * @return array{
     *     freshness_state: string,
     *     observed_at: string|null,
     *     fetched_at: string|null,
     *     created_at: string|null,
     *     threshold_fresh_minutes: int,
     *     threshold_delayed_minutes: int,
     *     is_simulated: bool,
     *     minutes_since_last_sync: int|null,
     *     explanation: string
     * }
     */
    public function classify(DataSource $dataSource): array
    {
        // 1. Permanent Simulated / Demonstration Data check
        if ($dataSource->is_simulated || $dataSource->source_type === 'curated') {
            return [
                'freshness_state' => self::STATE_SIMULATED,
                'observed_at' => $dataSource->last_observed_at?->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => 0,
                'threshold_delayed_minutes' => 0,
                'is_simulated' => true,
                'minutes_since_last_sync' => null,
                'explanation' => 'Data skenario demonstrasi terkurasi lokal berlabel simulasi permanen.',
            ];
        }

        // 2. Inactive or disabled integration
        if ($dataSource->status === 'inactive') {
            return [
                'freshness_state' => self::STATE_UNAVAILABLE,
                'observed_at' => $dataSource->last_observed_at?->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => 0,
                'threshold_delayed_minutes' => 0,
                'is_simulated' => false,
                'minutes_since_last_sync' => null,
                'explanation' => 'Integrasi dinonaktifkan oleh administrator.',
            ];
        }

        // 3. Uninitialized or Never Polled Source
        if (! $dataSource->last_successful_at) {
            $latestRun = $dataSource->relationLoaded('syncRuns') 
                ? $dataSource->syncRuns->first() 
                : $dataSource->syncRuns()->latest()->first();

            if ($latestRun && $latestRun->status === 'FAILED') {
                return [
                    'freshness_state' => self::STATE_UNAVAILABLE,
                    'observed_at' => null,
                    'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                    'created_at' => $dataSource->created_at?->toIso8601String(),
                    'threshold_fresh_minutes' => 0,
                    'threshold_delayed_minutes' => 0,
                    'is_simulated' => false,
                    'minutes_since_last_sync' => null,
                    'explanation' => 'Percobaan sinkronisasi gagal atau endpoint tidak dapat dihubungi.',
                ];
            }

            return [
                'freshness_state' => self::STATE_UNKNOWN,
                'observed_at' => null,
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => 0,
                'threshold_delayed_minutes' => 0,
                'is_simulated' => false,
                'minutes_since_last_sync' => null,
                'explanation' => 'Sumber data terdaftar menunggu polling sinkronisasi pertama.',
            ];
        }

        // 4. Source-specific threshold resolution
        [$freshMinutes, $delayedMinutes] = $this->resolveThresholds($dataSource);

        $now = now();
        $isFuture = $dataSource->last_successful_at->isAfter($now);
        $futureSkewMinutes = $isFuture ? (int) $now->diffInMinutes($dataSource->last_successful_at) : 0;

        // Clock-skew policy: Allow maximum 5 minutes clock drift between external server and Sentravax
        if ($isFuture && $futureSkewMinutes > 5) {
            return [
                'freshness_state' => self::STATE_UNKNOWN,
                'observed_at' => ($dataSource->last_observed_at ?? $dataSource->last_successful_at)?->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => $freshMinutes,
                'threshold_delayed_minutes' => $delayedMinutes,
                'is_simulated' => false,
                'minutes_since_last_sync' => -$futureSkewMinutes,
                'explanation' => sprintf('Timestamp masa depan tidak wajar (+%d menit dari waktu sistem). Dianggap anomali temporal.', $futureSkewMinutes),
            ];
        }

        $diffMinutes = (int) $dataSource->last_successful_at->diffInMinutes($now);

        if ($isFuture) {
            $state = self::STATE_FRESH;
            $explanation = sprintf('Data aktif dan segar (sinkron baru saja dengan toleransi clock-skew +%d menit).', $futureSkewMinutes);
        } elseif ($diffMinutes <= $freshMinutes) {
            $state = self::STATE_FRESH;
            $explanation = sprintf('Data aktif dan segar (sinkron %d menit lalu, ambang batas %d menit).', $diffMinutes, $freshMinutes);
        } elseif ($diffMinutes <= $delayedMinutes) {
            $state = self::STATE_DELAYED;
            $explanation = sprintf('Data mengalami keterlambatan polling (%d menit lalu, ambang toleransi %d menit).', $diffMinutes, $delayedMinutes);
        } else {
            $state = self::STATE_STALE;
            $explanation = sprintf('Data usang (stale) melebihi batas toleransi (%d menit lalu > %d menit).', $diffMinutes, $delayedMinutes);
        }

        return [
            'freshness_state' => $state,
            'observed_at' => ($dataSource->last_observed_at ?? $dataSource->last_successful_at)?->toIso8601String(),
            'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
            'created_at' => $dataSource->created_at?->toIso8601String(),
            'threshold_fresh_minutes' => $freshMinutes,
            'threshold_delayed_minutes' => $delayedMinutes,
            'is_simulated' => false,
            'minutes_since_last_sync' => $diffMinutes,
            'explanation' => $explanation,
        ];
    }

    /**
     * Resolve source-specific thresholds based on physical nature of hazard data.
     *
     * @return array{0: int, 1: int} [freshMinutes, delayedMinutes]
     */
    protected function resolveThresholds(DataSource $dataSource): array
    {
        $name = strtolower($dataSource->name);
        $category = strtolower($dataSource->category ?? '');

        if (str_contains($name, 'tews') || $category === 'seismology') {
            // Rapid real-time seismology feed
            return [30, 120];
        }

        if (str_contains($name, 'radar') || $category === 'weather') {
            // Fast convective weather observation
            return [60, 180];
        }

        if (str_contains($name, 'volcanic') || str_contains($name, 'pvmbg') || $category === 'geology') {
            // Geological deformation cycles
            return [240, 720];
        }

        if (str_contains($name, 'insar') || str_contains($name, 'sentinel') || $category === 'satellite') {
            // Satellite orbit pass cycle (~12h - 24h)
            return [1440, 4320]; // 24h fresh, 72h delayed
        }

        return [60, 240];
    }
}
