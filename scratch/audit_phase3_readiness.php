<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== SENTRAVAX PHASE 3.1 READINESS AUDIT ===\n";

// 1. Users by role
echo "\n--- USERS BY ROLE ---\n";
$users = User::all(['id', 'name', 'email', 'role']);
foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role}\n";
}

// 2. Data Sources
echo "\n--- DATA SOURCES (" . DataSource::count() . ") ---\n";
$sources = DataSource::all();
foreach ($sources as $s) {
    echo "ID: {$s->id} | Name: {$s->name} | Provider: {$s->provider} | Type: {$s->source_type} | Status: {$s->status} | Last Fetched: {$s->last_fetched_at} | Last Success: {$s->last_successful_at}\n";
    echo "   Endpoint: {$s->endpoint_url}\n";
}

// 3. Data Source Sync Runs
echo "\n--- LATEST SYNC RUNS (" . DataSourceSyncRun::count() . ") ---\n";
$syncs = DataSourceSyncRun::with('dataSource')->latest('synced_at')->limit(5)->get();
foreach ($syncs as $sr) {
    echo "ID: {$sr->id} | Source: " . ($sr->dataSource->name ?? 'N/A') . " | Status: {$sr->status} | Freshness: {$sr->freshness_state} | Fetched: {$sr->items_fetched} | Persisted: {$sr->items_persisted} | At: {$sr->synced_at}\n";
}

// 4. Hazard Types
echo "\n--- HAZARD TYPES (" . HazardType::count() . ") ---\n";
$ht = HazardType::all(['id', 'slug', 'name']);
foreach ($ht as $h) {
    echo "ID: {$h->id} | Slug: {$h->slug} | Name: {$h->name}\n";
}

// 5. Regions
echo "\n--- REGIONS (" . Region::count() . ") ---\n";
$regions = DB::select("SELECT id, code, name, level, ST_AsText(center_point) as center, (boundary IS NOT NULL) as has_boundary FROM regions");
foreach ($regions as $r) {
    echo "ID: {$r->id} | Code: {$r->code} | Name: {$r->name} | Level: {$r->level} | Center: {$r->center} | Has Boundary: " . ($r->has_boundary ? 'YES' : 'NO') . "\n";
}

// 6. Hazard Events
echo "\n--- HAZARD EVENTS (" . HazardEvent::count() . ") ---\n";
$events = DB::select("SELECT id, title, severity, status, data_source_id, ST_AsText(location) as loc, occurred_at FROM hazard_events");
foreach ($events as $e) {
    echo "ID: {$e->id} | Title: {$e->title} | Sev: {$e->severity} | Status: {$e->status} | SourceID: {$e->data_source_id} | Loc: {$e->loc} | Occurred: {$e->occurred_at}\n";
}

// 7. Risk Assessments
echo "\n--- RISK ASSESSMENTS (" . RiskAssessment::count() . ") ---\n";
$ras = RiskAssessment::with(['region', 'hazardType', 'hazardEvent'])->get();
foreach ($ras as $ra) {
    echo "ID: {$ra->id} | Title: {$ra->title} | Region: " . ($ra->region->name ?? 'N/A') . " | Hazard: " . ($ra->hazardType->name ?? 'N/A') . " | Score: {$ra->risk_score} | Level: {$ra->risk_level} | Version: {$ra->methodology_version}\n";
}

// 8. AI Insights
echo "\n--- AI INSIGHTS (" . AiInsight::count() . ") ---\n";
$ais = AiInsight::with(['region', 'hazardType', 'riskAssessment'])->get();
foreach ($ais as $ai) {
    echo "ID: {$ai->id} | Title: {$ai->title} | Region: " . ($ai->region->name ?? 'N/A') . " | Hazard: " . ($ai->hazardType->name ?? 'N/A') . " | Mode: {$ai->generation_mode} | Confidence: {$ai->confidence_score}\n";
    echo "   Summary: " . substr($ai->summary, 0, 100) . "...\n";
    echo "   Recs: " . json_encode($ai->recommendations) . "\n";
}

// 9. Community Reports
echo "\n--- COMMUNITY REPORTS (" . CommunityReport::count() . ") ---\n";
$reps = DB::select("SELECT id, title, status, cluster_id, ST_AsText(location) as loc, created_at FROM community_reports");
foreach ($reps as $rep) {
    echo "ID: {$rep->id} | Title: {$rep->title} | Status: {$rep->status} | Cluster: {$rep->cluster_id} | Loc: {$rep->loc} | Created: {$rep->created_at}\n";
}

// 10. Alerts
echo "\n--- ALERTS (" . Alert::count() . ") ---\n";
$alerts = Alert::with(['hazardType', 'region'])->get();
foreach ($alerts as $al) {
    echo "ID: {$al->id} | Title: {$al->title} | Class: {$al->alert_class} | Level: {$al->broadcast_level} | Status: {$al->status} | Region: " . ($al->region->name ?? 'Nationwide') . "\n";
}

echo "\n=== AUDIT COMPLETE ===\n";
