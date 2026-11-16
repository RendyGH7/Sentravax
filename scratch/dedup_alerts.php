<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Alert;

$seen = [];
foreach (Alert::orderBy('id')->get() as $a) {
    if (isset($seen[$a->title])) {
        echo "Deleting duplicate alert #{$a->id}: {$a->title}\n";
        $a->delete();
    } else {
        $seen[$a->title] = $a->id;
    }
}

echo "Remaining unique alerts: " . Alert::count() . PHP_EOL;
