<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Jobs\ProcessNotificationJob;
use App\Models\NotificationDeliveryLog;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\DB;

$user = User::where('email', 'user@sentravax.id')->firstOrFail();

$uniqueKey = 'queue_audit_' . time();
$data = [
    'title' => 'Audit Queue Verification Notification',
    'body' => 'Testing genuine queue dispatching and background execution.',
    'category' => 'system',
    'urgency' => 'info',
    'material_key' => $uniqueKey,
];

echo "1. Dispatching ProcessNotificationJob to queue...\n";
ProcessNotificationJob::dispatch($user->id, $data);

$pendingJobsCount = DB::table('jobs')->count();
echo "2. Pending jobs in 'jobs' table: {$pendingJobsCount}\n";

if ($pendingJobsCount === 0) {
    echo "ERROR: Job was not queued into 'jobs' table!\n";
    exit(1);
}

echo "3. Invoking queue:work --once to simulate worker pickup...\n";
\Illuminate\Support\Facades\Artisan::call('queue:work', ['--once' => true]);
echo Artisan::output();

$remainingJobs = DB::table('jobs')->count();
echo "4. Remaining jobs in 'jobs' table: {$remainingJobs}\n";

$notif = UserNotification::where('user_id', $user->id)
    ->where('title', 'Audit Queue Verification Notification')
    ->first();

if (!$notif) {
    echo "ERROR: Notification not found in database!\n";
    exit(1);
}
echo "5. Successfully created UserNotification ID: {$notif->id}\n";

$log = NotificationDeliveryLog::where('user_id', $user->id)
    ->where('notification_id', $notif->id)
    ->first();

if (!$log) {
    echo "ERROR: Delivery log was not created!\n";
    exit(1);
}
echo "6. Successfully logged delivery status: {$log->status}\n";

// Clean up audit test records
$notif->delete();
$log->delete();
echo "7. Cleaned up verification record.\n";
echo "SUCCESS: Queue worker pipeline 100% verified!\n";
