<?php

namespace App\Services\ExternalData;

use App\Models\Alert;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Services\Notification\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use SimpleXMLElement;

class CapAdapter
{
    public const DEFAULT_BMKG_CAP_FEED = 'https://www.bmkg.go.id/alerts/nowcast/id';
    public const CAP_11_NAMESPACE = 'urn:oasis:names:tc:emergency:cap:1.1';
    public const CAP_12_NAMESPACE = 'urn:oasis:names:tc:emergency:cap:1.2';

    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Synchronize and ingest Common Alerting Protocol (CAP) feed.
     *
     * @return array<string, mixed>
     */
    public function sync(DataSource $dataSource): array
    {
        $startTime = microtime(true);
        $feedUrl = $dataSource->endpoint_url ?: self::DEFAULT_BMKG_CAP_FEED;
        $itemsFetched = 0;
        $itemsPersisted = 0;
        $latestObservedAt = null;

        try {
            // Fetch feed from official BMKG endpoint with 5s timeout
            $response = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'SENTRAVAX/1.0 (Disaster Resilience System; https://sentravax.id)',
                    'Accept' => 'application/xml, text/xml, application/rss+xml',
                ])
                ->get($feedUrl);

            if ($response->successful()) {
                $feedContent = $response->body();
                $xml = @simplexml_load_string($feedContent);

                if ($xml !== false) {
                    // Check if feed is an RSS wrapper containing links to CAP detail XML files
                    if (isset($xml->channel->item)) {
                        $items = $xml->channel->item;
                        $itemsFetched = count($items);
                        // Process the most recent items (limit to 5 in one sync cycle to prevent rate-limit throttling)
                        $processLimit = min(5, $itemsFetched);

                        for ($i = 0; $i < $processLimit; $i++) {
                            $item = $items[$i];
                            $detailUrl = (string) $item->link;
                            $guid = (string) ($item->guid ?? '');

                            if (!empty($detailUrl)) {
                                try {
                                    $detailResp = Http::timeout(4)
                                        ->withHeaders([
                                            'User-Agent' => 'SENTRAVAX/1.0 (Disaster Resilience System; https://sentravax.id)',
                                        ])
                                        ->get($detailUrl);

                                    if ($detailResp->successful()) {
                                        $alert = $this->parseAndPersistCapXml($detailResp->body(), $dataSource, $detailUrl, $guid);
                                        if ($alert) {
                                            $itemsPersisted++;
                                            if (!$latestObservedAt || $alert->starts_at?->isAfter($latestObservedAt)) {
                                                $latestObservedAt = $alert->starts_at;
                                            }
                                        }
                                    }
                                } catch (\Throwable $detailErr) {
                                    Log::warning("Failed to fetch individual CAP detail from {$detailUrl}: " . $detailErr->getMessage());
                                }
                            }
                        }
                    } elseif ($this->isCapAlertXml($xml)) {
                        // Direct CAP XML payload
                        $itemsFetched = 1;
                        $alert = $this->parseAndPersistCapXml($feedContent, $dataSource, $feedUrl);
                        if ($alert) {
                            $itemsPersisted++;
                            $latestObservedAt = $alert->starts_at;
                        }
                    }

                    $durationMs = (int) round((microtime(true) - $startTime) * 1000);
                    $observedAt = $latestObservedAt ?? now();

                    $dataSource->update([
                        'status' => 'active',
                        'last_fetched_at' => now(),
                        'last_successful_at' => now(),
                        'last_observed_at' => $observedAt,
                    ]);

                    return [
                        'status' => 'SUCCESS',
                        'freshness_state' => 'LIVE',
                        'items_fetched' => $itemsFetched,
                        'items_persisted' => $itemsPersisted,
                        'duration_ms' => $durationMs,
                        'observed_at' => $observedAt,
                        'provenance' => [
                            'endpoint' => $feedUrl,
                            'protocol' => 'Common Alerting Protocol (CAP)',
                            'format' => 'OASIS CAP v1.1/v1.2 XML',
                            'provider' => $dataSource->provider,
                            'verified_authority' => true,
                        ],
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('CAP feed sync failed: ' . $e->getMessage());
        }

        $durationMs = (int) round((microtime(true) - $startTime) * 1000);
        $dataSource->update([
            'last_fetched_at' => now(),
        ]);

        return [
            'status' => 'FAILED',
            'freshness_state' => 'UNAVAILABLE',
            'items_fetched' => 0,
            'items_persisted' => 0,
            'duration_ms' => $durationMs,
            'error_message' => 'CAP feed endpoint unreachable or returned invalid XML',
            'provenance' => [
                'endpoint' => $feedUrl,
                'note' => 'CAP feed offline or timed out; retained existing baseline warnings without claiming live status.',
            ],
        ];
    }

    /**
     * Parse raw CAP XML string and persist into SENTRAVAX alert model.
     */
    public function parseAndPersistCapXml(string $xmlContent, ?DataSource $dataSource = null, ?string $sourceUrl = null, ?string $fallbackId = null): ?Alert
    {
        // Suppress libxml errors and load cleanly
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($xmlContent);
        if ($xml === false) {
            Log::warning('Invalid XML content passed to CAP parser.');
            libxml_clear_errors();
            return null;
        }

        // Register default namespace if present (CAP 1.1 or CAP 1.2)
        $namespaces = $xml->getDocNamespaces(true);
        $capNamespace = null;
        foreach ($namespaces as $prefix => $ns) {
            if (str_contains($ns, 'emergency:cap')) {
                $capNamespace = $ns;
                break;
            }
        }

        // Extract root elements (handling namespaces transparently)
        $identifier = $this->getNodeValue($xml, 'identifier') ?: $fallbackId;
        $sender = $this->getNodeValue($xml, 'sender');
        $sentStr = $this->getNodeValue($xml, 'sent');
        $status = $this->getNodeValue($xml, 'status') ?: 'Actual';
        $msgType = $this->getNodeValue($xml, 'msgType') ?: 'Alert';
        $scope = $this->getNodeValue($xml, 'scope') ?: 'Public';
        $references = $this->getNodeValue($xml, 'references');

        if (empty($identifier)) {
            Log::warning('CAP message missing mandatory identifier field.');
            return null;
        }

        // Parse sent timestamp with timezone
        $sentAt = null;
        if (!empty($sentStr)) {
            try {
                $sentAt = Carbon::parse($sentStr);
            } catch (\Throwable) {
                $sentAt = now();
            }
        } else {
            $sentAt = now();
        }

        // Handle Cancel message
        if (strcasecmp($msgType, 'Cancel') === 0) {
            return $this->handleCancelMessage($identifier, $references, $sentAt);
        }

        // Extract info block (support multi-language, preference for Indonesian 'id' / 'id-ID')
        $infoNode = $this->selectBestInfoNode($xml);
        if (!$infoNode) {
            Log::warning("CAP message {$identifier} contains no valid info elements.");
            return null;
        }

        $category = $this->getNodeValue($infoNode, 'category') ?: 'Met';
        $event = $this->getNodeValue($infoNode, 'event') ?: 'Peringatan Dini Cuaca';
        $urgency = $this->getNodeValue($infoNode, 'urgency') ?: 'Immediate';
        $severity = $this->getNodeValue($infoNode, 'severity') ?: 'Moderate';
        $certainty = $this->getNodeValue($infoNode, 'certainty') ?: 'Observed';
        $headline = $this->getNodeValue($infoNode, 'headline') ?: $event;
        $description = $this->getNodeValue($infoNode, 'description') ?: $headline;
        $instruction = $this->getNodeValue($infoNode, 'instruction');
        $senderName = $this->getNodeValue($infoNode, 'senderName') ?: ($dataSource?->provider ?? 'Badan Meteorologi Klimatologi dan Geofisika (BMKG)');
        $web = $this->getNodeValue($infoNode, 'web') ?: $sourceUrl;

        $effectiveStr = $this->getNodeValue($infoNode, 'effective');
        $expiresStr = $this->getNodeValue($infoNode, 'expires');

        $startsAt = $sentAt;
        if (!empty($effectiveStr)) {
            try {
                $startsAt = Carbon::parse($effectiveStr);
            } catch (\Throwable) {}
        }

        $expiresAt = null;
        if (!empty($expiresStr)) {
            try {
                $expiresAt = Carbon::parse($expiresStr);
            } catch (\Throwable) {}
        }
        if (!$expiresAt) {
            $expiresAt = (clone $startsAt)->addHours(6);
        }

        // Extract Area and Polygon
        $areaNode = $infoNode->area ?? null;
        $areaDesc = $areaNode ? $this->getNodeValue($areaNode, 'areaDesc') : null;
        $polygonStr = $areaNode ? $this->getNodeValue($areaNode, 'polygon') : null;

        // Determine Alert Status
        $isExpired = $expiresAt->isPast();
        $isTestOrExercise = in_array(strtolower($status), ['exercise', 'test', 'draft']);

        $dbStatus = 'active';
        if ($isTestOrExercise) {
            $dbStatus = 'draft';
        } elseif ($isExpired) {
            $dbStatus = 'expired';
        }

        // Map Hazard Type
        $hazardType = $this->resolveHazardType($category, $event, $headline);

        // Map Region
        $region = $this->resolveRegion($areaDesc, $polygonStr);

        // Map Broadcast Level
        $broadcastLevel = $this->resolveBroadcastLevel($scope, $severity, $region);

        // Build structured provenance
        $provenance = [
            'identifier' => $identifier,
            'sender' => $sender,
            'sender_name' => $senderName,
            'sent' => $sentAt->toIso8601String(),
            'msg_type' => $msgType,
            'status' => $status,
            'scope' => $scope,
            'category' => $category,
            'event' => $event,
            'urgency' => $urgency,
            'severity' => $severity,
            'certainty' => $certainty,
            'area_desc' => $areaDesc,
            'polygon' => $polygonStr,
            'references' => $references,
            'namespace' => $capNamespace ?: self::CAP_12_NAMESPACE,
            'ingested_at' => now()->toIso8601String(),
            'data_source_id' => $dataSource?->id,
        ];

        // Linked Hazard Event for map & intelligence domain
        $hazardEvent = $this->resolveOrCreateHazardEvent($identifier, $headline, $hazardType, $region, $severity, $startsAt, $dataSource, $polygonStr);

        // Check if updating an existing alert by reference or identifier
        $existingAlert = null;
        if (!empty($references)) {
            $refParts = explode(',', $references);
            $refId = trim($refParts[1] ?? $refParts[0]);
            $existingAlert = Alert::where('external_identifier', $refId)->first();
        }
        if (!$existingAlert) {
            $existingAlert = Alert::where('external_identifier', $identifier)->first();
        }

        $alertData = [
            'external_identifier' => $identifier,
            'hazard_event_id' => $hazardEvent?->id,
            'region_id' => $region?->id,
            'hazard_type_id' => $hazardType?->id,
            'created_by' => null, // Official automated external CAP feed
            'title' => $headline,
            'sender_name' => $senderName,
            'message' => $description,
            'instruction' => $instruction,
            'area_description' => $areaDesc,
            'alert_class' => 'official_warning',
            'broadcast_level' => $broadcastLevel,
            'cap_urgency' => $urgency,
            'cap_severity' => $severity,
            'cap_certainty' => $certainty,
            'source_url' => $web,
            'polygon_coordinates' => $polygonStr,
            'raw_provenance' => $provenance,
            'status' => $dbStatus,
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
        ];

        if ($existingAlert) {
            $existingAlert->update($alertData);
            $alert = $existingAlert->fresh();
        } else {
            $alert = Alert::create($alertData);
        }

        // Trigger notification only if active official warning and not simulated/test
        if ($alert->status === 'active' && !$isTestOrExercise) {
            try {
                $this->notificationService->notifyOfficialWarning($alert);
            } catch (\Throwable $notifErr) {
                Log::warning("Notification dispatch failed for CAP alert {$identifier}: " . $notifErr->getMessage());
            }
        }

        return $alert;
    }

    /**
     * Handle Cancel message from CAP feed.
     */
    protected function handleCancelMessage(string $identifier, ?string $references, Carbon $cancelledAt): ?Alert
    {
        $targetAlert = null;

        if (!empty($references)) {
            $refParts = explode(',', $references);
            $refId = trim($refParts[1] ?? $refParts[0]);
            $targetAlert = Alert::where('external_identifier', $refId)->first();
        }

        if (!$targetAlert) {
            $targetAlert = Alert::where('external_identifier', $identifier)->first();
        }

        if ($targetAlert) {
            $targetAlert->update([
                'status' => 'cancelled',
                'expires_at' => $cancelledAt,
            ]);
            Log::info("CAP Alert {$targetAlert->id} cancelled by message {$identifier}.");
            return $targetAlert;
        }

        return null;
    }

    /**
     * Select the best <info> node from CAP XML (prioritizing Indonesian language).
     */
    protected function selectBestInfoNode(SimpleXMLElement $xml): ?SimpleXMLElement
    {
        if (!isset($xml->info)) {
            return null;
        }

        $infoNodes = $xml->info;
        if (count($infoNodes) === 1) {
            return $infoNodes[0];
        }

        foreach ($infoNodes as $node) {
            $lang = strtolower((string) ($node->language ?? ''));
            if ($lang === 'id' || $lang === 'in' || str_starts_with($lang, 'id-')) {
                return $node;
            }
        }

        return $infoNodes[0];
    }

    /**
     * Map CAP category and event string to SENTRAVAX HazardType.
     */
    protected function resolveHazardType(string $category, string $event, string $headline): ?HazardType
    {
        $text = strtolower($category . ' ' . $event . ' ' . $headline);

        if (str_contains($text, 'gempa') || str_contains($text, 'earthquake') || str_contains($text, 'geo')) {
            return HazardType::where('slug', 'earthquake')->first();
        }
        if (str_contains($text, 'banjir rob') || str_contains($text, 'pasang') || str_contains($text, 'tsunami')) {
            return HazardType::where('slug', 'coastal_flood')->first();
        }
        if (str_contains($text, 'banjir') || str_contains($text, 'flood') || str_contains($text, 'genangan')) {
            return HazardType::where('slug', 'flood')->first();
        }
        if (str_contains($text, 'longsor') || str_contains($text, 'landslide')) {
            return HazardType::where('slug', 'landslide')->first();
        }

        // Extreme weather (hujan lebat, angin kencang, puting beliung, petir)
        return HazardType::where('slug', 'extreme_weather')->first()
            ?? HazardType::first();
    }

    /**
     * Map CAP areaDesc or coordinates to a Monitored Region in SENTRAVAX.
     */
    protected function resolveRegion(?string $areaDesc, ?string $polygonStr): ?Region
    {
        if (!empty($areaDesc)) {
            $search = strtolower(trim($areaDesc));
            $matched = Region::whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])->first();
            if ($matched) {
                return $matched;
            }

            // Check against known province abbreviations or names
            if (str_contains($search, 'dki') || str_contains($search, 'jakarta')) {
                return Region::where('code', 'ID-JK')->first();
            }
            if (str_contains($search, 'jawa barat') || str_contains($search, 'jabar')) {
                return Region::where('code', 'ID-JB')->first();
            }
            if (str_contains($search, 'banten')) {
                return Region::where('code', 'ID-BT')->first();
            }
        }

        // Polygon centroid check if polygon coordinates available
        if (!empty($polygonStr)) {
            $centroid = $this->calculatePolygonCentroid($polygonStr);
            if ($centroid) {
                $nearest = DB::selectOne("
                    SELECT id FROM regions 
                    ORDER BY ST_Distance(center_point, ST_SetSRID(ST_MakePoint(?, ?), 4326)) ASC 
                    LIMIT 1
                ", [$centroid['lon'], $centroid['lat']]);

                if ($nearest) {
                    return Region::find($nearest->id);
                }
            }
        }

        // Fallback to primary pilot province or first region
        return Region::where('code', 'ID-JK')->first() ?? Region::first();
    }

    /**
     * Resolve broadcast level based on scope, severity, and region.
     */
    protected function resolveBroadcastLevel(string $scope, string $severity, ?Region $region): string
    {
        $sev = strtolower($severity);

        if (strcasecmp($scope, 'Public') !== 0) {
            return 'local';
        }

        if ($sev === 'extreme') {
            return 'national';
        }

        if ($region && $region->level === 'province') {
            return 'regional';
        }

        return 'regional';
    }

    /**
     * Create or link a HazardEvent record for this official warning.
     */
    protected function resolveOrCreateHazardEvent(
        string $identifier,
        string $headline,
        ?HazardType $hazardType,
        ?Region $region,
        string $severity,
        Carbon $startsAt,
        ?DataSource $dataSource,
        ?string $polygonStr
    ): ?HazardEvent {
        if (!$hazardType) {
            return null;
        }

        $existing = HazardEvent::where('description', 'like', "%[CAP-ID: {$identifier}]%")->first();
        if ($existing) {
            return $existing;
        }

        $centroid = $polygonStr ? $this->calculatePolygonCentroid($polygonStr) : null;
        $lat = $centroid['lat'] ?? -6.2088;
        $lon = $centroid['lon'] ?? 106.8456;

        $dbSeverity = match (strtolower($severity)) {
            'extreme' => 'critical',
            'severe' => 'high',
            'moderate' => 'medium',
            default => 'low',
        };

        $dataSourceId = $dataSource?->id ?? DataSource::first()?->id;

        try {
            $event = HazardEvent::create([
                'external_id' => $identifier,
                'hazard_type_id' => $hazardType->id,
                'region_id' => $region?->id,
                'data_source_id' => $dataSourceId,
                'title' => $headline,
                'description' => "Peringatan resmi terverifikasi OASIS CAP. [CAP-ID: {$identifier}]",
                'severity' => $dbSeverity,
                'status' => 'ongoing',
                'occurred_at' => $startsAt,
                'reported_at' => now(),
                'source_metadata' => [
                    'cap_identifier' => $identifier,
                    'cap_severity' => $severity,
                    'polygon' => $polygonStr,
                ],
            ]);

            DB::statement('
                UPDATE hazard_events 
                SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)
                WHERE id = ?
            ', [$lon, $lat, $event->id]);

            return $event;
        } catch (\Throwable $e) {
            Log::warning("Failed to create linked hazard event for CAP alert: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Calculate centroid (average latitude and longitude) of a CAP polygon string.
     *
     * @return array{lat: float, lon: float}|null
     */
    public function calculatePolygonCentroid(string $polygonStr): ?array
    {
        $pairs = preg_split('/\s+/', trim($polygonStr));
        if (empty($pairs)) return null;

        $totalLat = 0;
        $totalLon = 0;
        $count = 0;

        foreach ($pairs as $pair) {
            $coords = explode(',', trim($pair));
            if (count($coords) === 2 && is_numeric($coords[0]) && is_numeric($coords[1])) {
                $totalLat += (float) $coords[0];
                $totalLon += (float) $coords[1];
                $count++;
            }
        }

        if ($count === 0) return null;

        return [
            'lat' => round($totalLat / $count, 6),
            'lon' => round($totalLon / $count, 6),
        ];
    }

    /**
     * Check if a SimpleXMLElement represents a CAP <alert>.
     */
    protected function isCapAlertXml(SimpleXMLElement $xml): bool
    {
        return $xml->getName() === 'alert' && isset($xml->identifier);
    }

    /**
     * Safe helper to get string value from SimpleXMLElement.
     */
    protected function getNodeValue(SimpleXMLElement $node, string $child): string
    {
        return trim((string) ($node->$child ?? ''));
    }
}
