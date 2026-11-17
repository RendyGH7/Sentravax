<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach ([1, 2, 3] as $id) {
    $e = \App\Models\HazardEvent::with('dataSource', 'hazardType')->find($id);
    echo "=== EVENT #{$e->id} ===\n";
    echo "Title: {$e->title}\n";
    echo "Hazard: " . ($e->hazardType->name ?? 'None') . "\n";
    echo "Data Source: " . ($e->dataSource->name ?? 'None') . " (Provider: " . ($e->dataSource->provider ?? 'None') . ", Type: " . ($e->dataSource->source_type ?? 'None') . ")\n";
    echo "Data Status: {$e->data_status}\n";
    echo "Occurred At: {$e->occurred_at}\n";
    echo "Metadata: " . json_encode($e->metadata, JSON_PRETTY_PRINT) . "\n\n";
}

$a = \App\Models\Alert::with('hazardType')->find(2);
echo "=== ALERT #2 ===\n";
echo "Title: {$a->title}\n";
echo "Hazard: " . ($a->hazardType->name ?? 'None') . "\n";
echo "Alert Class: {$a->alert_class}\n";
echo "Broadcast Level: {$a->broadcast_level}\n";
echo "Issuer: " . json_encode($a->issuer, JSON_PRETTY_PRINT) . "\n";
echo "Hazard Event ID: " . ($a->hazard_event_id ?? 'NULL (Independent)') . "\n";
echo "Starts At: {$a->starts_at}\n";
echo "Message: {$a->message}\n";
