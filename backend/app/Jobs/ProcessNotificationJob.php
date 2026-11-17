<?php

namespace App\Jobs;

use App\Models\NotificationDeliveryLog;
use App\Models\User;
use App\Services\Notification\NotificationDeliveryService;
use App\Services\Notification\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public array $backoff = [5, 15, 30];

    /**
     * Create a new job instance.
     *
     * @param array<string, mixed> $data
     */
    public function __construct(
        public int $userId,
        public array $data
    ) {}

    /**
     * Execute the job idempotently.
     */
    public function handle(NotificationService $service): void
    {
        $user = User::find($this->userId);
        if (!$user) {
            Log::warning("ProcessNotificationJob: User ID {$this->userId} not found.");
            return;
        }

        // createNotification handles fingerprinting, deduplication, and preferences safely
        $service->createNotification($user, $this->data);
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        $category = $this->data['category'] ?? 'unknown';
        $urgency = $this->data['urgency'] ?? 'info';
        $fingerprint = $this->data['fingerprint'] ?? null;
        $errorMsg = $exception ? $exception->getMessage() : 'Background queue job exceeded max attempts';

        Log::error("ProcessNotificationJob failed for User #{$this->userId}: {$errorMsg}");

        try {
            app(NotificationDeliveryService::class)->recordLog(
                userId: $this->userId,
                notificationId: null,
                status: NotificationDeliveryLog::STATUS_FAILED,
                fingerprint: $fingerprint,
                category: $category,
                urgency: $urgency,
                reason: "Queue execution failed: {$errorMsg}",
                metadata: ['exception' => $errorMsg, 'attempts' => $this->attempts()]
            );
        } catch (\Throwable $e) {
            Log::error("Failed to write delivery log on job failure: {$e->getMessage()}");
        }
    }
}
