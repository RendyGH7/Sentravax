<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Region;
use App\Models\HazardEvent;
use App\Models\DataSource;
use Illuminate\Support\Facades\DB;

echo "=== REGIONS TABLE ===\n";
$regions = Region::select('id', 'name', 'code', 'level', DB::raw('ST_GeometryType(boundary) as geom_type'), DB::raw('ST_AsText(center_point) as center'))->get();
foreach ($regions as $r) {
    echo "ID: {$r->id} | Name: {$r->name} | Code: {$r->code} | Geom: {$r->geom_type} | Center: {$r->center}\n";
}

echo "\n=== HAZARD EVENTS (ALL) ===\n";
$events = HazardEvent::with(['dataSource', 'hazardType'])->get();
foreach ($events as $ev) {
    $loc = DB::selectOne("SELECT ST_AsText(location) as loc_wkt FROM hazard_events WHERE id = ?", [$ev->id]);
    echo "ID: {$ev->id} | Title: {$ev->title} | Severity: {$ev->severity} | Status: {$ev->status} | SourceID: {$ev->data_source_id} | SourceName: " . ($ev->dataSource?->name ?? 'NULL') . " | SourceType: " . ($ev->dataSource?->source_type ?? 'NULL') . " | OccurredAt: {$ev->occurred_at} | Loc: " . ($loc->loc_wkt ?? 'NULL') . "\n";
}

echo "\n=== DATA SOURCES (ALL) ===\n";
$sources = DataSource::all();
foreach ($sources as $s) {
    echo "ID: {$s->id} | Name: {$s->name} | Provider: {$s->provider} | Type: {$s->source_type} | Status: {$s->status} | LastSync: {$s->last_sync_at}\n";
}

echo "\n=== EVENT 4 DETAILED METADATA ===\n";
$ev4 = HazardEvent::find(4);
echo "Title: " . $ev4->title . "\n";
echo "Description: " . $ev4->description . "\n";
echo "Occurred: " . $ev4->occurred_at . "\n";
echo "Metadata: " . json_encode($ev4->source_metadata, JSON_PRETTY_PRINT) . "\n";

echo "\n=== TESTING ENDPOINT: /public/events/4 ===\n";
$publicCtrl = app(\App\Http\Controllers\Api\V1\Public\PublicController::class);
$eventRes = $publicCtrl->eventDetail(4);
echo json_encode($eventRes->getData(), JSON_PRETTY_PRINT) . "\n";

echo "\n=== TESTING ENDPOINT: /public/map/features (looking for event 4) ===\n";
$mapRes = $publicCtrl->mapFeatures();
$mapData = $mapRes->getData(true);
$features = $mapData['data']['hazard_events']['features'] ?? [];
foreach ($features as $f) {
    if (($f['properties']['id'] ?? null) == 4) {
        echo "Found Event 4 in Map Features:\n";
        echo json_encode($f, JSON_PRETTY_PRINT) . "\n";
    }
}

echo "\n=== TESTING ENDPOINT: /public/preparedness/check-location at Enggano (-5.56, 102.24) ===\n";
$req = new \Illuminate\Http\Request();
$req->merge([
    'latitude' => -5.56,
    'longitude' => 102.24,
]);
$prepRes = $publicCtrl->checkLocation($req);
echo json_encode($prepRes->getData(), JSON_PRETTY_PRINT) . "\n";

echo "\n=== TESTING GEOGRAPHY DISTANCE IN POSTGRESQL ===\n";
$geoTest = DB::selectOne("
    SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography,
        ST_SetSRID(ST_MakePoint(106.8272, -6.1754), 4326)::geography
    ) as dist_meters
");
echo "Distance Monas to Jakarta Center: " . round($geoTest->dist_meters, 2) . " meters (" . round($geoTest->dist_meters / 1000, 2) . " km)\n";

$nearEvents = DB::select("
    SELECT id, title,
           ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(106.8272, -6.1754), 4326)::geography) as dist_meters
    FROM hazard_events
    WHERE status = 'active'
    ORDER BY dist_meters
");
foreach ($nearEvents as $ne) {
    echo "Event #{$ne->id} ({$ne->title}) -> " . round($ne->dist_meters / 1000, 2) . " km\n";
}
