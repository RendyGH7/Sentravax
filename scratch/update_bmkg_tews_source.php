<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DataSource;
use App\Models\HazardEvent;

// 1. Ensure BMKG TEWS data source exists
$tews = DataSource::updateOrCreate(
    ['endpoint_url' => 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'],
    [
        'name' => 'BMKG TEWS Open Data API',
        'provider' => 'Badan Meteorologi, Klimatologi, dan Geofisika',
        'source_type' => 'api',
        'category' => 'seismology',
        'status' => 'active',
        'last_fetched_at' => now(),
        'last_successful_at' => now(),
        'notes' => 'Layanan real-time Indonesia Tsunami Early Warning System (InaTEWS) BMKG untuk pengamatan gempa bumi terkini.',
    ]
);

echo "BMKG TEWS DataSource ID: {$tews->id} ({$tews->name})\n";

// 2. Associate Event #4 (Gempa Enggano) with BMKG TEWS DataSource
$ev4 = HazardEvent::find(4);
if ($ev4) {
    $ev4->update(['data_source_id' => $tews->id]);
    echo "Updated Event #4 data_source_id to {$tews->id}\n";
}

// 3. Inspect all data sources now
$all = DataSource::all();
foreach ($all as $s) {
    echo "ID: {$s->id} | Name: {$s->name} | Provider: {$s->provider} | Type: {$s->source_type}\n";
}
