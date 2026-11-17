<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use App\Models\User;
use Illuminate\Http\Request;

echo "=== PREFLIGHT AUDIT: TESTING RISK EVALUATE ENDPOINT ===\n";

$intelUser = User::where('role', 'intelligence')->first();
\Laravel\Sanctum\Sanctum::actingAs($intelUser);

$region = Region::first();
$hazard = HazardType::first();

echo "Testing with Region ID: {$region->id} ({$region->name}), Hazard ID: {$hazard->id} ({$hazard->name})\n\n";

$request = Request::create('/api/v1/intel/risk/evaluate', 'POST', [
    'region_id' => $region->id,
    'hazard_type_id' => $hazard->id,
    'title' => 'Audit Test Evaluation',
]);
$request->headers->set('Accept', 'application/json');

$response = app()->handle($request);
echo "HTTP Status: " . $response->getStatusCode() . "\n";
$content = json_decode($response->getContent(), true);

echo "Success: " . ($content['success'] ? 'true' : 'false') . "\n";
echo "Message: " . ($content['message'] ?? 'N/A') . "\n";
$data = $content['data'] ?? [];
echo "ID: " . ($data['id'] ?? 'N/A') . "\n";
echo "Title: " . ($data['title'] ?? 'N/A') . "\n";
echo "Risk Score: " . ($data['risk_score'] ?? 'N/A') . "\n";
echo "Risk Level: " . ($data['risk_level'] ?? 'N/A') . "\n";
echo "Methodology: " . ($data['methodology_version'] ?? 'N/A') . "\n";
echo "Calculation Factors Keys: " . implode(', ', array_keys($data['calculation_factors'] ?? [])) . "\n";
echo "Region in data: " . ($data['region']['name'] ?? 'N/A') . "\n";
echo "Hazard Type in data: " . ($data['hazard_type']['name'] ?? 'N/A') . "\n";

echo "\n--- CALCULATION FACTORS DETAIL ---\n";
echo json_encode($data['calculation_factors'] ?? [], JSON_PRETTY_PRINT) . "\n";

echo "\n=== PREFLIGHT AUDIT TEST COMPLETE ===\n";
