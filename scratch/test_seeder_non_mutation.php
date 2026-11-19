<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RiskAssessment;
use App\Models\AiInsight;
use App\Models\CommunityReport;
use App\Models\ReportVerification;
use App\Models\Shelter;
use App\Models\DataSource;
use Database\Seeders\SentravaxMasterSeeder;

echo "=== TESTING SEEDER NON-MUTATION GUARANTEE ===\n";

function captureState() {
    return [
        'risk_assessment_1' => RiskAssessment::find(1)?->toArray(),
        'ai_insight_1' => AiInsight::find(1)?->toArray(),
        'community_report_1' => CommunityReport::find(1)?->toArray(),
        'community_report_9' => CommunityReport::find(9)?->toArray(),
        'report_verification_1' => ReportVerification::find(1)?->toArray(),
        'shelters' => Shelter::whereIn('id', [1, 2, 3, 4, 5])->orderBy('id')->get()->toArray(),
        'data_sources' => DataSource::whereIn('id', [2, 3, 4, 5, 6, 7])->orderBy('id')->get()->toArray(),
    ];
}

$stateBefore = captureState();

echo "Running SentravaxMasterSeeder->run()...\n";
(new SentravaxMasterSeeder())->run();

$stateAfter = captureState();

$mutated = false;
foreach ($stateBefore as $key => $beforeVal) {
    $afterVal = $stateAfter[$key];
    $strBefore = json_encode($beforeVal);
    $strAfter = json_encode($afterVal);

    if ($strBefore === $strAfter) {
        echo "[PASS] {$key} is 100% unmutated.\n";
    } else {
        echo "[FAIL] {$key} MUTATED!\n";
        echo "  Before: {$strBefore}\n";
        echo "  After:  {$strAfter}\n";
        $mutated = true;
    }
}

if (!$mutated) {
    echo "\nSUCCESS: Seeder ran without mutating any existing baseline records or timestamps!\n";
    exit(0);
} else {
    echo "\nFAILURE: Seeder mutated existing records!\n";
    exit(1);
}
