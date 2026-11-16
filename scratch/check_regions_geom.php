<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Region;
use Illuminate\Support\Facades\DB;

$regions = Region::select('id', 'name', 'code', 
    DB::raw('boundary IS NOT NULL as has_boundary'), 
    DB::raw('center_point IS NOT NULL as has_center'),
    DB::raw('ST_AsText(boundary) as boundary_wkt')
)->get();

foreach ($regions as $r) {
    echo "ID: {$r->id} | Name: {$r->name} | Has Boundary: " . ($r->has_boundary ? 'YES' : 'NO') . " | Has Center: " . ($r->has_center ? 'YES' : 'NO') . "\n";
    if ($r->has_boundary) {
        echo "   Boundary: " . substr($r->boundary_wkt, 0, 80) . "...\n";
    }
}
