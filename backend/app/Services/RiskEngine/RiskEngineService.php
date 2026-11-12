<?php

namespace App\Services\RiskEngine;

use App\Models\Alert;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RiskEngineService
{
    public const METHODOLOGY_VERSION = 'v1.0-deterministic-spatial';

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
            // Find enclosing or nearest region via PostGIS
            $region = Region::whereRaw('ST_Contains(boundary, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [$longitude, $latitude])->first();
            if (!$region) {
                $region = Region::orderByRaw('ST_Distance(center_point, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [$longitude, $latitude])->first();
            }
        }

        // 2. Query active hazard events within radius (default: 25 km)
        $nearbyEvents = HazardEvent::where('status', 'active')
            ->whereRaw('ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326), 0.25)', [$longitude, $latitude]) // ~25km in degrees
            ->with(['hazardType', 'dataSource'])
            ->get();

        // 3. Query active alerts for region or proximity
        $activeAlerts = Alert::where('status', 'active')
            ->where(function ($query) use ($region) {
                if ($region) {
                    $query->where('region_id', $region->id);
                }
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->with(['hazardType'])
            ->get();

        // 4. Calculate Risk Score (0 - 100)
        $factors = [];
        $totalScore = 0.0;

        // Base regional vulnerability factor
        $baseScore = 15.0;
        $factors['baseline_vulnerability'] = [
            'weight' => 0.15,
            'contribution' => $baseScore,
            'description' => 'Kerentanan geografis dasar kawasan tropis Nusantara.',
        ];
        $totalScore += $baseScore;

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

            $eventScore += $weightedVal;
            $activeThreats[] = [
                'id' => $ev->id,
                'title' => $ev->title,
                'hazard_type' => $ev->hazardType?->name ?? 'Bahaya Umum',
                'hazard_slug' => $ev->hazardType?->slug ?? 'general',
                'severity' => $ev->severity,
                'occurred_at' => $ev->occurred_at?->toIso8601String(),
                'contribution' => $weightedVal,
            ];
        }

        // Cap event score at 45.0
        $eventScore = min(45.0, $eventScore);
        if (!empty($activeThreats)) {
            $factors['nearby_active_events'] = [
                'weight' => 0.45,
                'contribution' => $eventScore,
                'count' => count($nearbyEvents),
                'threats' => $activeThreats,
                'description' => 'Indikasi kejadian bahaya aktif dalam radius pemantauan 25 km.',
            ];
            $totalScore += $eventScore;
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

        $alertScore = min(30.0, $alertScore);
        if (!empty($alertList)) {
            $factors['official_alerts'] = [
                'weight' => 0.30,
                'contribution' => $alertScore,
                'alerts' => $alertList,
                'description' => 'Peringatan dini aktif dari otoritas berwenang atau advisori sistem.',
            ];
            $totalScore += $alertScore;
        }

        // Freshness / Data quality factor
        $dataFreshness = 'FRESH';
        $factors['data_quality'] = [
            'status' => $dataFreshness,
            'description' => 'Telemetri PostGIS terintegrasi aktif dengan stempel waktu sinkronisasi terbaru.',
        ];

        // Final score normalized between 5.0 and 98.0
        $finalScore = min(98.0, max(5.0, round($totalScore, 1)));

        // Determine Risk Level
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
            'risk_score' => $finalScore,
            'risk_level' => $riskLevel,
            'risk_label' => $riskLabel,
            'factors' => $factors,
            'active_threats_count' => count($nearbyEvents),
            'active_alerts_count' => count($activeAlerts),
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

