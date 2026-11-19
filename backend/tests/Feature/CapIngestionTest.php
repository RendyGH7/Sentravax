<?php

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\Region;
use App\Services\ExternalData\CapAdapter;
use App\Services\ExternalData\DataSyncService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CapIngestionTest extends TestCase
{
    use DatabaseTransactions;

    protected CapAdapter $capAdapter;
    protected DataSource $capDataSource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->capAdapter = app(CapAdapter::class);

        $this->capDataSource = DataSource::firstOrCreate(
            ['name' => 'BMKG Common Alerting Protocol (CAP) Inbound Feed'],
            [
                'provider' => 'Badan Meteorologi, Klimatologi, dan Geofisika',
                'source_type' => 'cap',
                'category' => 'warning',
                'endpoint_url' => 'https://www.bmkg.go.id/alerts/nowcast/id',
                'status' => 'active',
                'sync_interval_minutes' => 5,
                'rate_limit_rpm' => 60,
                'terms_of_service' => 'Data Terbuka BMKG',
                'is_simulated' => false,
            ]
        );
    }

    /**
     * Sample standard OASIS CAP v1.2 XML string.
     */
    protected function getSampleCapXml(string $identifier = '2.49.0.1.360.0.2026.TEST.001', string $msgType = 'Alert', ?string $references = null): string
    {
        $refTag = $references ? "<references>{$references}</references>" : '';
        $sent = now()->subMinutes(15)->toIso8601String();
        $effective = now()->subMinutes(10)->toIso8601String();
        $expires = now()->addHours(5)->toIso8601String();

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{$identifier}</identifier>
  <sender>cuaca.ekstrem@bmkg.go.id</sender>
  <sent>{$sent}</sent>
  <status>Actual</status>
  <msgType>{$msgType}</msgType>
  <scope>Public</scope>
  {$refTag}
  <info>
    <language>id</language>
    <category>Met</category>
    <event>Hujan Lebat dan Angin Kencang</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <effective>{$effective}</effective>
    <expires>{$expires}</expires>
    <senderName>Badan Meteorologi Klimatologi dan Geofisika</senderName>
    <headline>Peringatan Dini Cuaca Ekstrem Provinsi DKI Jakarta</headline>
    <description>Hujan lebat disertai kilat/petir dan angin kencang berpotensi terjadi di wilayah Jakarta Timur dan sekitarnya.</description>
    <instruction>Warga diimbau menjauhi pohon rindang, papan reklame, dan mematikan peralatan listrik rawan air.</instruction>
    <web>https://nowcasting.bmkg.go.id/infografis/test.jpg</web>
    <area>
      <areaDesc>Provinsi DKI Jakarta</areaDesc>
      <polygon>-6.18,106.82 -6.18,106.88 -6.24,106.88 -6.24,106.82 -6.18,106.82</polygon>
    </area>
  </info>
</alert>
XML;
    }

    /**
     * Test CAP parser extracts fields and persists an active official warning.
     */
    public function test_cap_adapter_parses_and_persists_official_warning(): void
    {
        $xml = $this->getSampleCapXml('2.49.0.1.360.0.2026.TEST.001');

        $alert = $this->capAdapter->parseAndPersistCapXml($xml, $this->capDataSource);

        $this->assertNotNull($alert);
        $this->assertEquals('2.49.0.1.360.0.2026.TEST.001', $alert->external_identifier);
        $this->assertEquals('official_warning', $alert->alert_class);
        $this->assertEquals('active', $alert->status);
        $this->assertEquals('Severe', $alert->cap_severity);
        $this->assertEquals('Immediate', $alert->cap_urgency);
        $this->assertEquals('Observed', $alert->cap_certainty);
        $this->assertStringContainsString('Peringatan Dini Cuaca Ekstrem', $alert->title);
        $this->assertStringContainsString('Warga diimbau menjauhi pohon', $alert->instruction);
        $this->assertEquals('Provinsi DKI Jakarta', $alert->area_description);
        $this->assertNotNull($alert->polygon_coordinates);

        // Check linked hazard event
        $this->assertNotNull($alert->hazard_event_id);
        $event = HazardEvent::find($alert->hazard_event_id);
        $this->assertNotNull($event);
        $this->assertStringContainsString('2.49.0.1.360.0.2026.TEST.001', $event->description);
    }

    /**
     * Test deduplication: Ingesting the same CAP identifier is idempotent.
     */
    public function test_cap_ingestion_is_idempotent(): void
    {
        $xml = $this->getSampleCapXml('2.49.0.1.360.0.2026.IDEMPOTENT.001');

        $alert1 = $this->capAdapter->parseAndPersistCapXml($xml, $this->capDataSource);
        $countInitial = Alert::where('external_identifier', '2.49.0.1.360.0.2026.IDEMPOTENT.001')->count();
        $this->assertEquals(1, $countInitial);

        // Re-ingest
        $alert2 = $this->capAdapter->parseAndPersistCapXml($xml, $this->capDataSource);
        $countAfter = Alert::where('external_identifier', '2.49.0.1.360.0.2026.IDEMPOTENT.001')->count();

        $this->assertEquals(1, $countAfter);
        $this->assertEquals($alert1->id, $alert2->id);
    }

    /**
     * Test CAP Update message updates the referenced alert.
     */
    public function test_cap_update_message_updates_existing_alert(): void
    {
        $originalId = '2.49.0.1.360.0.2026.UPDATE.ORIG';
        $xmlOriginal = $this->getSampleCapXml($originalId);
        $alertOriginal = $this->capAdapter->parseAndPersistCapXml($xmlOriginal, $this->capDataSource);

        $updateId = '2.49.0.1.360.0.2026.UPDATE.NEW';
        $references = "cuaca.ekstrem@bmkg.go.id,{$originalId},2026-11-18T14:30:00+07:00";

        $xmlUpdate = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{$updateId}</identifier>
  <sender>cuaca.ekstrem@bmkg.go.id</sender>
  <sent>2026-11-18T15:00:00+07:00</sent>
  <status>Actual</status>
  <msgType>Update</msgType>
  <scope>Public</scope>
  <references>{$references}</references>
  <info>
    <language>id</language>
    <category>Met</category>
    <event>Hujan Lebat dan Angin Kencang (Perpanjangan)</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <effective>2026-11-18T15:00:00+07:00</effective>
    <expires>2026-11-18T21:00:00+07:00</expires>
    <senderName>Badan Meteorologi Klimatologi dan Geofisika</senderName>
    <headline>Peringatan Dini Cuaca Ekstrem DKI Jakarta (DIPERBARUI)</headline>
    <description>Durasi hujan lebat diperpanjang hingga pukul 21:00 WIB.</description>
    <instruction>Tetap waspada dan jangan beraktivitas di dekat baliho besar.</instruction>
  </info>
</alert>
XML;

        $alertUpdated = $this->capAdapter->parseAndPersistCapXml($xmlUpdate, $this->capDataSource);

        $this->assertNotNull($alertUpdated);
        $this->assertEquals($alertOriginal->id, $alertUpdated->id);
        $this->assertStringContainsString('(DIPERBARUI)', $alertUpdated->title);
        $this->assertStringContainsString('hingga pukul 21:00 WIB', $alertUpdated->message);
    }

    /**
     * Test CAP Cancel message marks alert as cancelled.
     */
    public function test_cap_cancel_message_cancels_alert(): void
    {
        $originalId = '2.49.0.1.360.0.2026.CANCEL.TARGET';
        $xmlOriginal = $this->getSampleCapXml($originalId);
        $alertOriginal = $this->capAdapter->parseAndPersistCapXml($xmlOriginal, $this->capDataSource);
        $this->assertEquals('active', $alertOriginal->status);

        $cancelId = '2.49.0.1.360.0.2026.CANCEL.EXEC';
        $references = "cuaca.ekstrem@bmkg.go.id,{$originalId},2026-11-18T14:30:00+07:00";

        $xmlCancel = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{$cancelId}</identifier>
  <sender>cuaca.ekstrem@bmkg.go.id</sender>
  <sent>2026-11-18T16:00:00+07:00</sent>
  <status>Actual</status>
  <msgType>Cancel</msgType>
  <scope>Public</scope>
  <references>{$references}</references>
  <info>
    <language>id</language>
    <category>Met</category>
    <event>Hujan Lebat dan Angin Kencang</event>
    <urgency>Past</urgency>
    <severity>Minor</severity>
    <certainty>Observed</certainty>
    <headline>Pencabutan Peringatan Dini Cuaca Ekstrem</headline>
    <description>Kondisi cuaca telah membaik dan kembali normal.</description>
  </info>
</alert>
XML;

        $cancelledAlert = $this->capAdapter->parseAndPersistCapXml($xmlCancel, $this->capDataSource);

        $this->assertNotNull($cancelledAlert);
        $this->assertEquals($alertOriginal->id, $cancelledAlert->id);
        $this->assertEquals('cancelled', $cancelledAlert->status);
    }

    /**
     * Test expired CAP alert is flagged as expired and not active.
     */
    public function test_expired_cap_alert_is_flagged_as_expired(): void
    {
        $expiredId = '2.49.0.1.360.0.2026.EXPIRED.001';
        $pastExpires = now()->subHours(2)->toIso8601String();
        $pastStarts = now()->subHours(5)->toIso8601String();

        $xml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{$expiredId}</identifier>
  <sender>cuaca.ekstrem@bmkg.go.id</sender>
  <sent>{$pastStarts}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>id</language>
    <category>Met</category>
    <event>Hujan Lebat Lampau</event>
    <urgency>Past</urgency>
    <severity>Moderate</severity>
    <certainty>Observed</certainty>
    <effective>{$pastStarts}</effective>
    <expires>{$pastExpires}</expires>
    <headline>Peringatan Cuaca Kedaluwarsa</headline>
    <description>Peringatan yang masa berlakunya telah terlampaui.</description>
  </info>
</alert>
XML;

        $alert = $this->capAdapter->parseAndPersistCapXml($xml, $this->capDataSource);

        $this->assertNotNull($alert);
        $this->assertEquals('expired', $alert->status);
    }

    /**
     * Test public alerts API returns verified issuer attribution for CAP alerts.
     */
    public function test_public_api_displays_verified_cap_issuer(): void
    {
        $capId = '2.49.0.1.360.0.2026.API.VERIFIED';
        $xml = $this->getSampleCapXml($capId);
        $alert = $this->capAdapter->parseAndPersistCapXml($xml, $this->capDataSource);

        // Test list endpoint
        $listResponse = $this->getJson('/api/v1/public/alerts?status=active');
        $listResponse->assertStatus(200);

        $items = $listResponse->json('data.data');
        $capItem = collect($items)->firstWhere('external_identifier', $capId);

        $this->assertNotNull($capItem);
        $this->assertTrue($capItem['issuer']['is_verified']);
        $this->assertEquals('Badan Meteorologi Klimatologi dan Geofisika', $capItem['issuer']['name']);
        $this->assertEquals('official_cap', $capItem['issuer']['source_type']);

        // Test detail endpoint
        $detailResponse = $this->getJson("/api/v1/public/alerts/{$alert->id}");
        $detailResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $alert->id,
                    'external_identifier' => $capId,
                    'instruction' => $alert->instruction,
                    'area_description' => 'Provinsi DKI Jakarta',
                    'issuer' => [
                        'is_verified' => true,
                        'name' => 'Badan Meteorologi Klimatologi dan Geofisika',
                    ],
                ],
            ]);
    }

    /**
     * Test DataSyncService integration with CAP source.
     */
    public function test_datasync_service_syncs_cap_data_source(): void
    {
        $syncService = app(DataSyncService::class);
        $syncRun = $syncService->syncDataSource($this->capDataSource);

        $this->assertNotNull($syncRun);
        $this->assertEquals($this->capDataSource->id, $syncRun->data_source_id);
        $this->assertContains($syncRun->status, ['SUCCESS', 'FAILED']);
        $this->assertNotNull($syncRun->freshness_state);
        $this->assertNotNull($this->capDataSource->fresh()->last_fetched_at);
    }
}
