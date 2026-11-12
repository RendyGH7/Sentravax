<?php

use App\Http\Controllers\Api\V1\Admin\AdminDisasterController;
use App\Http\Controllers\Api\V1\Admin\AdminModerationController;
use App\Http\Controllers\Api\V1\Admin\AdminOverviewController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Intelligence\IntelligenceCenterController;
use App\Http\Controllers\Api\V1\Public\PublicController;
use App\Http\Controllers\Api\V1\User\UserPortalController;
use App\Http\Controllers\Api\V1\User\UserPreparednessController;
use App\Http\Controllers\Api\V1\User\UserReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SENTRAVAX REST API Routes (v1)
|--------------------------------------------------------------------------
|
| Base prefix: /api/v1 (configured in bootstrap/app.php)
| Supports independent React frontend and OpenAPI integrations
|
*/

// ==========================================
// 1. SYSTEM HEALTH
// ==========================================
Route::get('/health', function () {
    $dbConnected = false;
    $postgisVersion = 'Unavailable';

    try {
        $result = DB::select('SELECT PostGIS_Version() as version');
        $postgisVersion = $result[0]->version ?? 'Detected';
        $dbConnected = true;
    } catch (\Throwable $e) {
        $dbConnected = false;
    }

    $status = $dbConnected ? 200 : 503;

    return response()->json([
        'success' => $dbConnected,
        'message' => $dbConnected ? 'SENTRAVAX API is operational' : 'System degraded: Database connection unavailable',
        'data' => [
            'application' => 'SENTRAVAX',
            'version' => '1.0.0',
            'status' => $dbConnected ? 'operational' : 'degraded',
            'database' => $dbConnected ? 'connected' : 'disconnected',
            'postgis' => $postgisVersion,
            'framework' => 'Laravel ' . app()->version(),
            'environment' => app()->environment(),
        ],
        'meta' => [
            'timestamp' => now()->toIso8601String(),
        ],
    ], $status);
})->name('api.health');

// ==========================================
// 2. AUTHENTICATION (Laravel Sanctum)
// ==========================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.auth.login');
    Route::post('/register', [AuthController::class, 'register'])->name('api.auth.register');
    Route::post('/token', [AuthController::class, 'issueToken'])->name('api.auth.token');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
    });
});

// ==========================================
// 3. PUBLIC WEBSITE API (No Auth Required)
// ==========================================
Route::prefix('public')->group(function () {
    Route::get('/overview', [PublicController::class, 'overview'])->name('api.public.overview');
    Route::get('/check-location', [PublicController::class, 'checkLocation'])->name('api.public.check-location');
    Route::get('/events', [PublicController::class, 'events'])->name('api.public.events');
    Route::get('/events/{id}', [PublicController::class, 'eventDetail'])->name('api.public.events.detail');
    Route::get('/map/features', [PublicController::class, 'mapFeatures'])->name('api.public.map.features');
    Route::get('/alerts', [PublicController::class, 'alerts'])->name('api.public.alerts');
    Route::get('/hazard-types', [PublicController::class, 'hazardTypes'])->name('api.public.hazard-types');
    Route::get('/regions', [PublicController::class, 'regions'])->name('api.public.regions');
    Route::get('/education', [PublicController::class, 'education'])->name('api.public.education');
    Route::get('/education/{slug}', [PublicController::class, 'educationDetail'])->name('api.public.education.detail');
    Route::get('/data-sources', [PublicController::class, 'dataSources'])->name('api.public.data-sources');
});

// ==========================================
// 4. USER PORTAL & SIAGA PERSONAL (Role: user, admin, intelligence)
// ==========================================
Route::prefix('user')->middleware(['auth:sanctum', 'role:user,admin,intelligence'])->group(function () {
    Route::get('/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'Otorisasi Portal Warga terverifikasi.',
            'user' => request()->user()->only(['id', 'name', 'role']),
        ]);
    })->name('api.user.ping');

    // Dashboard & Profile
    Route::get('/dashboard', [UserPortalController::class, 'dashboard'])->name('api.user.dashboard');
    Route::get('/profile', [UserPortalController::class, 'profile'])->name('api.user.profile');
    Route::put('/profile', [UserPortalController::class, 'updateProfile'])->name('api.user.profile.update');

    // Saved Monitored Regions
    Route::get('/saved-regions', [UserPortalController::class, 'savedRegions'])->name('api.user.saved-regions');
    Route::post('/saved-regions', [UserPortalController::class, 'saveRegion'])->name('api.user.saved-regions.store');
    Route::delete('/saved-regions/{id}', [UserPortalController::class, 'deleteSavedRegion'])->name('api.user.saved-regions.delete');

    // Notifications
    Route::get('/notifications', [UserPortalController::class, 'notifications'])->name('api.user.notifications');
    Route::post('/notifications/{id}/read', [UserPortalController::class, 'markNotificationAsRead'])->name('api.user.notifications.read');
    Route::post('/notifications/read-all', [UserPortalController::class, 'markAllNotificationsAsRead'])->name('api.user.notifications.read-all');

    // Flagship: SENTRAVAX Siaga Personal (Preparedness & Simulation)
    Route::prefix('preparedness')->group(function () {
        Route::get('/plan', [UserPreparednessController::class, 'getPlan'])->name('api.user.preparedness.plan');
        Route::put('/plan', [UserPreparednessController::class, 'updatePlan'])->name('api.user.preparedness.plan.update');
        Route::post('/contacts', [UserPreparednessController::class, 'addContact'])->name('api.user.preparedness.contacts.store');
        Route::delete('/contacts/{id}', [UserPreparednessController::class, 'deleteContact'])->name('api.user.preparedness.contacts.delete');
        Route::get('/checklist', [UserPreparednessController::class, 'getChecklist'])->name('api.user.preparedness.checklist');
        Route::post('/checklist/{itemId}/toggle', [UserPreparednessController::class, 'toggleChecklistItem'])->name('api.user.preparedness.checklist.toggle');
        Route::get('/scenarios', [UserPreparednessController::class, 'scenarios'])->name('api.user.preparedness.scenarios');
        Route::get('/scenarios/{id}', [UserPreparednessController::class, 'scenarioDetail'])->name('api.user.preparedness.scenarios.detail');
        Route::post('/scenarios/{id}/attempt', [UserPreparednessController::class, 'submitAttempt'])->name('api.user.preparedness.scenarios.attempt');
    });

    // Community Disaster Reports
    Route::get('/reports', [UserReportController::class, 'index'])->name('api.user.reports.index');
    Route::post('/reports', [UserReportController::class, 'store'])->name('api.user.reports.store');
    Route::get('/reports/{id}', [UserReportController::class, 'show'])->name('api.user.reports.show');
});

// ==========================================
// 5. ADMIN CONSOLE (Strictly Role: admin)
// ==========================================
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'Otorisasi Konsol Admin terverifikasi.',
            'user' => request()->user()->only(['id', 'name', 'role']),
        ]);
    })->name('api.admin.ping');

    // System Overview & Data Sources
    Route::get('/overview', [AdminOverviewController::class, 'overview'])->name('api.admin.overview');
    Route::get('/data-sources', [AdminOverviewController::class, 'dataSources'])->name('api.admin.data-sources');
    Route::post('/data-sources/{id}/sync', [AdminOverviewController::class, 'triggerSync'])->name('api.admin.data-sources.sync');

    // User Management (strictly 3 roles)
    Route::get('/users', [AdminUserController::class, 'index'])->name('api.admin.users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('api.admin.users.store');
    Route::get('/users/{id}', [AdminUserController::class, 'show'])->name('api.admin.users.show');
    Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole'])->name('api.admin.users.update-role');
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('api.admin.users.destroy');

    // Official Hazard Events CRUD
    Route::get('/events', [AdminDisasterController::class, 'listEvents'])->name('api.admin.events.index');
    Route::post('/events', [AdminDisasterController::class, 'storeEvent'])->name('api.admin.events.store');
    Route::get('/events/{id}', [AdminDisasterController::class, 'showEvent'])->name('api.admin.events.show');
    Route::put('/events/{id}', [AdminDisasterController::class, 'updateEvent'])->name('api.admin.events.update');
    Route::delete('/events/{id}', [AdminDisasterController::class, 'destroyEvent'])->name('api.admin.events.destroy');

    // Early Warning Alerts (CAP)
    Route::get('/alerts', [AdminDisasterController::class, 'listAlerts'])->name('api.admin.alerts.index');
    Route::post('/alerts', [AdminDisasterController::class, 'storeAlert'])->name('api.admin.alerts.store');
    Route::get('/alerts/{id}', [AdminDisasterController::class, 'showAlert'])->name('api.admin.alerts.show');
    Route::put('/alerts/{id}', [AdminDisasterController::class, 'updateAlert'])->name('api.admin.alerts.update');
    Route::delete('/alerts/{id}', [AdminDisasterController::class, 'destroyAlert'])->name('api.admin.alerts.destroy');

    // Educational Mitigation Content
    Route::get('/education', [AdminDisasterController::class, 'listEducation'])->name('api.admin.education.index');
    Route::post('/education', [AdminDisasterController::class, 'storeEducation'])->name('api.admin.education.store');
    Route::put('/education/{id}', [AdminDisasterController::class, 'updateEducation'])->name('api.admin.education.update');
    Route::delete('/education/{id}', [AdminDisasterController::class, 'destroyEducation'])->name('api.admin.education.destroy');

    // Report Moderation & Curation
    Route::get('/reports', [AdminModerationController::class, 'index'])->name('api.admin.reports.index');
    Route::get('/reports/{id}', [AdminModerationController::class, 'show'])->name('api.admin.reports.show');
    Route::post('/reports/{id}/verify', [AdminModerationController::class, 'verify'])->name('api.admin.reports.verify');
    Route::delete('/reports/{id}', [AdminModerationController::class, 'destroy'])->name('api.admin.reports.destroy');
});

// ==========================================
// 6. GEOSPATIAL INTELLIGENCE CENTER (Strictly Role: intelligence)
// ==========================================
Route::prefix('intel')->middleware(['auth:sanctum', 'role:intelligence'])->group(function () {
    Route::get('/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'Otorisasi Intelligence Center terverifikasi.',
            'user' => request()->user()->only(['id', 'name', 'role']),
        ]);
    })->name('api.intel.ping');

    // Command Center Telemetry & Spatial Layers
    Route::get('/overview', [IntelligenceCenterController::class, 'overview'])->name('api.intel.overview');
    Route::get('/map', [IntelligenceCenterController::class, 'map'])->name('api.intel.map');

    // Multi-Hazard Risk Engine & Proactive AI Insights
    Route::post('/risk/evaluate', [IntelligenceCenterController::class, 'evaluateRisk'])->name('api.intel.risk.evaluate');
    Route::post('/insights/generate', [IntelligenceCenterController::class, 'generateInsight'])->name('api.intel.insights.generate');

    // Intelligence Verification Queue & CAP Alert Dissemination
    Route::get('/reports/queue', [IntelligenceCenterController::class, 'reportsQueue'])->name('api.intel.reports.queue');
    Route::post('/reports/{id}/verify', [IntelligenceCenterController::class, 'verifyReport'])->name('api.intel.reports.verify');
    Route::post('/alerts/dispatch', [IntelligenceCenterController::class, 'dispatchAlert'])->name('api.intel.alerts.dispatch');
});
