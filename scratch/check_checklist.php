<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$items = App\Models\PreparednessChecklistItem::all(['id', 'category', 'name', 'is_essential', 'sort_order']);
echo "Total items: " . $items->count() . "\n";
echo json_encode($items, JSON_PRETTY_PRINT) . "\n";
