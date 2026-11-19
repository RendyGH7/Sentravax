<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (\App\Models\DataSource::all() as $s) {
    echo json_encode([
        'id' => $s->id,
        'name' => $s->name,
        'provider' => $s->provider,
        'source_type' => $s->source_type,
        'status' => $s->status,
        'is_simulated' => $s->is_simulated,
        'last_successful_at' => $s->last_successful_at?->toIso8601String(),
        'last_observed_at' => $s->last_observed_at?->toIso8601String(),
        'freshness_state' => $s->freshness_state,
        'freshness_info' => $s->freshness_info,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
}
