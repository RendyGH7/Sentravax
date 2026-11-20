<?php

namespace Tests\Feature;

use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use App\Services\ExternalData\DataSyncService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommunityReportAndExternalDataIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    /**
     * Test public guest can upload a valid image report and retrieve it via HTTP.
     */
    public function test_guest_can_upload_photo_and_access_it_via_public_storage(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();
        $file = UploadedFile::fake()->create('banjir_lapangan.jpg', 500, 'image/jpeg');

        $response = $this->post('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Genangan Pengujian Foto Publik',
            'description' => 'Genangan air terverifikasi dengan bukti foto dokumentasi.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $file,
            'reporter_name' => 'Warga Penguji',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $reportId = $response->json('data.id');
        $photoUrl = $response->json('data.photo_url');

        $this->assertNotNull($photoUrl);

        try {
            $report = CommunityReport::find($reportId);
            $this->assertNotNull($report->photo_path);

            // Assert file exists on public disk
            Storage::disk('public')->assertExists($report->photo_path);

            // Assert HTTP access to the storage route succeeds
            $storagePath = parse_url($photoUrl, PHP_URL_PATH);
            $imgResponse = $this->get($storagePath);
            $imgResponse->assertStatus(200);
            $this->assertStringContainsString('image', $imgResponse->headers->get('Content-Type'));

            // Assert path traversal is blocked
            $traversalResponse = $this->get('/storage/../.env');
            $traversalResponse->assertStatus(404);
        } finally {
            if ($reportId && !in_array($reportId, CommunityReport::BASELINE_IDS, true)) {
                DB::table('community_reports')->where('id', $reportId)->delete();
            }
        }
    }

    /**
     * Test report submission rejects invalid file types (e.g. PHP scripts or executables).
     */
    public function test_report_submission_rejects_invalid_file_types(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();
        $invalidFile = UploadedFile::fake()->create('malicious.php', 100, 'application/x-php');

        $response = $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan File Ilegal',
            'description' => 'Percobaan unggah berkas bukan gambar.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $invalidFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    /**
     * Test report submission rejects files exceeding 5MB limit.
     */
    public function test_report_submission_rejects_oversized_files(): void
    {
        $hazardType = HazardType::first();
        $region = Region::first();
        $largeFile = UploadedFile::fake()->create('giant_image.jpg', 6000, 'image/jpeg'); // 6MB (exceeds 5120KB)

        $response = $this->postJson('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Berkas Terlalu Besar',
            'description' => 'Berkas melebihi batas 5MB.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $largeFile,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    /**
     * Test authenticated citizen can upload photo and detail view returns photo_url.
     */
    public function test_authenticated_user_can_upload_photo_and_view_it(): void
    {
        $user = User::where('role', 'user')->first() ?? User::factory()->create(['role' => 'user']);
        $hazardType = HazardType::first();
        $region = Region::first();
        $file = UploadedFile::fake()->create('bukti_warga.png', 400, 'image/png');

        $response = $this->actingAs($user)->post('/api/v1/user/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Warga dengan Foto Terverifikasi',
            'description' => 'Bukti foto kerusakan tanggul sungai.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $reportId = $response->json('data.id');
        $this->assertNotNull($reportId);

        try {
            // Check show endpoint returns photo_url
            $showRes = $this->actingAs($user)->getJson("/api/v1/user/reports/{$reportId}");
            $showRes->assertStatus(200);
            $this->assertNotEmpty($showRes->json('data.photo_url'));

            // Check index endpoint includes photo_url
            $indexRes = $this->actingAs($user)->getJson('/api/v1/user/reports');
            $indexRes->assertStatus(200);
            $firstItem = collect($indexRes->json('data'))->firstWhere('id', $reportId);
            $this->assertNotNull($firstItem);
            $this->assertNotEmpty($firstItem['photo_url']);
        } finally {
            if ($reportId && !in_array($reportId, CommunityReport::BASELINE_IDS, true)) {
                DB::table('community_reports')->where('id', $reportId)->delete();
            }
        }
    }

    /**
     * Test explicit routing for BMKG InaTEWS vs BMKG Weather Radar in DataSyncService.
     */
    public function test_bmkg_adapters_are_routed_explicitly_without_collision(): void
    {
        $syncService = app(DataSyncService::class);

        // 1. BMKG InaTEWS Data Source
        $tewsSource = DataSource::where('category', 'seismology')->first()
            ?? DataSource::where('endpoint_url', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')->first();

        // 2. BMKG Weather Radar Data Source
        $weatherSource = DataSource::where('category', 'weather')->first()
            ?? DataSource::where('name', 'like', '%Weather Radar%')->first();

        $this->assertNotNull($tewsSource, 'BMKG TEWS DataSource must exist.');
        $this->assertNotNull($weatherSource, 'BMKG Weather Radar DataSource must exist.');

        // Mock TEWS endpoint
        Http::fake([
            'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json' => Http::response([
                'Infogempa' => [
                    'gempa' => [
                        'Tanggal' => '20 Nov 2026',
                        'Jam' => '09:00:00 WIB',
                        'DateTime' => '2026-11-20T02:00:00+00:00',
                        'Coordinates' => '-6.20,106.84',
                        'Lintang' => '6.20 LS',
                        'Bujur' => '106.84 BT',
                        'Magnitude' => '5.2',
                        'Kedalaman' => '10 km',
                        'Wilayah' => 'Pusat gempa uji coba',
                        'Potensi' => 'Tidak berpotensi tsunami',
                        'Dirasakan' => 'II-III MMI',
                        'Shakemap' => '',
                    ],
                ],
            ], 200),
            'https://api.bmkg.go.id/public/weather*' => Http::response([
                'message' => 'no Route matched with those values',
            ], 404),
        ]);

        // Sync InaTEWS: should succeed and persist earthquake
        $tewsRun = $syncService->syncDataSource($tewsSource);
        $this->assertEquals('SUCCESS', $tewsRun->status);
        $this->assertEquals('LIVE', $tewsRun->connectivity_state);
        $this->assertEquals('OFFICIAL', $tewsRun->provenance_type);

        // Sync Weather Radar: should route to weather adapter, detect 404, report UNAVAILABLE/FAILED, NEVER create earthquake
        $weatherRun = $syncService->syncDataSource($weatherSource);
        $this->assertEquals('FAILED', $weatherRun->status);
        $this->assertEquals('OFFLINE', $weatherRun->connectivity_state);
        $this->assertEquals('UNAVAILABLE', $weatherRun->freshness_state);
        $this->assertEquals('OFFICIAL', $weatherRun->provenance_type);
        $this->assertEquals(0, $weatherRun->items_persisted);
        $this->assertStringContainsString('404', $weatherRun->error_message ?? '');
    }
}
