<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$events = App\Models\HazardEvent::with(['dataSource', 'hazardType', 'region'])->get()->map(function($e) {
    return [
        'id' => $e->id,
        'title' => $e->title,
        'hazard_slug' => $e->hazardType?->slug,
        'severity' => $e->severity,
        'status' => $e->status,
        'occurred_at' => (string)$e->occurred_at,
        'created_at' => (string)$e->created_at,
        'updated_at' => (string)$e->updated_at,
        'data_source_id' => $e->data_source_id,
        'source_name' => $e->dataSource?->name,
        'provider' => $e->dataSource?->provider,
        'source_type' => $e->dataSource?->source_type,
        'external_id' => $e->external_id,
    ];
});

echo json_encode($events, JSON_PRETTY_PRINT);
