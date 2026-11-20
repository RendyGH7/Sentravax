<?php

namespace App\Jobs;

use App\Models\DataSource;
use App\Services\ExternalData\DataSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncDataSourceJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds after which the job's unique lock will be released.
     */
    public int $uniqueFor = 300;

    /**
     * The unique ID for the job lock to prevent duplicate concurrent runs for the same source.
     */
    public function uniqueId(): string
    {
        return (string) $this->dataSource->id;
    }

    /**
     * The number of seconds to wait before retrying the job with exponential backoff.
     *
     * @var array<int, int>
     */
    public array $backoff = [10, 30, 60];

    /**
     * The maximum number of unhandled seconds the job can run before timing out.
     */
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public DataSource $dataSource,
        public ?string $correlationId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(DataSyncService $syncService): void
    {
        Log::info(sprintf("[SyncDataSourceJob] Executing sync for %s (id: %d, correlation: %s)",
            $this->dataSource->name,
            $this->dataSource->id,
            $this->correlationId ?? 'none'
        ));

        $syncService->syncDataSource($this->dataSource);
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error(sprintf("[SyncDataSourceJob FAILED] Permanent failure for %s (id: %d): %s",
            $this->dataSource->name,
            $this->dataSource->id,
            $exception?->getMessage() ?? 'Unknown error'
        ));
    }
}
