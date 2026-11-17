<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;

echo "=== TESTING LIST ASSESSMENTS ROUTE ===\n";

$intelUser = User::where('role', 'intelligence')->first();
\Laravel\Sanctum\Sanctum::actingAs($intelUser);

$request = Request::create('/api/v1/intel/risk/assessments', 'GET');
$request->headers->set('Accept', 'application/json');

$response = app()->handle($request);
echo "HTTP Status: " . $response->getStatusCode() . "\n";
$content = json_decode($response->getContent(), true);
echo "Success: " . ($content['success'] ? 'true' : 'false') . "\n";
echo "Count: " . count($content['data'] ?? []) . "\n";
foreach ($content['data'] ?? [] as $item) {
    echo " - ID: {$item['id']} | Region: " . ($item['region']['name'] ?? 'N/A') . " | Hazard: " . ($item['hazard_type']['name'] ?? 'N/A') . " | Score: {$item['risk_score']} | Level: {$item['risk_level']}\n";
}
echo "=== END TEST ===\n";
