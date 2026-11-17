<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CommunityReport;
use App\Models\HazardEvent;
use App\Models\Alert;
use Illuminate\Support\Facades\DB;

$report = CommunityReport::first();
if (!$report) {
    echo "No report found!\n";
    exit;
}

echo "Testing with Report #{$report->id}: {$report->title}\n";

$coords = DB::selectOne("SELECT ST_X(location) as lon, ST_Y(location) as lat FROM community_reports WHERE id = ?", [$report->id]);
$lon = (float) ($coords?->lon ?? 106.8456);
$lat = (float) ($coords?->lat ?? -6.2088);

echo "Coordinates: Lon={$lon}, Lat={$lat}\n";

// Check nearby active events within 25km
$nearbyEvents = HazardEvent::where('status', 'active')
    ->whereRaw("ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, 25000)", [$lon, $lat])
    ->get(['id', 'title', 'severity']);

echo "Nearby active events (25km): " . $nearbyEvents->count() . "\n";
foreach ($nearbyEvents as $ev) {
    echo "  - Event #{$ev->id}: {$ev->title} ({$ev->severity})\n";
}

// Check nearby reports within 1.5km
$nearbyReports = DB::select("
    SELECT id, title, status, cluster_id, created_at,
           ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as dist_deg
    FROM community_reports
    WHERE id != ?
      AND hazard_type_id = ?
      AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326), 0.015)
    ORDER BY dist_deg ASC
", [$lon, $lat, $report->id, $report->hazard_type_id, $lon, $lat]);

echo "Nearby reports (1.5km): " . count($nearbyReports) . "\n";
foreach ($nearbyReports as $nr) {
    echo "  - Report #{$nr->id}: {$nr->title} (Status: {$nr->status})\n";
}
