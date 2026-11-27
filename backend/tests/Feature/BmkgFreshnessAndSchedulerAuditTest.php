<?php

namespace Tests\Feature;

use App\Jobs\SyncDataSourceJob;
use App\Models\DataSource;
use App\Services\ExternalData\DataSyncService;
use App\Services\ExternalData\FreshnessClassifierService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BmkgFreshnessAndSchedulerAuditTest extends TestCase
{
    use DatabaseTransactions;

    public function test_tews_sync_success_records_valid_freshness_state_not_live(): void
    {
        $tews = DataSource::where('name', 'like', '%TEWS%')->firstOrFail();

        $freshIso = now()->subMinutes(5)->toIso8601String();
        Http::fake([
            '*autogempa.json' => Http::response([
                'Infogempa' => [
                    'gempa' => [
                        'DateTime' => $freshIso,
                        'Tanggal' => now()->format('d M Y'),
                        'Jam' => now()->format('H:i:s') . ' WIB',
                        'Coordinates' => '-6.20,106.80',
                        'Magnitude' => '4.8',
                        'Kedalaman' => '10 km',
                        'Wilayah' => 'Test Wilayah Audit',
                        'Potensi' => 'Tidak berpotensi tsunami',
                    ],
                ],
            ], 200),
        ]);

        $run = app(DataSyncService::class)->syncDataSource($tews);
        $tewsFresh = $tews->fresh(['syncRuns']);

        $this->assertSame('SUCCESS', $run->status);
        $this->assertSame(FreshnessClassifierService::CONNECTIVITY_LIVE, $tewsFresh->connectivity_state);
        $this->assertSame(FreshnessClassifierService::STATE_FRESH, $tewsFresh->freshness_state);
        $this->assertSame(FreshnessClassifierService::PROVENANCE_OFFICIAL, $tewsFresh->provenance_type);
    }

    public function test_tews_sync_with_old_observation_remains_stale_in_run_and_model(): void
    {
        $tews = DataSource::where('name', 'like', '%TEWS%')->firstOrFail();

        $oldIso = now()->subHours(8)->toIso8601String();
        Http::fake([
            '*autogempa.json' => Http::response([
                'Infogempa' => [
                    'gempa' => [
                        'DateTime' => $oldIso,
                        'Coordinates' => '-7.10,107.60',
                        'Magnitude' => '4.2',
                        'Kedalaman' => '12 km',
                        'Wilayah' => 'Test Wilayah Lama',
                        'Potensi' => 'Tidak berpotensi tsunami',
                    ],
                ],
            ], 200),
        ]);

        $run = app(DataSyncService::class)->syncDataSource($tews);
        $tewsFresh = $tews->fresh(['syncRuns']);

        $this->assertSame('SUCCESS', $run->status);
        $this->assertSame(FreshnessClassifierService::STATE_STALE, $tewsFresh->freshness_state);
    }

    public function test_latest_failed_sync_after_prior_success_marks_offline_and_unavailable_without_wiping_history(): void
    {
        $radar = DataSource::where('name', 'like', '%Radar%')->firstOrFail();
        $priorSuccess = now()->subMinutes(10);
        $priorObserved = now()->subMinutes(15);

        $radar->update([
            'status' => 'active',
            'last_successful_at' => $priorSuccess,
            'last_observed_at' => $priorObserved,
        ]);

        Http::fake([
            '*' => Http::response(['message' => 'no Route matched with those values'], 404),
        ]);

        $run = app(DataSyncService::class)->syncDataSource($radar);
        $radarFresh = $radar->fresh(['syncRuns']);

        $this->assertSame('FAILED', $run->status);
        $this->assertSame(FreshnessClassifierService::STATE_UNAVAILABLE, $run->freshness_state);
        $this->assertSame(FreshnessClassifierService::CONNECTIVITY_LIVE, $radarFresh->connectivity_state);
        $this->assertSame(FreshnessClassifierService::STATE_UNAVAILABLE, $radarFresh->freshness_state);
        $this->assertSame($priorSuccess->timestamp, $radarFresh->last_successful_at?->timestamp);
        $this->assertSame($priorObserved->timestamp, $radarFresh->last_observed_at?->timestamp);
    }

    public function test_static_curated_and_simulated_sources_never_update_last_successful_at(): void
    {
        $syncService = app(DataSyncService::class);
        $pvmbg = DataSource::where('name', 'like', '%PVMBG%')->firstOrFail();
        $curated = DataSource::where('source_type', 'curated')->firstOrFail();

        $pvmbgOriginal = $pvmbg->last_successful_at?->timestamp;
        $curatedOriginal = $curated->last_successful_at?->timestamp;

        $syncService->syncDataSource($pvmbg);
        $syncService->syncDataSource($curated);

        $this->assertSame($pvmbgOriginal, $pvmbg->fresh()->last_successful_at?->timestamp);
        $this->assertSame($curatedOriginal, $curated->fresh()->last_successful_at?->timestamp);
    }

    public function test_sync_all_isolates_failure_of_one_feed_from_other_feeds(): void
    {
        $freshIso = now()->subMinutes(4)->toIso8601String();
        Http::fake([
            '*api.bmkg.go.id/public/weather*' => Http::response('Not Found', 404),
            '*www.bmkg.go.id/alerts/*' => Http::response('Service Unavailable', 503),
            '*autogempa.json*' => Http::response([
                'Infogempa' => [
                    'gempa' => [
                        'DateTime' => $freshIso,
                        'Coordinates' => '-6.90,107.60',
                        'Magnitude' => '4.5',
                        'Kedalaman' => '10 km',
                        'Wilayah' => 'Test Isolasi',
                        'Potensi' => 'Tidak berpotensi tsunami',
                    ],
                ],
            ], 200),
        ]);

        $runs = app(DataSyncService::class)->syncAll();
        $statusesBySource = collect($runs)->keyBy('data_source_id');

        $tews = DataSource::where('name', 'like', '%TEWS%')->firstOrFail();
        $radar = DataSource::where('name', 'like', '%Radar%')->firstOrFail();

        $this->assertSame('FAILED', $statusesBySource[$radar->id]->status);
        $this->assertSame('SUCCESS', $statusesBySource[$tews->id]->status);
    }

    public function test_sync_job_enforces_overlap_protection_retry_limits_and_timeout(): void
    {
        $tews = DataSource::where('name', 'like', '%TEWS%')->firstOrFail();
        $job = new SyncDataSourceJob($tews, 'audit-corr-1');

        $this->assertInstanceOf(ShouldBeUnique::class, $job);
        $this->assertSame((string) $tews->id, $job->uniqueId());
        $this->assertSame(300, $job->uniqueFor);
        $this->assertSame(3, $job->tries);
        $this->assertSame([10, 30, 60], $job->backoff);
        $this->assertSame(60, $job->timeout);
    }
}
