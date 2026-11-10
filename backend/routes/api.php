<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SENTRAVAX API Routes (v1)
|--------------------------------------------------------------------------
|
| Base prefix: /api/v1 (configured in bootstrap/app.php)
| Supports separated React frontend on http://localhost:5173
|
*/

Route::get('/health', function () {
    $dbConnected = false;

    try {
        DB::connection()->getPdo();
        $dbConnected = true;
    } catch (\Throwable $e) {
        $dbConnected = false;
    }

    $status = $dbConnected ? 200 : 503;

    return response()->json([
        'success' => $dbConnected,
        'message' => $dbConnected ? 'Health check successful' : 'System degraded: Database connection unavailable',
        'data' => [
            'application' => 'SENTRAVAX',
            'status' => $dbConnected ? 'operational' : 'degraded',
            'database' => $dbConnected ? 'connected' : 'disconnected',
            'framework' => 'Laravel ' . app()->version(),
            'environment' => app()->environment(),
        ],
        'meta' => [
            'timestamp' => now()->toIso8601String(),
        ],
    ], $status);
})->name('api.health');

