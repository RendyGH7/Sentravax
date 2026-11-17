<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;

echo "=== TESTING INTELLIGENCE API ENDPOINTS VIA LARAVEL KERNEL ===\n";

$intelUser = User::where('role', 'intelligence')->first();
if (!$intelUser) {
    echo "ERROR: Intelligence user not found!\n";
    exit(1);
}
echo "Authenticated as: {$intelUser->name} ({$intelUser->email}), Role: {$intelUser->role}\n\n";

\Laravel\Sanctum\Sanctum::actingAs($intelUser);

// Helper to simulate authenticated request
function runRequest($uri, $method = 'GET', $data = []) {
    $request = Request::create($uri, $method, $data);
    $request->headers->set('Accept', 'application/json');
    $response = app()->handle($request);
    return [
        'status' => $response->getStatusCode(),
        'content' => json_decode($response->getContent(), true),
    ];
}

// 1. Ping
$resPing = runRequest('/api/v1/intel/ping', 'GET', [], $intelUser);
echo "1. GET /api/v1/intel/ping -> HTTP {$resPing['status']}\n";
echo "   Message: " . ($resPing['content']['message'] ?? 'N/A') . "\n\n";

// 2. Overview
$resOverview = runRequest('/api/v1/intel/overview', 'GET', [], $intelUser);
echo "2. GET /api/v1/intel/overview -> HTTP {$resOverview['status']}\n";
if ($resOverview['status'] === 200) {
    $data = $resOverview['content']['data'] ?? [];
    echo "   Telemetry Status: " . ($data['telemetry']['stream_status'] ?? 'N/A') . "\n";
    echo "   Metrics: Threats: " . ($data['metrics']['active_threats'] ?? 0) . 
         ", Reports: " . ($data['metrics']['unverified_reports'] ?? 0) . 
         ", Alerts: " . ($data['metrics']['active_cap_alerts'] ?? 0) . 
         ", Insights: " . ($data['metrics']['proactive_insights_generated'] ?? 0) . "\n";
    echo "   Recent Insights count: " . count($data['recent_insights'] ?? []) . "\n";
    echo "   Simulation Scenario: " . ($data['simulation_projection']['scenario_name'] ?? 'N/A') . "\n";
} else {
    echo "   Content: " . json_encode($resOverview['content']) . "\n";
}
echo "\n";

// 3. Map
$resMap = runRequest('/api/v1/intel/map', 'GET', [], $intelUser);
echo "3. GET /api/v1/intel/map -> HTTP {$resMap['status']}\n";
if ($resMap['status'] === 200) {
    $features = $resMap['content']['data']['features'] ?? [];
    echo "   FeatureCollection count: " . count($features) . "\n";
    foreach ($features as $idx => $f) {
        echo "   - Feature #{$idx}: Layer: " . ($f['properties']['layer'] ?? 'N/A') . " | Title: " . ($f['properties']['title'] ?? 'N/A') . "\n";
    }
} else {
    echo "   Content: " . json_encode($resMap['content']) . "\n";
}
echo "\n";

// 4. Reports Queue
$resQueue = runRequest('/api/v1/intel/reports/queue', 'GET', [], $intelUser);
echo "4. GET /api/v1/intel/reports/queue -> HTTP {$resQueue['status']}\n";
if ($resQueue['status'] === 200) {
    $items = $resQueue['content']['data'] ?? [];
    echo "   Pending reports in queue: " . count($items) . " (Total: " . ($resQueue['content']['meta']['total'] ?? 0) . ")\n";
} else {
    echo "   Content: " . json_encode($resQueue['content']) . "\n";
}

echo "\n=== END TEST ===\n";
