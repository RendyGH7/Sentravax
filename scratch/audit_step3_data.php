<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CommunityReport;
use App\Models\ReportVerification;
use App\Models\AiInsight;

echo "=== COMMUNITY REPORTS ===\n";
$reports = CommunityReport::with(['hazardType', 'region', 'user'])->get();
echo "Total Reports: " . $reports->count() . "\n";
foreach ($reports as $r) {
    echo "ID: {$r->id} | Title: {$r->title} | Status: {$r->status} | Hazard: {$r->hazardType?->name} | Region: {$r->region?->name} | Cluster: " . ($r->cluster_id ?? 'None') . "\n";
}

echo "\n=== REPORT VERIFICATIONS ===\n";
$verifs = ReportVerification::with(['communityReport', 'verifier'])->get();
echo "Total Verifications: " . $verifs->count() . "\n";
foreach ($verifs as $v) {
    echo "ID: {$v->id} | Report ID: {$v->community_report_id} | Verifier: {$v->verifier?->name} | {$v->previous_status} -> {$v->new_status} | Notes: {$v->notes}\n";
}

echo "\n=== AI INSIGHTS ===\n";
$insights = AiInsight::with(['region', 'hazardType'])->get();
echo "Total Insights: " . $insights->count() . "\n";
foreach ($insights as $in) {
    echo "ID: {$in->id} | Title: {$in->title} | Type: {$in->insight_type} | Mode: {$in->generation_mode} | Confidence: {$in->confidence_score}\n";
}
