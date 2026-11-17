<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RiskAssessment;

$ra2 = RiskAssessment::find(2);
if ($ra2) {
    $ra2->title = 'Penilaian Risiko Banjir dan Genangan Provinsi DKI Jakarta';
    $ra2->save();
    echo "Updated RA #2 title to: {$ra2->title}\n";
}

$ra3 = RiskAssessment::find(3);
if ($ra3) {
    $ra3->title = 'Penilaian Risiko Banjir dan Genangan Banten';
    $ra3->save();
    echo "Updated RA #3 title to: {$ra3->title}\n";
}

// Normalize any non-standard titles
RiskAssessment::where('title', 'like', '%Uji%')
    ->orWhere('title', 'like', '%Test%')
    ->orWhere('title', 'like', '%Automated%')
    ->get()
    ->each(function ($ra) {
        $ra->title = 'Penilaian Risiko ' . ($ra->hazardType?->name ?? 'Bahaya') . ' ' . ($ra->region?->name ?? 'Regional');
        $ra->save();
        echo "Normalized RA #{$ra->id} title to: {$ra->title}\n";
    });

// Clean up any test insight with ID > 1
\App\Models\AiInsight::where('id', '>', 1)->delete();
echo "Cleaned up insights with ID > 1.\n";

echo "Normalization complete.\n";
