<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$passed = true;

// 1. Community Reports
$cr1 = \App\Models\CommunityReport::find(1);
$cr9 = \App\Models\CommunityReport::find(9);
if (!$cr1 || $cr1->status !== 'verified') {
    echo "FAIL: CommunityReport #1 missing or status is not 'verified'\n";
    $passed = false;
} else {
    echo "PASS: CommunityReport #1 is verified ('{$cr1->title}')\n";
}
if (!$cr9 || $cr9->status !== 'pending') {
    echo "FAIL: CommunityReport #9 missing or status is not 'pending'\n";
    $passed = false;
} else {
    echo "PASS: CommunityReport #9 is pending ('{$cr9->title}')\n";
}

// 2. Shelters
$shelters = \App\Models\Shelter::whereIn('id', [1, 2, 3, 4, 5])->get()->keyBy('id');
if ($shelters->count() < 5) {
    echo "FAIL: Missing baseline shelters, expected 5 found " . $shelters->count() . "\n";
    $passed = false;
} else {
    $verifiedCount = $shelters->where('verification_status', 'VERIFIED')->count();
    $pendingCount = $shelters->where('verification_status', 'PENDING_VERIFICATION')->count();
    if ($verifiedCount === 4 && $pendingCount === 1) {
        echo "PASS: Shelters 1-5 present (4 VERIFIED, 1 PENDING_VERIFICATION)\n";
    } else {
        echo "FAIL: Shelter statuses unexpected: $verifiedCount verified, $pendingCount pending\n";
        $passed = false;
    }
}

// 3. AiInsight #1
$ai1 = \App\Models\AiInsight::find(1);
if (!$ai1) {
    echo "FAIL: AiInsight #1 is missing\n";
    $passed = false;
} else {
    echo "PASS: AiInsight #1 present ('{$ai1->title}')\n";
}

// 4. RiskAssessment #1
$ra1 = \App\Models\RiskAssessment::find(1);
if (!$ra1) {
    echo "FAIL: RiskAssessment #1 is missing\n";
    $passed = false;
} else {
    echo "PASS: RiskAssessment #1 present (Score: {$ra1->overall_score})\n";
}

// 5. Data Sources
$sources = \App\Models\DataSource::orderBy('id')->get();
echo "Data Sources (" . $sources->count() . "):\n";
foreach ($sources as $s) {
    echo " - ID {$s->id}: {$s->name} [type: {$s->source_type}, provider: {$s->provider}]\n";
}

if ($passed) {
    echo "\n>>> ALL BASELINE CHECKS PASSED <<<\n";
    exit(0);
} else {
    echo "\n>>> BASELINE INTEGRITY FAILED <<<\n";
    exit(1);
}
