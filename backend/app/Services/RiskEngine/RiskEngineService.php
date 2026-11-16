<?php

namespace App\Services\RiskEngine;

use App\Models\Alert;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RiskEngineService
{
    public const METHODOLOGY_VERSION = 'v1.0-deterministic-spatial';
    public const PILOT_ASSOCIATION_RADIUS_METERS = 45000; // 45 km radius from region center point
    public const HAZARD_SEARCH_RADIUS_METERS = 25000;     // 25 km active hazard detection radius

    /**
     * Evaluate multi-hazard risk for a specific geographic coordinate.
     *
     * @param float $latitude
     * @param float $longitude
     * @param int|null $regionId
     * @return array<string, mixed>
     */
    public function evaluateLocationRisk(float $latitude, float $longitude, ?int $regionId = null): array
    {
        // 1. Identify region if not provided
        $region = null;
        if ($regionId) {
            $region = Region::find($regionId);
        }

        if (!$region) {
            // Find enclosing region via PostGIS polygon (if boundary geometry is populated)
            $region = Region::whereNotNull('boundary')
                ->whereRaw('ST_Contains(boundary, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [$longitude, $latitude])
                ->first();

            if (!$region) {
                // Associate with nearest pilot reference point if within pilot association radius (<= 45 km in meters via PostGIS geography)
                $nearest = Region::selectRaw('*, ST_Distance(center_point::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as dist_meters', [$longitude, $latitude])
                    ->orderBy('dist_meters')
                    ->first();
                if ($nearest && ($nearest->dist_meters ?? 999999) <= self::PILOT_ASSOCIATION_RADIUS_METERS) {
                    $region = $nearest;
                }
            }
        }

        // 2. Query active hazard events within exact 25 km radius via PostGIS geography
        $nearbyEvents = HazardEvent::where('status', 'active')
            ->whereRaw('ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)', [$longitude, $latitude, self::HAZARD_SEARCH_RADIUS_METERS])
            ->with(['hazardType', 'dataSource'])
            ->get();

        // 3. Query active alerts for region or proximity
        $activeAlerts = Alert::where('status', 'active')
            ->where(function ($query) use ($region) {
                if ($region) {
                    $query->where('region_id', $region->id);
                } else {
                    $query->whereNull('region_id'); // Nationwide broadcast only if location outside defined regions
                }
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->with(['hazardType'])
            ->get();

        // 4. Calculate Risk Score (0 - 100) with deterministic decimal precision
        $factors = [];

        // Base regional vulnerability factor (constant baseline)
        $baseScore = 15.0;
        $factors['baseline_vulnerability'] = [
            'weight' => 0.15,
            'contribution' => 15.0,
            'description' => 'Kerentanan geografis dasar kawasan tropis Nusantara.',
        ];

        // Event proximity and severity factors
        $eventScore = 0.0;
        $activeThreats = [];

        foreach ($nearbyEvents as $ev) {
            $sevWeight = match ($ev->severity) {
                'high' => 25.0,
                'medium' => 15.0,
                'low' => 8.0,
                default => 5.0,
            };

            // Recency decay: older events contribute slightly less
            $hoursOld = max(1, Carbon::parse($ev->occurred_at)->diffInHours(now()));
            $recencyMultiplier = max(0.4, 1.0 - ($hoursOld * 0.03));
            $weightedVal = round($sevWeight * $recencyMultiplier, 1);

            $sourceType = strtolower($ev->dataSource?->source_type ?? '');
            $isLiveFeed = ($sourceType === 'api' || $sourceType === 'stream');
            $provenanceStatus = $isLiveFeed ? 'LIVE' : 'STATIC';
            $provenanceLabel = $isLiveFeed
                ? (($ev->hazardType?->slug ?? '') === 'earthquake' ? 'LIVE (BMKG TEWS)' : 'LIVE (TELEMETRI)')
                : 'STATIC (TERKURASI)';

            $eventScore += $weightedVal;
            $activeThreats[] = [
                'id' => $ev->id,
                'title' => $ev->title,
                'hazard_type' => $ev->hazardType?->name ?? 'Bahaya Umum',
                'hazard_slug' => $ev->hazardType?->slug ?? 'general',
                'severity' => $ev->severity,
                'occurred_at' => $ev->occurred_at?->toIso8601String(),
                'contribution' => $weightedVal,
                'data_source_id' => $ev->data_source_id,
                'source_name' => $ev->dataSource?->name ?? 'Data Observasi Terkurasi SENTRAVAX',
                'provider_name' => $ev->dataSource?->provider ?? 'SENTRAVAX Local Baseline Observation',
                'provenance_status' => $provenanceStatus,
                'provenance_label' => $provenanceLabel,
            ];
        }

        // 5. Factor Contributions with Guaranteed Decimal Consistency
        $baseContribution = round($baseScore, 1);
        $eventContribution = (!empty($activeThreats)) ? min(45.0, round($eventScore, 1)) : 0.0;

        $factors['baseline_vulnerability'] = [
            'weight' => 0.15,
            'contribution' => $baseContribution,
            'description' => 'Kerentanan geografis dasar kawasan tropis Nusantara.',
        ];

        if (!empty($activeThreats)) {
            $factors['nearby_active_events'] = [
                'weight' => 0.45,
                'contribution' => $eventContribution,
                'count' => count($nearbyEvents),
                'threats' => $activeThreats,
                'description' => 'Indikasi kejadian bahaya aktif dalam radius pemantauan 25 km.',
            ];
        }

        // Official alerts factor
        $alertScore = 0.0;
        $alertList = [];
        foreach ($activeAlerts as $al) {
            $alertVal = match ($al->broadcast_level) {
                'warning' => 25.0,
                'watch' => 15.0,
                default => 8.0,
            };
            $alertScore += $alertVal;
            $alertList[] = [
                'id' => $al->id,
                'title' => $al->title,
                'broadcast_level' => $al->broadcast_level,
                'alert_class' => $al->alert_class,
                'starts_at' => $al->starts_at?->toIso8601String(),
            ];
        }

        $alertContribution = (!empty($alertList)) ? min(30.0, round($alertScore, 1)) : 0.0;
        if (!empty($alertList)) {
            $factors['official_alerts'] = [
                'weight' => 0.30,
                'contribution' => $alertContribution,
                'alerts' => $alertList,
                'description' => 'Peringatan dini aktif dari otoritas berwenang atau advisori sistem.',
            ];
        }

        // Reconciled Total Score: exact sum of the stored factor contributions rounded to 1 decimal
        $totalScore = round($baseContribution + $eventContribution + $alertContribution, 1);
        $finalScore = min(98.0, max(5.0, $totalScore));

        // Coverage and Actual Data Freshness Gatekeeper
        $isOutOfCoverage = ($region === null);

        if ($isOutOfCoverage) {
            $dataFreshness = 'UNAVAILABLE';
            $assessmentStatus = 'INSUFFICIENT_DATA';
            $dataQualityDesc = 'Di luar radius asosiasi wilayah pilot. Tidak tersedia data titik acuan regional.';
        } else {
            // Check freshness of live feeds based on actual timestamps
            $bmkgTews = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first()
                ?? DataSource::where('name', 'BMKG TEWS Open Data API')->first();

            $hasUnavailableFeed = false;
            $hasStaleFeed = false;

            if ($bmkgTews) {
                if ($bmkgTews->status !== 'active' || ! $bmkgTews->last_successful_at) {
                    $hasUnavailableFeed = true;
                } else {
                    $diffMins = Carbon::parse($bmkgTews->last_successful_at)->diffInMinutes(now());
                    if ($diffMins > 1440) { // > 24 hours
                        $hasUnavailableFeed = true;
                    } elseif ($diffMins > 60) { // > 1 hour
                        $hasStaleFeed = true;
                    }
                }
            }

            // Also inspect live feeds associated with nearby events
            foreach ($nearbyEvents as $ev) {
                if ($ev->dataSource && in_array($ev->dataSource->source_type, ['api', 'stream'])) {
                    if ($ev->dataSource->status !== 'active' || ! $ev->dataSource->last_successful_at) {
                        $hasUnavailableFeed = true;
                    } else {
                        $diffMins = Carbon::parse($ev->dataSource->last_successful_at)->diffInMinutes(now());
                        if ($diffMins > 1440) {
                            $hasUnavailableFeed = true;
                        } elseif ($diffMins > 60) {
                            $hasStaleFeed = true;
                        }
                    }
                }
            }

            if ($hasUnavailableFeed) {
                $dataFreshness = 'UNAVAILABLE';
                $assessmentStatus = 'INSUFFICIENT_DATA';
                $dataQualityDesc = 'Sumber data telemetri kritis tidak tersedia atau koneksi terputus. Data tidak mencukupi untuk penilaian multi-hazard.';
            } elseif ($hasStaleFeed) {
                $dataFreshness = 'STALE';
                $assessmentStatus = 'ASSESSED';
                $dataQualityDesc = 'Data telemetri tersedia di PostGIS tetapi sinkronisasi live feed tertunda (> 60 menit lalu).';
            } else {
                $dataFreshness = 'FRESH';
                $assessmentStatus = 'ASSESSED';
                $dataQualityDesc = 'Terhubung dalam radius asosiasi wilayah pilot terintegrasi PostGIS dengan stempel waktu mutakhir.';
            }
        }

        $factors['data_quality'] = [
            'status' => $dataFreshness,
            'description' => $dataQualityDesc,
        ];

        // Determine Risk Level & Honest Label
        if ($assessmentStatus === 'INSUFFICIENT_DATA') {
            $riskLevel = 'insufficient_data';
            $riskLabel = count($nearbyEvents) > 0
                ? 'Data Tidak Mencukupi (Terdeteksi Kejadian BMKG)'
                : ($isOutOfCoverage
                    ? 'Data Tidak Mencukupi (Di Luar Wilayah Pilot)'
                    : 'Data Tidak Mencukupi (Telemetri Tidak Tersedia)');
        } else {
            $riskLevel = match (true) {
                $finalScore >= 75.0 => 'critical',
                $finalScore >= 50.0 => 'high',
                $finalScore >= 25.0 => 'medium',
                default => 'low',
            };

            $riskLabel = match ($riskLevel) {
                'critical' => 'Awas (Risiko Sangat Tinggi)',
                'high' => 'Siaga (Risiko Tinggi)',
                'medium' => 'Waspada (Perlu Perhatian)',
                default => 'Normal (Risiko Rendah)',
            };
        }

        $coverageNote = $isOutOfCoverage
            ? 'Koordinat berada di luar radius asosiasi wilayah pilot (<= 45 km dari titik acuan regional DKI Jakarta, Jawa Barat, Banten).'
            : "Koordinat berada dalam radius asosiasi wilayah pilot (<= 45 km dari titik acuan regional {$region->name}). Poligon batas administratif belum diaktifkan.";

        return [
            'region' => $region ? [
                'id' => $region->id,
                'name' => $region->name,
                'code' => $region->code,
                'level' => $region->level,
            ] : null,
            'coordinates' => [
                'latitude' => $latitude,
                'longitude' => $longitude,
            ],
            'assessment_status' => $assessmentStatus,
            'risk_score' => $finalScore,
            'risk_level' => $riskLevel,
            'risk_label' => $riskLabel,
            'factors' => $factors,
            'active_threats_count' => count($nearbyEvents),
            'active_alerts_count' => count($activeAlerts),
            'coverage' => [
                'is_pilot_coverage' => !$isOutOfCoverage,
                'coverage_type' => $isOutOfCoverage ? 'OUT_OF_COVERAGE' : 'PILOT_ASSOCIATION_RADIUS',
                'pilot_association_radius_km' => 45,
                'hazard_search_radius_km' => 25,
                'administrative_polygon_active' => false,
                'coverage_note' => $coverageNote,
            ],
            'methodology_version' => self::METHODOLOGY_VERSION,
            'data_freshness' => $dataFreshness,
            'assessed_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Evaluate and persist regional risk assessment for a specific hazard type.
     */
    public function evaluateAndPersistRegionalRisk(int $regionId, int $hazardTypeId, ?string $title = null): RiskAssessment
    {
        $region = Region::findOrFail($regionId);
        $hazardType = HazardType::findOrFail($hazardTypeId);

        // Fetch location of region center
        $center = DB::selectOne("
            SELECT ST_X(center_point) as lon, ST_Y(center_point) as lat 
            FROM regions 
            WHERE id = ?
        ", [$regionId]);

        $lon = $center?->lon ?? 106.8456;
        $lat = $center?->lat ?? -6.2088;

        $eval = $this->evaluateLocationRisk($lat, $lon, $regionId);

        return RiskAssessment::updateOrCreate(
            ['region_id' => $regionId, 'hazard_type_id' => $hazardTypeId],
            [
                'title' => $title ?? ('Penilaian Risiko ' . $hazardType->name . ' ' . $region->name),
                'risk_score' => $eval['risk_score'],
                'risk_level' => $eval['risk_level'],
                'methodology_version' => self::METHODOLOGY_VERSION,
                'impact_radius_meters' => 2000,
                'affected_population_estimate' => 35000,
                'calculation_factors' => $eval['factors'],
                'assessed_at' => now(),
            ]
        );
    }
}

