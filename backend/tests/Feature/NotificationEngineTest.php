<?php

namespace Tests\Feature;

use App\Jobs\ProcessNotificationJob;
use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\HazardEvent;
use App\Models\HazardType;
use App\Models\NotificationDeliveryLog;
use App\Models\Region;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\UserNotificationPreference;
use App\Models\UserSavedRegion;
use App\Services\Notification\NotificationService;
use Database\Seeders\SentravaxMasterSeeder;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationEngineTest extends TestCase
{
    protected User $admin;
    protected User $intel;
    protected User $user;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SentravaxMasterSeeder::class);

        $this->admin = User::where('email', 'admin@sentravax.go.id')->first();
        $this->intel = User::where('email', 'intelligence@sentravax.go.id')->first();
        $this->user = User::where('email', 'user@sentravax.id')->first();

        // Ensure a second user exists for strict cross-user isolation testing
        $this->otherUser = User::firstOrCreate(
            ['email' => 'other_user@sentravax.id'],
            [
                'name' => 'Warga Tetangga',
                'password' => bcrypt('password'),
                'role' => User::ROLE_USER,
            ]
        );

        // Reset notification state for clean deterministic tests
        UserNotificationPreference::whereIn('user_id', [$this->user->id, $this->otherUser->id])->delete();
        UserNotification::whereIn('user_id', [$this->user->id, $this->otherUser->id])->delete();
        NotificationDeliveryLog::whereIn('user_id', [$this->user->id, $this->otherUser->id])->delete();
    }

    public function test_guest_cannot_access_private_notification_endpoints(): void
    {
        $endpoints = [
            ['GET', '/api/v1/notifications'],
            ['GET', '/api/v1/notifications/1'],
            ['PATCH', '/api/v1/notifications/1/read'],
            ['POST', '/api/v1/notifications/read-all'],
            ['GET', '/api/v1/me/notification-preferences'],
            ['PUT', '/api/v1/me/notification-preferences'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $response = $this->json($method, $uri);
            $response->assertStatus(401);
        }
    }

    public function test_user_can_list_notifications_with_filtering_and_pagination(): void
    {
        // Create sample notifications for this user
        UserNotification::create([
            'user_id' => $this->user->id,
            'title' => 'Pemberitahuan Sistem 1',
            'body' => 'Pesan sistem pertama.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => UserNotification::URGENCY_INFO,
            'read_at' => null,
        ]);

        UserNotification::create([
            'user_id' => $this->user->id,
            'title' => 'Peringatan Bahaya Gempa',
            'body' => 'Gempa berkekuatan 5.2 terasa di wilayah Anda.',
            'category' => UserNotification::CATEGORY_OFFICIAL_WARNING,
            'urgency' => UserNotification::URGENCY_CRITICAL,
            'read_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/notifications?per_page=10');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'body',
                        'category',
                        'urgency',
                        'read_at',
                        'created_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                    'unread_count',
                ],
            ]);

        // Filter unread only
        $resUnread = $this->actingAs($this->user)->getJson('/api/v1/notifications?status=unread');
        $resUnread->assertStatus(200);
        foreach ($resUnread->json('data') as $item) {
            $this->assertNull($item['read_at']);
        }

        // Filter category official_warning
        $resCat = $this->actingAs($this->user)->getJson('/api/v1/notifications?category=official_warning');
        $resCat->assertStatus(200);
        foreach ($resCat->json('data') as $item) {
            $this->assertEquals(UserNotification::CATEGORY_OFFICIAL_WARNING, $item['category']);
        }
    }

    public function test_user_can_view_single_notification_detail(): void
    {
        $notif = UserNotification::create([
            'user_id' => $this->user->id,
            'title' => 'Detail Notifikasi Uji',
            'body' => 'Isi lengkap notifikasi pengujian.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => UserNotification::URGENCY_INFO,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/v1/notifications/{$notif->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $notif->id,
                    'title' => 'Detail Notifikasi Uji',
                ],
            ]);
    }

    public function test_strict_cross_user_isolation_preventing_unauthorized_access(): void
    {
        // Notification belongs to otherUser
        $notif = UserNotification::create([
            'user_id' => $this->otherUser->id,
            'title' => 'Notifikasi Rahasia User B',
            'body' => 'Tidak boleh diakses User A.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => UserNotification::URGENCY_INFO,
        ]);

        // User A attempts to view User B's notification -> 404
        $resShow = $this->actingAs($this->user)->getJson("/api/v1/notifications/{$notif->id}");
        $resShow->assertStatus(404);

        // User A attempts to mark User B's notification as read -> 404
        $resRead = $this->actingAs($this->user)->patchJson("/api/v1/notifications/{$notif->id}/read");
        $resRead->assertStatus(404);

        $this->assertNull($notif->fresh()->read_at);
    }

    public function test_user_can_mark_single_notification_as_read(): void
    {
        $notif = UserNotification::create([
            'user_id' => $this->user->id,
            'title' => 'Belum Dibaca',
            'body' => 'Harus ditandai dibaca.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => UserNotification::URGENCY_INFO,
            'read_at' => null,
        ]);

        $this->assertNull($notif->read_at);

        $response = $this->actingAs($this->user)->patchJson("/api/v1/notifications/{$notif->id}/read");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $notif->id,
                ],
            ]);

        $this->assertNotNull($notif->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        UserNotification::create([
            'user_id' => $this->user->id,
            'title' => 'Unread 1',
            'body' => 'B1',
            'read_at' => null,
        ]);
        UserNotification::create([
            'user_id' => $this->user->id,
            'title' => 'Unread 2',
            'body' => 'B2',
            'read_at' => null,
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/v1/notifications/read-all');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'unread_count' => 0,
                ],
            ]);

        $unreadCount = UserNotification::where('user_id', $this->user->id)->unread()->count();
        $this->assertEquals(0, $unreadCount);
    }

    public function test_user_notification_preferences_get_and_update(): void
    {
        // 1. Get default preferences
        $resGet = $this->actingAs($this->user)->getJson('/api/v1/me/notification-preferences');
        $resGet->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'enable_ai_insights' => true,
                    'enable_official_warnings' => true,
                    'enable_report_status' => true,
                    'in_app_enabled' => true,
                    'min_urgency' => 'info',
                ],
            ]);

        // 2. Update preferences: disable ai_insights and set min_urgency to warning
        $resPut = $this->actingAs($this->user)->putJson('/api/v1/me/notification-preferences', [
            'enable_ai_insights' => false,
            'min_urgency' => 'warning',
        ]);

        $resPut->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'enable_ai_insights' => false,
                    'min_urgency' => 'warning',
                ],
            ]);

        $this->assertFalse($this->user->notificationPreference->fresh()->enable_ai_insights);
        $this->assertEquals('warning', $this->user->notificationPreference->fresh()->min_urgency);
    }

    public function test_notification_service_published_ai_insight_generation(): void
    {
        $service = app(NotificationService::class);
        $region = Region::first();
        $hazard = HazardType::first();

        // Register user interest in this region
        UserSavedRegion::updateOrCreate(
            ['user_id' => $this->user->id, 'region_id' => $region->id],
            ['notify_alerts' => true]
        );

        // 1. High-confidence published insight creates notification
        $publishedInsight = AiInsight::create([
            'region_id' => $region->id,
            'hazard_type_id' => $hazard->id,
            'title' => 'Potensi Banjir Bandang DAS Hulu',
            'summary' => 'Debit sungai meningkat 300% dalam 2 jam terakhir.',
            'confidence_score' => 0.88,
            'confidence_level' => 'HIGH',
            'insight_type' => 'risk_analysis',
            'generation_mode' => 'rule_based',
            'recommendations' => ['Waspada evakuasi dokumen dan barang berharga'],
        ]);

        $delivered = $service->notifyPublishedInsight($publishedInsight);
        $this->assertGreaterThan(0, $delivered);

        $notif = UserNotification::where('user_id', $this->user->id)
            ->where('category', UserNotification::CATEGORY_AI_INSIGHT)
            ->where('related_id', $publishedInsight->id)
            ->first();

        $this->assertNotNull($notif);
        $this->assertStringContainsString('Potensi Banjir Bandang DAS Hulu', $notif->title);

        // 2. Low-confidence or draft insight does NOT create notification
        $draftInsight = AiInsight::create([
            'region_id' => $region->id,
            'hazard_type_id' => $hazard->id,
            'title' => 'Draft Insight Incomplete',
            'summary' => 'Preliminary draft data without verification.',
            'confidence_score' => 0.45,
            'confidence_level' => 'LOW',
            'insight_type' => 'preliminary_draft',
            'generation_mode' => 'simulated',
            'recommendations' => ['Tunggu verifikasi lanjutan'],
        ]);

        $deliveredDraft = $service->notifyPublishedInsight($draftInsight);
        $this->assertEquals(0, $deliveredDraft);

        $notifDraft = UserNotification::where('related_id', $draftInsight->id)->first();
        $this->assertNull($notifDraft);

        // Clean up created test insights
        $publishedInsight->delete();
        $draftInsight->delete();
    }

    public function test_official_warning_notification_rejects_simulated_sources(): void
    {
        $service = app(NotificationService::class);
        $region = Region::first();
        $hazard = HazardType::first();

        // 1. Simulated data source
        $simulatedSource = DataSource::where('is_simulated', true)->first();
        $this->assertNotNull($simulatedSource);

        $simulatedEvent = HazardEvent::create([
            'title' => 'Simulated Event ' . uniqid(),
            'description' => 'Simulated disaster description.',
            'hazard_type_id' => $hazard->id,
            'data_source_id' => $simulatedSource->id,
            'region_id' => $region->id,
            'severity' => 'critical',
            'status' => 'active',
            'occurred_at' => now(),
            'reported_at' => now(),
            'location' => DB::raw("ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)"),
        ]);

        $simulatedAlert = Alert::create([
            'title' => 'Peringatan dari Sumber Simulasi',
            'message' => 'Pesan peringatan berbasis simulasi.',
            'hazard_type_id' => $hazard->id,
            'region_id' => $region->id,
            'hazard_event_id' => $simulatedEvent->id,
            'created_by' => $this->admin->id,
            'alert_class' => 'official_warning',
            'broadcast_level' => 'regional',
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => now()->addHours(6),
        ]);

        // Attempt distribution: must return 0 because source is simulated
        $deliveredSim = $service->notifyOfficialWarning($simulatedAlert);
        $this->assertEquals(0, $deliveredSim);

        // Clean up
        $simulatedAlert->delete();
        $simulatedEvent->delete();
    }

    public function test_community_report_status_change_notification(): void
    {
        $service = app(NotificationService::class);
        $report = CommunityReport::find(1);
        $this->assertNotNull($report);

        // 1. Status transition: pending -> verified
        $notif = $service->notifyReportStatusChange($report, 'pending', 'verified');

        $this->assertNotNull($notif);
        $this->assertEquals($report->user_id, $notif->user_id);
        $this->assertEquals(UserNotification::CATEGORY_REPORT_STATUS, $notif->category);
        $this->assertStringContainsString('Telah Diverifikasi', $notif->title);
        // Ensure internal moderation notes or admin personal details are not leaked
        $this->assertStringNotContainsString('password', $notif->body);
        $this->assertStringNotContainsString('@sentravax', $notif->body);
    }

    public function test_deduplication_prevents_duplicate_notifications(): void
    {
        $service = app(NotificationService::class);

        $notifData = [
            'title' => 'Peringatan Hujan Deras Berulang',
            'body' => 'Hujan lebat diperkirakan turun sore ini.',
            'category' => UserNotification::CATEGORY_DISASTER_ALERT,
            'urgency' => UserNotification::URGENCY_HIGH,
            'related_type' => 'alert',
            'related_id' => 88881,
            'material_key' => 'heavy_rain_v1',
            'cooldown_minutes' => 120,
        ];

        // 1. First delivery succeeds
        $first = $service->createNotification($this->user, $notifData);
        $this->assertNotNull($first);

        // 2. Immediate second delivery with identical fingerprint is blocked by deduplication
        $second = $service->createNotification($this->user, $notifData);
        $this->assertNull($second, 'Duplicate event must be blocked by deduplication service.');

        // 3. Delivery log records deduplication reason
        $log = NotificationDeliveryLog::where('user_id', $this->user->id)
            ->where('status', NotificationDeliveryLog::STATUS_DEDUPLICATED)
            ->latest()
            ->first();

        $this->assertNotNull($log);
        $this->assertStringContainsString('cooldown', $log->reason);
    }

    public function test_material_change_bypasses_cooldown_and_delivers_new_notification(): void
    {
        $service = app(NotificationService::class);

        // Version 1: Advisory
        $notifV1 = $service->createNotification($this->user, [
            'title' => 'Peringatan Banjir Kanal Barat',
            'body' => 'Status Waspada Siaga 3.',
            'category' => UserNotification::CATEGORY_OFFICIAL_WARNING,
            'urgency' => UserNotification::URGENCY_MEDIUM,
            'related_type' => 'alert',
            'related_id' => 77771,
            'material_key' => 'status:siaga_3',
        ]);
        $this->assertNotNull($notifV1);

        // Version 2: Material change to Critical Warning Siaga 1
        $notifV2 = $service->createNotification($this->user, [
            'title' => 'Peringatan Banjir Kanal Barat - Eskalasi',
            'body' => 'Status Darurat Siaga 1. Segera evakuasi.',
            'category' => UserNotification::CATEGORY_OFFICIAL_WARNING,
            'urgency' => UserNotification::URGENCY_CRITICAL,
            'related_type' => 'alert',
            'related_id' => 77771,
            'material_key' => 'status:siaga_1_critical',
        ]);

        $this->assertNotNull($notifV2, 'Materially changed event must generate a fresh notification.');
        $this->assertNotEquals($notifV1->id, $notifV2->id);
    }

    public function test_preference_filtering_suppresses_disabled_category(): void
    {
        $service = app(NotificationService::class);

        // User disables AI Insights
        $this->user->notificationPreference()->updateOrCreate(
            ['user_id' => $this->user->id],
            ['enable_ai_insights' => false]
        );

        $notif = $service->createNotification($this->user, [
            'title' => 'AI Insight Tidak Diinginkan',
            'body' => 'Pengguna telah mematikan notifikasi kategori ini.',
            'category' => UserNotification::CATEGORY_AI_INSIGHT,
            'urgency' => UserNotification::URGENCY_MEDIUM,
        ]);

        $this->assertNull($notif);

        // Check delivery log indicates preference filtering
        $log = NotificationDeliveryLog::where('user_id', $this->user->id)
            ->where('status', NotificationDeliveryLog::STATUS_PREFERENCE_FILTERED)
            ->latest()
            ->first();

        $this->assertNotNull($log);
        $this->assertStringContainsString('preferensi pengguna', $log->reason);

        // Re-enable preference
        $this->user->notificationPreference()->update(['enable_ai_insights' => true]);
    }

    public function test_background_queue_job_executes_idempotently(): void
    {
        $data = [
            'title' => 'Tugas Queue Latar Belakang',
            'body' => 'Notifikasi yang diproses oleh background worker.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => UserNotification::URGENCY_INFO,
            'material_key' => 'queue_test_' . uniqid(),
        ];

        // Execute job directly
        $job = new ProcessNotificationJob($this->user->id, $data);
        $job->handle(app(NotificationService::class));

        $count = UserNotification::where('user_id', $this->user->id)
            ->where('title', 'Tugas Queue Latar Belakang')
            ->count();

        $this->assertEquals(1, $count);

        // Re-execute identical job to test idempotency
        $job->handle(app(NotificationService::class));

        $countAfter = UserNotification::where('user_id', $this->user->id)
            ->where('title', 'Tugas Queue Latar Belakang')
            ->count();

        $this->assertEquals(1, $countAfter, 'Reprocessing queued job must not duplicate notification.');
    }

    public function test_urgency_consistency_and_canonical_mapping(): void
    {
        $service = app(NotificationService::class);

        // 1. Passing 'warning' normalizes to 'critical'
        $notif1 = $service->createNotification($this->user, [
            'title' => 'Peringatan Badai Ekstrem',
            'body' => 'Badai petir kategori tinggi melanda pesisir.',
            'category' => UserNotification::CATEGORY_OFFICIAL_WARNING,
            'urgency' => 'warning',
            'material_key' => 'storm_warning_test',
        ]);
        $this->assertNotNull($notif1);
        $this->assertEquals(UserNotification::URGENCY_CRITICAL, $notif1->urgency);

        // 2. Querying with ?urgency=warning matches 'critical' records via canonical mapping
        $resWarning = $this->actingAs($this->user)->getJson('/api/v1/notifications?urgency=warning');
        $resWarning->assertStatus(200)
            ->assertJsonFragment(['id' => $notif1->id]);

        // 3. Querying with ?urgency=critical also matches
        $resCritical = $this->actingAs($this->user)->getJson('/api/v1/notifications?urgency=critical');
        $resCritical->assertStatus(200)
            ->assertJsonFragment(['id' => $notif1->id]);

        // 4. Test preference boundaries: min_urgency = 'watch' suppresses 'medium' but allows 'critical'
        $this->user->notificationPreference()->updateOrCreate(
            ['user_id' => $this->user->id],
            ['min_urgency' => 'watch']
        );

        // Medium item should be suppressed
        $medItem = $service->createNotification($this->user, [
            'title' => 'Info Sedang',
            'body' => 'Pesan tingkat sedang.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => 'medium',
            'material_key' => 'med_boundary_test',
        ]);
        $this->assertNull($medItem);

        // High item should be delivered
        $highItem = $service->createNotification($this->user, [
            'title' => 'Info Tinggi',
            'body' => 'Pesan tingkat tinggi.',
            'category' => UserNotification::CATEGORY_SYSTEM,
            'urgency' => 'high',
            'material_key' => 'high_boundary_test',
        ]);
        $this->assertNotNull($highItem);
    }

    public function test_preliminary_draft_insight_strictly_rejected_even_with_high_confidence(): void
    {
        $service = app(NotificationService::class);
        $region = Region::first();
        $hazard = HazardType::first();

        // Insight with high confidence (0.95) but marked as preliminary draft
        $draftInsight = AiInsight::create([
            'region_id' => $region->id,
            'hazard_type_id' => $hazard->id,
            'title' => 'Draft Analisis Spasial Sementara',
            'summary' => 'Belum dikonfirmasi oleh analis intelijen.',
            'confidence_score' => 0.95,
            'confidence_level' => 'HIGH',
            'insight_type' => 'preliminary_draft',
            'generation_mode' => 'rule_based',
            'recommendations' => ['Tunggu verifikasi lanjutan'],
        ]);

        $delivered = $service->notifyPublishedInsight($draftInsight);
        $this->assertEquals(0, $delivered, 'Preliminary draft insights must never produce notifications.');

        $draftInsight->delete();
    }
}
