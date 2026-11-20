<?php

namespace Tests\Feature;

use App\Jobs\SyncDataSourceJob;
use App\Models\DataSource;
use App\Models\DataSourceSyncRun;
use App\Services\ExternalData\DataSyncService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AutomatedSyncSchedulerTest extends TestCase
{
    /**
     * Test 1: Scheduler registers CAP sync every 5 minutes with overlap protection.
     */
    public function test_scheduler_registers_cap_sync_every_5_minutes_with_without_overlapping(): void
    {
        $schedule = app(Schedule::class);
        $events = collect($schedule->events());

        $capEvent = $events->first(function ($event) {
            return str_contains($event->command ?? '', 'sentravax:sync-cap');
        });

        $this->assertNotNull($capEvent, 'sentravax:sync-cap schedule command must be registered.');
        $this->assertEquals('*/5 * * * *', $capEvent->expression, 'CAP sync must run every 5 minutes.');
        $this->assertTrue($capEvent->withoutOverlapping, 'CAP sync must have withoutOverlapping protection.');
    }

    /**
     * Test 2: Scheduler registers InaTEWS sync every 15 minutes with overlap protection.
     */
    public function test_scheduler_registers_inatews_sync_every_15_minutes_with_without_overlapping(): void
    {
        $schedule = app(Schedule::class);
        $events = collect($schedule->events());

        $tewsEvent = $events->first(function ($event) {
            return str_contains($event->command ?? '', 'sentravax:sync-inatews');
        });

        $this->assertNotNull($tewsEvent, 'sentravax:sync-inatews schedule command must be registered.');
        $this->assertEquals('*/15 * * * *', $tewsEvent->expression, 'InaTEWS sync must run every 15 minutes.');
        $this->assertTrue($tewsEvent->withoutOverlapping, 'InaTEWS sync must have withoutOverlapping protection.');
    }

    /**
     * Test 3: Command sentravax:sync-cap dispatches queued job or executes synchronously.
     */
    public function test_sentravax_sync_cap_command_dispatches_queue_job(): void
    {
        Queue::fake();

        $exitCode = Artisan::call('sentravax:sync-cap');
        $this->assertEquals(0, $exitCode);

        $capSource = DataSource::where('source_type', 'cap')->where('status', 'active')->first()
            ?? DataSource::where('name', 'like', '%CAP%')->where('status', 'active')->first();

        $this->assertNotNull($capSource);

        Queue::assertPushed(SyncDataSourceJob::class, function ($job) use ($capSource) {
            return $job->dataSource->id === $capSource->id;
        });
    }

    /**
     * Test 4: Command sentravax:sync-inatews dispatches queued job or executes synchronously.
     */
    public function test_sentravax_sync_inatews_command_dispatches_queue_job(): void
    {
        Queue::fake();

        $exitCode = Artisan::call('sentravax:sync-inatews');
        $this->assertEquals(0, $exitCode);

        $tewsSource = DataSource::where('endpoint_url', 'like', '%autogempa%')->where('status', 'active')->first()
            ?? DataSource::where('category', 'seismology')->where('status', 'active')->first();

        $this->assertNotNull($tewsSource);

        Queue::assertPushed(SyncDataSourceJob::class, function ($job) use ($tewsSource) {
            return $job->dataSource->id === $tewsSource->id;
        });
    }

    /**
     * Test 5: SyncDataSourceJob implements ShouldBeUnique with per-datasource ID lock.
     */
    public function test_sync_data_source_job_is_unique_per_data_source(): void
    {
        $source = DataSource::first();
        $this->assertNotNull($source);

        $job = new SyncDataSourceJob($source, 'test-correlation-123');

        $this->assertInstanceOf(ShouldBeUnique::class, $job, 'SyncDataSourceJob must implement ShouldBeUnique to prevent queue collisions.');
        $this->assertEquals((string) $source->id, $job->uniqueId(), 'Unique ID must be the data_source_id.');
        $this->assertGreaterThanOrEqual(300, $job->uniqueFor, 'Job lock duration must be at least 300 seconds.');
    }

    /**
     * Test 6: Failure in one external adapter does NOT stop synchronization of remaining sources.
     */
    public function test_failure_in_one_adapter_does_not_halt_sync_all(): void
    {
        // Fake BMKG Autogempa as failing (503 Service Unavailable)
        // Fake NASA FIRMS or others as success
        Http::fake([
            '*autogempa.json' => Http::response('Server Maintenance', 503),
            '*' => Http::response([], 200),
        ]);

        $syncService = app(DataSyncService::class);
        $runs = $syncService->syncAll();

        $this->assertGreaterThanOrEqual(4, count($runs), 'syncAll must process all active sources despite individual failures.');

        $statuses = collect($runs)->pluck('status')->all();
        $this->assertContains('FAILED', $statuses, 'Failing source must be tracked as FAILED.');
        $this->assertContains('SUCCESS', $statuses, 'Remaining healthy sources must be tracked as SUCCESS.');

        // Clean up sync runs generated during test
        $runIds = collect($runs)->pluck('id')->all();
        DataSourceSyncRun::whereIn('id', $runIds)->delete();
    }
}
