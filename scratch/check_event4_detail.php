<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$publicCtrl = app(\App\Http\Controllers\Api\V1\Public\PublicController::class);
$res = $publicCtrl->eventDetail(4);
echo json_encode($res->getData(), JSON_PRETTY_PRINT) . PHP_EOL;
