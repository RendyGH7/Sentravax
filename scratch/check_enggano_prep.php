<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$prep = app(\App\Services\Preparedness\PreparednessService::class);
$res = $prep->checkLocation(-5.56, 102.24);

echo "Assessment Status: " . $res['assessment']['assessment_status'] . "\n";
echo "Risk Level: " . $res['assessment']['risk_level'] . "\n";
echo "Risk Label: " . $res['assessment']['risk_label'] . "\n";
echo "Active Threats Count: " . $res['assessment']['active_threats_count'] . "\n";
$threats = $res['assessment']['factors']['nearby_active_events']['threats'] ?? [];
foreach ($threats as $t) {
    echo "Threat #{$t['id']} | {$t['title']} | Source: {$t['source_name']} | Provider: " . ($t['provider_name'] ?? 'N/A') . " | Status: {$t['provenance_status']}\n";
}
