<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\Preparedness\PreparednessService;
use App\Services\RiskEngine\RiskEngineService;

$prep = app(PreparednessService::class);
$risk = app(RiskEngineService::class);

$testPoints = [
    'Titik 1: Monas Jakarta Pusat (Dalam Pilot)' => ['lat' => -6.1754, 'lon' => 106.8272],
    'Titik 2: Puncak Bogor (Dalam Pilot)' => ['lat' => -6.6972, 'lon' => 106.9744],
    'Titik 3: Anyer Banten (Dalam Pilot)' => ['lat' => -6.0500, 'lon' => 105.9000],
    'Titik 4: Lepas Pantai Jawa (Jarak 0.50 deg / ~55km dari Jakarta)' => ['lat' => -5.71, 'lon' => 106.8456],
    'Titik 5: Lepas Pantai Jawa (Jarak 0.65 deg / ~72km dari Jakarta)' => ['lat' => -5.50, 'lon' => 106.8456],
    'Titik 6: Jayapura Papua (Jauh dari Pilot)' => ['lat' => -2.5407, 'lon' => 140.7042],
    'Titik 7: Kapuas Hulu Kalimantan (Tanpa Telemetri Lokal)' => ['lat' => 0.8172, 'lon' => 112.9234],
    'Titik 8: Enggano (Episenter Gempa BMKG)' => ['lat' => -5.56, 'lon' => 102.24],
];

echo "=== EVALUASI TITIK GEOSPASIAL ===\n\n";

foreach ($testPoints as $label => $pt) {
    $res = $prep->checkLocation($pt['lat'], $pt['lon']);
    $loc = $res['location'];
    $assess = $res['assessment'];
    $prov = $res['provenance'];
    
    echo "--- $label ---\n";
    echo "Coord: [{$pt['lat']}, {$pt['lon']}]\n";
    echo "Region: " . ($loc['region'] ? "{$loc['region']['name']} (ID: {$loc['region']['id']})" : "NULL (Di Luar Wilayah)") . "\n";
    echo "Is Pilot Coverage: " . ($prov['is_pilot_coverage'] ? 'TRUE' : 'FALSE') . "\n";
    echo "Coverage Note: {$prov['coverage_note']}\n";
    echo "Risk Score: {$assess['risk_score']} | Level: {$assess['risk_level']} ({$assess['risk_label']})\n";
    echo "Threats Count: {$assess['active_threats_count']} | Alerts Count: {$assess['active_alerts_count']}\n";
    echo "Action Steps Count: " . count($res['recommendations']['action_steps']) . "\n";
    echo "Sample Action Step: " . $res['recommendations']['action_steps'][0] . "\n\n";
}
