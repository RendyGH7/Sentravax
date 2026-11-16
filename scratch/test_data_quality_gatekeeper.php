<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DataSource;
use App\Services\RiskEngine\RiskEngineService;

$risk = app(RiskEngineService::class);
$bmkg = DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();

echo "=== TEST DATA QUALITY GATEKEEPER ACTUAL FRESHNESS ===\n\n";

// 1. Fresh state
$bmkg->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);
$evalFresh = $risk->evaluateLocationRisk(-6.1754, 106.8272);
echo "1. FRESH FEED (synced 5m ago):\n";
echo "   Data Freshness: {$evalFresh['data_freshness']}\n";
echo "   Assessment Status: {$evalFresh['assessment_status']}\n";
echo "   Risk Level: {$evalFresh['risk_level']}\n";
echo "   Risk Score: {$evalFresh['risk_score']}\n";
assert($evalFresh['data_freshness'] === 'FRESH');
assert($evalFresh['assessment_status'] === 'ASSESSED');
echo "   -> PASS\n\n";

// 2. Stale state (synced 90m ago)
$bmkg->update(['last_successful_at' => now()->subMinutes(90)]);
$evalStale = $risk->evaluateLocationRisk(-6.1754, 106.8272);
echo "2. STALE FEED (synced 90m ago):\n";
echo "   Data Freshness: {$evalStale['data_freshness']}\n";
echo "   Assessment Status: {$evalStale['assessment_status']}\n";
echo "   Description: {$evalStale['factors']['data_quality']['description']}\n";
assert($evalStale['data_freshness'] === 'STALE');
assert($evalStale['assessment_status'] === 'ASSESSED');
echo "   -> PASS\n\n";

// 3. Unavailable state (disconnected / error / synced 25 hours ago)
$bmkg->update(['last_successful_at' => now()->subHours(25)]);
$evalUnavailable = $risk->evaluateLocationRisk(-6.1754, 106.8272);
echo "3. UNAVAILABLE FEED (synced 25h ago):\n";
echo "   Data Freshness: {$evalUnavailable['data_freshness']}\n";
echo "   Assessment Status: {$evalUnavailable['assessment_status']}\n";
echo "   Risk Level: {$evalUnavailable['risk_level']}\n";
echo "   Risk Label: {$evalUnavailable['risk_label']}\n";
assert($evalUnavailable['data_freshness'] === 'UNAVAILABLE');
assert($evalUnavailable['assessment_status'] === 'INSUFFICIENT_DATA');
assert($evalUnavailable['risk_level'] === 'insufficient_data');
echo "   -> PASS\n\n";

// 4. Out-of-coverage (Papua)
$evalPapua = $risk->evaluateLocationRisk(-2.5407, 140.7042);
echo "4. OUT-OF-COVERAGE (Papua):\n";
echo "   Data Freshness: {$evalPapua['data_freshness']}\n";
echo "   Assessment Status: {$evalPapua['assessment_status']}\n";
echo "   Risk Level: {$evalPapua['risk_level']}\n";
assert($evalPapua['data_freshness'] === 'UNAVAILABLE');
assert($evalPapua['assessment_status'] === 'INSUFFICIENT_DATA');
assert($evalPapua['risk_level'] === 'insufficient_data');
echo "   -> PASS\n\n";

// 5. Restore live fresh state
$bmkg->update(['status' => 'active', 'last_successful_at' => now()->subMinutes(5)]);
echo "5. Restored BMKG feed to active & fresh.\n";
echo ">>> ALL DATA QUALITY GATEKEEPER TESTS PASSED! <<<\n";
