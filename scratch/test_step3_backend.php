<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;

$intel = User::where('role', 'intelligence')->first();
if (!$intel) {
    echo "No intelligence user found!\n";
    exit(1);
}

echo "Authenticated as: {$intel->email} ({$intel->role})\n";

// 1. Test generate insight
echo "\n--- 1. Testing POST /api/v1/intel/insights/generate ---\n";
$reqGen = Request::create('/api/v1/intel/insights/generate', 'POST', [
    'region_id' => 1,
    'hazard_type_id' => 1,
]);
$reqGen->setUserResolver(fn() => $intel);
$controller = app(\App\Http\Controllers\Api\V1\Intelligence\IntelligenceCenterController::class);
$resGen = $controller->generateInsight($reqGen);
echo "Status: " . $resGen->getStatusCode() . "\n";
$dataGen = json_decode($resGen->getContent(), true);
echo "Success: " . ($dataGen['success'] ? 'true' : 'false') . "\n";
echo "Title: " . ($dataGen['data']['title'] ?? 'N/A') . "\n";
echo "Confidence Level: " . ($dataGen['data']['evidence']['confidence_level'] ?? 'N/A') . "\n";
echo "Threat Escalation Level: " . ($dataGen['data']['evidence']['threat_escalation']['level'] ?? 'N/A') . "\n";

// 2. Test list insights
echo "\n--- 2. Testing GET /api/v1/intel/insights ---\n";
$reqList = Request::create('/api/v1/intel/insights', 'GET', ['limit' => 10]);
$reqList->setUserResolver(fn() => $intel);
$resList = $controller->listInsights($reqList);
echo "Status: " . $resList->getStatusCode() . "\n";
$dataList = json_decode($resList->getContent(), true);
echo "Total insights returned: " . count($dataList['data']) . "\n";

// 3. Test reports queue
echo "\n--- 3. Testing GET /api/v1/intel/reports/queue?status=all ---\n";
$reqQueue = Request::create('/api/v1/intel/reports/queue', 'GET', ['status' => 'all', 'per_page' => 10]);
$reqQueue->setUserResolver(fn() => $intel);
$resQueue = $controller->reportsQueue($reqQueue);
echo "Status: " . $resQueue->getStatusCode() . "\n";
$dataQueue = json_decode($resQueue->getContent(), true);
echo "Reports in queue: " . count($dataQueue['data']) . "\n";
if (count($dataQueue['data']) > 0) {
    $firstReport = $dataQueue['data'][0];
    echo "First report ID: {$firstReport['id']} | Title: {$firstReport['title']} | Status: {$firstReport['status']}\n";
    echo "Priority Score: {$firstReport['priority_score']} | Priority Level: {$firstReport['priority_level']}\n";
    echo "Duplicate Suspect: " . ($firstReport['duplicate_detection']['is_duplicate_suspect'] ? 'YES' : 'NO') . "\n";
}

// 4. Test report detail
echo "\n--- 4. Testing GET /api/v1/intel/reports/1 ---\n";
$resShow = $controller->showReport(1);
echo "Status: " . $resShow->getStatusCode() . "\n";
$dataShow = json_decode($resShow->getContent(), true);
echo "Title: {$dataShow['data']['title']} | Priority: {$dataShow['data']['priority_level']}\n";
echo "Verifications count: " . count($dataShow['data']['verifications']) . "\n";

// 5. Test verify report (mark as investigating)
echo "\n--- 5. Testing POST /api/v1/intel/reports/1/verify (status: investigating) ---\n";
$reqVerify = Request::create('/api/v1/intel/reports/1/verify', 'POST', [
    'status' => 'investigating',
    'notes' => 'Petugas intelijen sedang meninjau validitas rekaman CCTV stasiun terdekat.',
]);
$reqVerify->setUserResolver(fn() => $intel);
$resVerify = $controller->verifyReport($reqVerify, 1);
echo "Status: " . $resVerify->getStatusCode() . "\n";
$dataVerify = json_decode($resVerify->getContent(), true);
echo "New Status: {$dataVerify['data']['status']}\n";

// Restore status to verified for report #1
$reqRestore = Request::create('/api/v1/intel/reports/1/verify', 'POST', [
    'status' => 'verified',
    'notes' => 'Terkonfirmasi dengan stasiun pemantauan terdekat.',
]);
$reqRestore->setUserResolver(fn() => $intel);
$controller->verifyReport($reqRestore, 1);
echo "Restored report #1 status back to verified.\n";
