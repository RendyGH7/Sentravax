<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\HazardType;
use App\Models\Region;
use App\Models\RiskAssessment;
use App\Models\HazardEvent;
use App\Models\Alert;

echo "=== 1. HAZARD TYPES IN DATABASE ===\n";
foreach (HazardType::orderBy('id')->get() as $h) {
    echo "ID: {$h->id} | Slug: {$h->slug} | Name: {$h->name} | Icon: {$h->icon}\n";
}

echo "\n=== 2. PILOT REGIONS IN DATABASE ===\n";
foreach (Region::orderBy('id')->get() as $r) {
    echo "ID: {$r->id} | Code: {$r->code} | Name: {$r->name} | Level: {$r->level}\n";
}

echo "\n=== 3. ALL RISK ASSESSMENTS IN DATABASE ===\n";
$assessments = RiskAssessment::with(['region', 'hazardType'])->orderBy('id')->get();
echo "Total Records: " . $assessments->count() . "\n";
foreach ($assessments as $ra) {
    echo "ID: {$ra->id} | Region: [{$ra->region_id}] " . ($ra->region?->name ?? 'NULL') . 
         " | Hazard: [{$ra->hazard_type_id}] " . ($ra->hazardType?->name ?? 'NULL') . 
         " ({$ra->hazardType?->slug}) | Title: {$ra->title} | Score: {$ra->risk_score} | Level: {$ra->risk_level} | Assessed At: {$ra->assessed_at}\n";
}

echo "\n=== 4. CHECK HAZARD EVENTS COUNT & TITLES ===\n";
$events = HazardEvent::orderBy('id')->get();
echo "Total Hazard Events: " . $events->count() . "\n";
foreach ($events as $ev) {
    echo "Event ID: {$ev->id} | Title: {$ev->title} | Status: {$ev->status} | Severity: {$ev->severity} | Hazard Type ID: {$ev->hazard_type_id}\n";
}

echo "\n=== 5. CHECK ALERTS COUNT & TITLES ===\n";
$alerts = Alert::orderBy('id')->get();
echo "Total Alerts: " . $alerts->count() . "\n";
foreach ($alerts as $al) {
    echo "Alert ID: {$al->id} | Title: {$al->title} | Status: {$al->status} | Broadcast: {$al->broadcast_level}\n";
}

echo "\n=== 6. CHECK AI INSIGHTS COUNT & TITLES ===\n";
$insights = \App\Models\AiInsight::orderBy('id')->get();
echo "Total Insights: " . $insights->count() . "\n";
foreach ($insights as $in) {
    echo "Insight ID: {$in->id} | Title: {$in->title} | Assessment ID: {$in->risk_assessment_id}\n";
}

echo "\n=== 7. CHECK USERS COUNT ===\n";
$users = \App\Models\User::orderBy('id')->get();
echo "Total Users: " . $users->count() . "\n";
foreach ($users as $u) {
    echo "User ID: {$u->id} | Email: {$u->email} | Role: {$u->role}\n";
}
