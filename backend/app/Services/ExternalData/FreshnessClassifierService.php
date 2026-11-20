<?php

namespace App\Services\ExternalData;

use App\Models\DataSource;
use Illuminate\Support\Carbon;

class FreshnessClassifierService
{
    // Dimension A: Connectivity
    public const CONNECTIVITY_LIVE = 'LIVE';
    public const CONNECTIVITY_STATIC = 'STATIC';
    public const CONNECTIVITY_OFFLINE = 'OFFLINE';
    public const CONNECTIVITY_UNKNOWN = 'UNKNOWN';

    public const CONNECTIVITY_STATES = [
        self::CONNECTIVITY_LIVE,
        self::CONNECTIVITY_STATIC,
        self::CONNECTIVITY_OFFLINE,
        self::CONNECTIVITY_UNKNOWN,
    ];

    // Dimension B: Freshness
    public const STATE_FRESH = 'FRESH';
    public const STATE_DELAYED = 'DELAYED';
    public const STATE_STALE = 'STALE';
    public const STATE_UNAVAILABLE = 'UNAVAILABLE';
    public const STATE_UNKNOWN = 'UNKNOWN';
    public const STATE_SIMULATED = 'SIMULATED'; // Legacy backward-compatibility alias

    public const FRESHNESS_STATES = [
        self::STATE_FRESH,
        self::STATE_DELAYED,
        self::STATE_STALE,
        self::STATE_UNAVAILABLE,
        self::STATE_UNKNOWN,
    ];

    // Dimension C: Provenance
    public const PROVENANCE_OFFICIAL = 'OFFICIAL';
    public const PROVENANCE_OBSERVED = 'OBSERVED';
    public const PROVENANCE_COMMUNITY_REPORT = 'COMMUNITY_REPORT';
    public const PROVENANCE_SENTRAVAX_INSIGHT = 'SENTRAVAX_INSIGHT';
    public const PROVENANCE_SIMULATED = 'SIMULATED';
    public const PROVENANCE_CURATED_REFERENCE = 'CURATED_REFERENCE';

    public const PROVENANCE_TYPES = [
        self::PROVENANCE_OFFICIAL,
        self::PROVENANCE_OBSERVED,
        self::PROVENANCE_COMMUNITY_REPORT,
        self::PROVENANCE_SENTRAVAX_INSIGHT,
        self::PROVENANCE_SIMULATED,
        self::PROVENANCE_CURATED_REFERENCE,
    ];

    /**
     * Determine standardized three-dimensional classification:
     * A. Connectivity: LIVE, STATIC, OFFLINE, UNKNOWN
     * B. Freshness: FRESH, DELAYED, STALE, UNAVAILABLE, UNKNOWN
     * C. Provenance: OFFICIAL, OBSERVED, COMMUNITY_REPORT, SENTRAVAX_INSIGHT, SIMULATED, CURATED_REFERENCE
     *
     * @return array{
     *     connectivity_state: string,
     *     freshness_state: string,
     *     provenance_type: string,
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
        $name = strtolower($dataSource->name ?? '');
        $provider = strtolower($dataSource->provider ?? '');
        $sourceType = strtolower($dataSource->source_type ?? '');

        // 1. Permanent Simulated / Demonstration Data
        if ($dataSource->is_simulated || $sourceType === 'curated') {
            return [
                'connectivity_state' => self::CONNECTIVITY_OFFLINE,
                'freshness_state' => self::STATE_UNKNOWN,
                'provenance_type' => self::PROVENANCE_SIMULATED,
                'observed_at' => $dataSource->last_observed_at?->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => 0,
                'threshold_delayed_minutes' => 0,
                'is_simulated' => true,
                'minutes_since_last_sync' => null,
                'explanation' => 'Data skenario demonstrasi terkurasi lokal berlabel simulasi permanen (konektivitas offline, tidak menggunakan telemetri live).',
            ];
        }

        // 2. Inactive / Disabled integration
        if ($dataSource->status === 'inactive') {
            $provenance = $this->resolveProvenance($dataSource);
            return [
                'connectivity_state' => self::CONNECTIVITY_OFFLINE,
                'freshness_state' => self::STATE_UNAVAILABLE,
                'provenance_type' => $provenance,
                'observed_at' => $dataSource->last_observed_at?->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => 0,
                'threshold_delayed_minutes' => 0,
                'is_simulated' => false,
                'minutes_since_last_sync' => null,
                'explanation' => 'Integrasi dinonaktifkan oleh administrator (status inactive).',
            ];
        }

        // 3. PVMBG & Copernicus/InSAR: Strictly Curated Reference & Static Connectivity
        // (Do NOT claim LIVE connection or real-time sensor observation)
        $isPvmbg = str_contains($name, 'pvmbg') || str_contains($provider, 'pvmbg') || str_contains($name, 'volcanic');
        $isInSar = str_contains($name, 'insar') || str_contains($provider, 'copernicus') || str_contains($name, 'sentinel');

        if ($isPvmbg || $isInSar) {
            $label = $isPvmbg ? 'PVMBG Geologi & Vulkanologi' : 'InSAR Sentinel-1 Copernicus';
            $obsDate = $dataSource->last_observed_at?->toIso8601String();
            
            // If observation timestamp is unprovable, freshness is strictly UNKNOWN
            $freshness = $obsDate ? self::STATE_STALE : self::STATE_UNKNOWN;
            $notLiveNotice = $isPvmbg ? 'bukan koneksi live sensor real-time' : 'bukan telemetri instan live';
            $explanation = $obsDate
                ? sprintf('Dataset referensi terkurasi %s (baseline statis tanggal acuan %s, %s).', $label, $obsDate, $notLiveNotice)
                : sprintf('Dataset referensi terkurasi %s (baseline statis, %s; timestamp observasi sensor tidak dapat dibuktikan sehingga berstatus UNKNOWN).', $label, $notLiveNotice);

            return [
                'connectivity_state' => self::CONNECTIVITY_STATIC,
                'freshness_state' => $freshness,
                'provenance_type' => self::PROVENANCE_CURATED_REFERENCE,
                'observed_at' => $obsDate,
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => 0,
                'threshold_delayed_minutes' => 0,
                'is_simulated' => false,
                'minutes_since_last_sync' => null,
                'explanation' => $explanation,
            ];
        }

        // 4. Uninitialized or Never Polled Source
        if (! $dataSource->last_successful_at) {
            $latestRun = $dataSource->relationLoaded('syncRuns') 
                ? $dataSource->syncRuns->first() 
                : $dataSource->syncRuns()->latest()->first();

            $provenance = $this->resolveProvenance($dataSource);
            $connectivity = $this->resolveConnectivity($dataSource);

            if ($latestRun && $latestRun->status === 'FAILED') {
                return [
                    'connectivity_state' => self::CONNECTIVITY_UNKNOWN,
                    'freshness_state' => self::STATE_UNAVAILABLE,
                    'provenance_type' => $provenance,
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
                'connectivity_state' => $connectivity,
                'freshness_state' => self::STATE_UNKNOWN,
                'provenance_type' => $provenance,
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

        // 5. Live Feed (BMKG API/CAP) Threshold Resolution
        [$freshMinutes, $delayedMinutes] = $this->resolveThresholds($dataSource);

        $now = now();
        $isFutureSync = $dataSource->last_successful_at->isAfter($now);
        $syncFutureSkewMinutes = $isFutureSync ? (int) $now->diffInMinutes($dataSource->last_successful_at) : 0;
        $provenance = $this->resolveProvenance($dataSource);
        $connectivity = $this->resolveConnectivity($dataSource);

        // Clock-skew policy for sync timestamp: Allow maximum 5 minutes clock drift
        if ($isFutureSync && $syncFutureSkewMinutes > 5) {
            return [
                'connectivity_state' => $connectivity,
                'freshness_state' => self::STATE_UNKNOWN,
                'provenance_type' => $provenance,
                'observed_at' => ($dataSource->last_observed_at ?? $dataSource->last_successful_at)?->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => $freshMinutes,
                'threshold_delayed_minutes' => $delayedMinutes,
                'is_simulated' => false,
                'minutes_since_last_sync' => -$syncFutureSkewMinutes,
                'explanation' => sprintf('Timestamp sinkronisasi masa depan tidak wajar (+%d menit dari waktu sistem). Dianggap anomali temporal.', $syncFutureSkewMinutes),
            ];
        }

        // Observation timestamp validation:
        // Missing, null, or unverifiable observation timestamp must be classified as UNKNOWN
        if (! $dataSource->last_observed_at) {
            return [
                'connectivity_state' => $connectivity,
                'freshness_state' => self::STATE_UNKNOWN,
                'provenance_type' => $provenance,
                'observed_at' => null,
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => $freshMinutes,
                'threshold_delayed_minutes' => $delayedMinutes,
                'is_simulated' => false,
                'minutes_since_last_sync' => (int) $dataSource->last_successful_at->diffInMinutes($now),
                'explanation' => 'Timestamp observasi sumber tidak tersedia atau tidak dapat diverifikasi (status UNKNOWN).',
            ];
        }

        // Clock-skew policy for observation timestamp: Allow maximum 5 minutes clock drift
        $isFutureObs = $dataSource->last_observed_at->isAfter($now);
        $obsFutureSkewMinutes = $isFutureObs ? (int) $now->diffInMinutes($dataSource->last_observed_at) : 0;
        if ($isFutureObs && $obsFutureSkewMinutes > 5) {
            return [
                'connectivity_state' => $connectivity,
                'freshness_state' => self::STATE_UNKNOWN,
                'provenance_type' => $provenance,
                'observed_at' => $dataSource->last_observed_at->toIso8601String(),
                'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
                'created_at' => $dataSource->created_at?->toIso8601String(),
                'threshold_fresh_minutes' => $freshMinutes,
                'threshold_delayed_minutes' => $delayedMinutes,
                'is_simulated' => false,
                'minutes_since_last_sync' => (int) $dataSource->last_successful_at->diffInMinutes($now),
                'explanation' => sprintf('Timestamp observasi masa depan tidak wajar (+%d menit dari waktu sistem). Dianggap anomali temporal.', $obsFutureSkewMinutes),
            ];
        }

        // Determine data age based on observation time and sync time:
        // Latency HTTP does NOT determine freshness.
        // Old data remains STALE even if HTTP request succeeded recently.
        $obsAgeMinutes = $isFutureObs ? 0 : (int) $dataSource->last_observed_at->diffInMinutes($now);
        $syncAgeMinutes = $isFutureSync ? 0 : (int) $dataSource->last_successful_at->diffInMinutes($now);
        $effectiveDataAgeMinutes = max($obsAgeMinutes, $syncAgeMinutes);

        if ($effectiveDataAgeMinutes <= $freshMinutes) {
            $state = self::STATE_FRESH;
            $explanation = sprintf('Data aktif dan segar (umur efektif observasi %d menit, ambang batas %d menit).', $effectiveDataAgeMinutes, $freshMinutes);
        } elseif ($effectiveDataAgeMinutes <= $delayedMinutes) {
            $state = self::STATE_DELAYED;
            $explanation = sprintf('Data mengalami keterlambatan (%d menit lalu, ambang toleransi %d menit).', $effectiveDataAgeMinutes, $delayedMinutes);
        } else {
            $state = self::STATE_STALE;
            $explanation = sprintf('Data usang (stale) melebihi batas toleransi (%d menit lalu > %d menit).', $effectiveDataAgeMinutes, $delayedMinutes);
        }

        return [
            'connectivity_state' => $connectivity,
            'freshness_state' => $state,
            'provenance_type' => $provenance,
            'observed_at' => $dataSource->last_observed_at->toIso8601String(),
            'fetched_at' => $dataSource->last_fetched_at?->toIso8601String(),
            'created_at' => $dataSource->created_at?->toIso8601String(),
            'threshold_fresh_minutes' => $freshMinutes,
            'threshold_delayed_minutes' => $delayedMinutes,
            'is_simulated' => false,
            'minutes_since_last_sync' => $effectiveDataAgeMinutes,
            'explanation' => $explanation,
        ];
    }

    /**
     * Resolve transport/connectivity dimension (LIVE, STATIC, OFFLINE, UNKNOWN).
     */
    public function resolveConnectivity(DataSource $dataSource): string
    {
        if ($dataSource->status === 'inactive' || $dataSource->is_simulated || $dataSource->source_type === 'curated') {
            return self::CONNECTIVITY_OFFLINE;
        }

        $name = strtolower($dataSource->name ?? '');
        $provider = strtolower($dataSource->provider ?? '');
        $sourceType = strtolower($dataSource->source_type ?? '');

        if (str_contains($name, 'pvmbg') || str_contains($provider, 'pvmbg') || str_contains($name, 'insar') || str_contains($provider, 'copernicus')) {
            return self::CONNECTIVITY_STATIC;
        }

        if (in_array($sourceType, ['api', 'cap'], true)) {
            return self::CONNECTIVITY_LIVE;
        }

        if ($sourceType === 'stream' || $sourceType === 'satellite') {
            return self::CONNECTIVITY_STATIC;
        }

        return $dataSource->endpoint_url ? self::CONNECTIVITY_LIVE : self::CONNECTIVITY_UNKNOWN;
    }

    /**
     * Resolve provenance dimension:
     * OFFICIAL, OBSERVED, COMMUNITY_REPORT, SENTRAVAX_INSIGHT, SIMULATED, CURATED_REFERENCE.
     */
    public function resolveProvenance(DataSource $dataSource): string
    {
        if ($dataSource->is_simulated) {
            return self::PROVENANCE_SIMULATED;
        }

        $name = strtolower($dataSource->name ?? '');
        $provider = strtolower($dataSource->provider ?? '');
        $sourceType = strtolower($dataSource->source_type ?? '');

        if ($sourceType === 'curated') {
            return self::PROVENANCE_SIMULATED;
        }

        if (str_contains($name, 'pvmbg') || str_contains($provider, 'pvmbg') || str_contains($name, 'insar') || str_contains($provider, 'copernicus')) {
            return self::PROVENANCE_CURATED_REFERENCE;
        }

        if (str_contains($provider, 'bmkg') || str_contains($name, 'bmkg')) {
            if (str_contains($name, 'radar') || str_contains($name, 'weather') || str_contains($name, 'cuaca')) {
                return self::PROVENANCE_OBSERVED;
            }
            return self::PROVENANCE_OFFICIAL;
        }

        if (str_contains($provider, 'bnpb') || str_contains($name, 'bnpb')) {
            return self::PROVENANCE_OFFICIAL;
        }

        return self::PROVENANCE_CURATED_REFERENCE;
    }

    /**
     * Resolve source-specific thresholds based on physical nature of hazard data.
     *
     * @return array{0: int, 1: int} [freshMinutes, delayedMinutes]
     */
    protected function resolveThresholds(DataSource $dataSource): array
    {
        $name = strtolower($dataSource->name ?? '');
        $category = strtolower($dataSource->category ?? '');

        if (str_contains($name, 'tews') || $category === 'seismology') {
            // Rapid real-time seismology feed
            return [30, 120];
        }

        if (str_contains($name, 'radar') || $category === 'weather') {
            // Fast convective weather observation
            return [60, 180];
        }

        if (str_contains($name, 'cap') || str_contains($name, 'alert')) {
            // Early warning CAP broadcast feed
            return [60, 240];
        }

        return [60, 240];
    }
}
