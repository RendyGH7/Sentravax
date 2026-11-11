<?php

use App\Http\Controllers\Api\V1\AuthController;
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

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.auth.login');
    Route::post('/register', [AuthController::class, 'register'])->name('api.auth.register');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
    });
});

/*
|--------------------------------------------------------------------------
| Role Authorization Verification Endpoints (Backend Protected)
| Standard Matrix:
| - Admin Area: Strictly role 'admin'
| - Intelligence Area: Strictly role 'intelligence'
| - User Portal: Authenticated roles ('user', 'admin', 'intelligence')
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'Otorisasi Konsol Admin terverifikasi.',
            'user' => request()->user()->only(['id', 'name', 'role']),
        ]);
    })->name('api.admin.ping');
});

Route::middleware(['auth:sanctum', 'role:intelligence'])->group(function () {
    Route::get('/intel/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'Otorisasi Intelligence Center terverifikasi.',
            'user' => request()->user()->only(['id', 'name', 'role']),
        ]);
    })->name('api.intel.ping');
});

Route::middleware(['auth:sanctum', 'role:user,admin,intelligence'])->group(function () {
    Route::get('/user/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'Otorisasi Portal Warga terverifikasi.',
            'user' => request()->user()->only(['id', 'name', 'role']),
        ]);
    })->name('api.user.ping');
});

