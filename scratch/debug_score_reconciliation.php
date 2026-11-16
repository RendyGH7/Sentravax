<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\RiskEngine\RiskEngineService;

$risk = app(RiskEngineService::class);
$eval = $risk->evaluateLocationRisk(-6.1754, 106.8272);

echo "Final Risk Score: " . $eval['risk_score'] . "\n";
echo "Factors Breakdown:\n";
$sum = 0;
foreach ($eval['factors'] as $key => $f) {
    if (isset($f['contribution'])) {
        echo "- $key: contribution = " . $f['contribution'] . " (weight = " . ($f['weight'] ?? '-') . ")\n";
        $sum += $f['contribution'];
        if ($key === 'nearby_active_events' && isset($f['threats'])) {
            $threatSum = 0;
            foreach ($f['threats'] as $t) {
                echo "    threat #{$t['id']} ({$t['title']}): contribution = {$t['contribution']}\n";
                $threatSum += $t['contribution'];
            }
            echo "    Threat sum: $threatSum vs Factor contribution: {$f['contribution']}\n";
        }
    } else {
        echo "- $key: " . json_encode($f) . "\n";
    }
}
echo "Sum of factor contributions: " . $sum . "\n";

echo "\n=== ACTIVE ALERTS IN DB ===\n";
$alerts = \App\Models\Alert::where('status', 'active')->get();
foreach ($alerts as $a) {
    echo "ID: {$a->id} | RegionID: " . ($a->region_id ?? 'NULL') . " | Title: {$a->title} | Level: {$a->broadcast_level} | ExpiresAt: {$a->expires_at}\n";
}
