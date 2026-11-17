<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== COMMUNITY REPORTS ===\n";
foreach (\App\Models\CommunityReport::with(['hazardType', 'region'])->get() as $r) {
    echo "ID: {$r->id} | {$r->title} | Status: {$r->status} | Hazard: " . ($r->hazardType->name ?? 'N/A') . " | Region: " . ($r->region->name ?? 'N/A') . "\n";
}

echo "\n=== AI INSIGHTS ===\n";
foreach (\App\Models\AiInsight::with(['hazardType', 'region'])->get() as $i) {
    echo "ID: {$i->id} | {$i->title} | Mode: {$i->generation_mode} | Score: {$i->confidence_score} | Hazard: " . ($i->hazardType->name ?? 'N/A') . " | Region: " . ($i->region->name ?? 'N/A') . "\n";
}

echo "\n=== REPORT VERIFICATIONS ===\n";
foreach (\App\Models\ReportVerification::all() as $v) {
    echo "ID: {$v->id} | Report: #{$v->community_report_id} | Status: {$v->previous_status} -> {$v->new_status} | Notes: {$v->notes}\n";
}
