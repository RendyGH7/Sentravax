<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::all(['id', 'name', 'email', 'role', 'created_at', 'updated_at']);
echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
