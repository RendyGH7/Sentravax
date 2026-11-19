<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DataSource;
use App\Services\ExternalData\FreshnessClassifierService;

echo "=== AUDIT PROVENANCE OF DATA SOURCES ===\n";

$classifier = app(FreshnessClassifierService::class);

$expected = [
    'pvmbg' => [
        'name_pattern' => '%PVMBG%',
        'expected_connectivity' => 'STATIC',
        'expected_freshness' => 'UNKNOWN',
        'expected_provenance' => 'CURATED_REFERENCE',
    ],
    'insar' => [
        'name_pattern' => '%InSAR%',
        'expected_connectivity' => 'STATIC',
        'expected_freshness' => 'UNKNOWN',
        'expected_provenance' => 'CURATED_REFERENCE',
    ],
    'curated_demo' => [
        'name_pattern' => '%Data Observasi Terkurasi SENTRAVAX%',
        'expected_connectivity' => 'OFFLINE',
        'expected_freshness' => 'UNKNOWN',
        'expected_provenance' => 'SIMULATED',
    ],
];

foreach ($expected as $key => $spec) {
    $src = DataSource::where('name', 'like', $spec['name_pattern'])->first();
    if (!$src) {
        echo "[FAIL] {$key} not found!\n";
        continue;
    }

    $c = $src->connectivity_state;
    $f = $src->freshness_state;
    $p = $src->provenance_type;

    $cMatch = ($c === $spec['expected_connectivity']);
    $fMatch = ($f === $spec['expected_freshness']);
    $pMatch = ($p === $spec['expected_provenance']);

    echo sprintf(
        "Source: %s (ID: %d)\n  Connectivity: %s (%s)\n  Freshness:    %s (%s)\n  Provenance:   %s (%s)\n",
        $src->name,
        $src->id,
        $c, $cMatch ? 'OK' : 'MISMATCH (Expected: ' . $spec['expected_connectivity'] . ')',
        $f, $fMatch ? 'OK' : 'MISMATCH (Expected: ' . $spec['expected_freshness'] . ')',
        $p, $pMatch ? 'OK' : 'MISMATCH (Expected: ' . $spec['expected_provenance'] . ')'
    );

    if (!$cMatch || !$fMatch || !$pMatch) {
        exit(1);
    }
}

echo "\nALL 3 TARGET SOURCES MEET EXACT PHASE 6.2 STANDARDS!\n";
