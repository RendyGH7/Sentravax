<?php

namespace Tests\Feature;

use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\EmergencyDirectoryAuditLog;
use App\Models\Region;
use App\Models\User;
use App\Services\EmergencyDirectory\EmergencyDirectoryAuditService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EmergencyDirectoryAuditTrailTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected User $intelligenceUser;
    protected User $regularUser;
    protected ?Region $dkiProvince;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::where('role', User::ROLE_ADMIN)->first() ?? User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->intelligenceUser = User::where('role', User::ROLE_INTELLIGENCE)->first() ?? User::factory()->create(['role' => User::ROLE_INTELLIGENCE]);
        $this->regularUser = User::where('role', User::ROLE_USER)->first() ?? User::factory()->create(['role' => User::ROLE_USER]);

        $this->dkiProvince = Region::where('code', 'ID-JK')->where('level', 'province')->first();
    }

    // ==========================================
    // 1. PARENT CONTACT AUDIT EVENTS
    // ==========================================

    public function test_parent_contact_created_records_audit_log_with_snapshot(): void
    {
        $payload = [
            'name' => 'Badan Penanggulangan Bencana Uji Audit',
            'slug' => 'bpbd-uji-audit-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'description' => 'Instansi simulasi untuk pengujian audit trail.',
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/emergency-contacts', $payload);

        $response->assertStatus(201);
        $contactId = $response->json('data.id');

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contactId)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals($contactId, $auditLog->parent_contact_id);
        $this->assertEquals($this->adminUser->id, $auditLog->actor_id);
        $this->assertNull($auditLog->old_values);
        $this->assertNotNull($auditLog->new_values);
        $this->assertEquals('Badan Penanggulangan Bencana Uji Audit', $auditLog->new_values['name']);
        $this->assertEquals(EmergencyContact::SCOPE_NATIONAL, $auditLog->new_values['scope']);
    }

    public function test_parent_contact_updated_records_delta_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Kontak Uji Update',
            'slug' => 'kontak-uji-update-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $updatePayload = [
            'name' => 'Kontak Uji Update Terbarukan',
            'category' => EmergencyContact::CATEGORY_MEDICAL,
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/emergency-contacts/{$contact->id}", $updatePayload);

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contact->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CONTACT_UPDATED)
            ->latest('id')
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals($this->adminUser->id, $auditLog->actor_id);
        $this->assertEquals('Kontak Uji Update', $auditLog->old_values['name']);
        $this->assertEquals('Kontak Uji Update Terbarukan', $auditLog->new_values['name']);
        $this->assertEquals(EmergencyContact::CATEGORY_SAR, $auditLog->old_values['category']);
        $this->assertEquals(EmergencyContact::CATEGORY_MEDICAL, $auditLog->new_values['category']);
        // Unmodified fields must not be present in delta
        $this->assertArrayNotHasKey('scope', $auditLog->new_values);
    }

    public function test_parent_contact_update_noop_generates_no_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Kontak No-Op',
            'slug' => 'kontak-noop-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_POLICE,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $initialLogsCount = EmergencyDirectoryAuditLog::where('entity_id', $contact->id)->count();

        // Send exact same values
        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/emergency-contacts/{$contact->id}", [
                'name' => 'Kontak No-Op',
                'category' => EmergencyContact::CATEGORY_POLICE,
            ]);

        $response->assertStatus(200);

        $afterLogsCount = EmergencyDirectoryAuditLog::where('entity_id', $contact->id)->count();
        $this->assertEquals($initialLogsCount, $afterLogsCount);
    }

    public function test_parent_contact_verification_status_changed_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Kontak Verifikasi Audit',
            'slug' => 'kontak-verif-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_FIRE,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/verification", [
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
            ]);

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contact->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CONTACT_VERIFICATION_CHANGED)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals(EmergencyContact::STATUS_UNVERIFIED, $auditLog->old_values['verification_status']);
        $this->assertEquals(EmergencyContact::STATUS_VERIFIED, $auditLog->new_values['verification_status']);
    }

    public function test_parent_contact_publication_status_changed_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Kontak Publikasi Audit',
            'slug' => 'kontak-pub-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_FIRE,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        // Add verified active channel so publication passes business rule
        EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
            'label' => 'Hotline Publikasi',
            'value' => '021-9999000',
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'source_name' => 'Resmi',
            'source_url' => 'https://example.com',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/publication", [
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
            ]);

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contact->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CONTACT_PUBLICATION_CHANGED)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $auditLog->old_values['publication_status']);
        $this->assertEquals(EmergencyContact::PUB_PUBLISHED, $auditLog->new_values['publication_status']);
    }

    public function test_parent_contact_soft_deleted_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Kontak Hapus Audit',
            'slug' => 'kontak-hapus-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_OTHER,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/emergency-contacts/{$contact->id}");

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contact->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CONTACT_SOFT_DELETED)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertNull($auditLog->old_values['deleted_at']);
        $this->assertNotNull($auditLog->new_values['deleted_at']);
    }

    // ==========================================
    // 2. CHANNEL AUDIT EVENTS
    // ==========================================

    public function test_channel_created_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Channel Audit',
            'slug' => 'parent-channel-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $payload = [
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Call Center 115',
            'value' => '115',
            'is_toll_free' => true,
            'is_primary' => false,
            'operating_hours' => '24 Jam',
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'source_name' => 'Portal SAR',
            'source_url' => 'https://basarnas.go.id',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels", $payload);

        $response->assertStatus(201);
        $channelId = $response->json('data.id');

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channelId)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_CREATED)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals($contact->id, $auditLog->parent_contact_id);
        $this->assertTrue($auditLog->new_values['is_toll_free']);
        $this->assertEquals('115', $auditLog->new_values['value']);
    }

    public function test_channel_updated_records_delta_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Channel Update Audit',
            'slug' => 'parent-channel-upd-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $channel = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OFFICE_CONTACT,
            'label' => 'Kanal Awal',
            'value' => '021-123456',
            'is_toll_free' => false,
            'is_primary' => false,
            'verification_status' => EmergencyContactChannel::STATUS_UNVERIFIED,
            'source_name' => 'Internal',
            'source_url' => 'https://example.com/source',
            'is_active' => true,
        ]);

        $updatePayload = [
            'label' => 'Kanal Diperbarui',
            'is_toll_free' => true,
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel->id}", $updatePayload);

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channel->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_UPDATED)
            ->latest('id')
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals('Kanal Awal', $auditLog->old_values['label']);
        $this->assertEquals('Kanal Diperbarui', $auditLog->new_values['label']);
        $this->assertFalse($auditLog->old_values['is_toll_free']);
        $this->assertTrue($auditLog->new_values['is_toll_free']);
    }

    public function test_channel_toggled_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Channel Toggle Audit',
            'slug' => 'parent-toggle-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $channel = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OFFICE_CONTACT,
            'label' => 'Kanal Toggle',
            'value' => '021-555555',
            'is_toll_free' => false,
            'is_primary' => false,
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'source_name' => 'Sumber',
            'source_url' => 'https://example.com',
            'is_active' => true,
        ]);

        // Toggle to inactive
        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel->id}/toggle");

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channel->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_DEACTIVATED)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertTrue($auditLog->old_values['is_active']);
        $this->assertFalse($auditLog->new_values['is_active']);

        // Toggle back to active
        $response2 = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel->id}/toggle");

        $response2->assertStatus(200);

        $auditLog2 = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channel->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_ACTIVATED)
            ->first();

        $this->assertNotNull($auditLog2);
        $this->assertFalse($auditLog2->old_values['is_active']);
        $this->assertTrue($auditLog2->new_values['is_active']);
    }

    public function test_channel_primary_promoted_and_demoted_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Primary Test',
            'slug' => 'parent-primary-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $channel1 = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Channel Satu (Existing Primary)',
            'value' => '021-111111',
            'is_primary' => true,
            'is_active' => true,
            'source_name' => 'S1',
            'source_url' => 'https://example.com/1',
        ]);

        $channel2 = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Channel Dua (Promoted to Primary)',
            'value' => '021-222222',
            'is_primary' => false,
            'is_active' => true,
            'source_name' => 'S2',
            'source_url' => 'https://example.com/2',
        ]);

        // Promote channel 2
        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel2->id}/primary");

        $response->assertStatus(200);

        // Verify channel 1 demoted audit log
        $demoteLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channel1->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_PRIMARY_DEMOTED)
            ->first();

        $this->assertNotNull($demoteLog);
        $this->assertTrue($demoteLog->old_values['is_primary']);
        $this->assertFalse($demoteLog->new_values['is_primary']);

        // Verify channel 2 promoted audit log
        $promoteLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channel2->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_PRIMARY_PROMOTED)
            ->first();

        $this->assertNotNull($promoteLog);
        $this->assertFalse($promoteLog->old_values['is_primary']);
        $this->assertTrue($promoteLog->new_values['is_primary']);
    }

    public function test_channel_primary_noop_generates_no_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Primary No-op',
            'slug' => 'parent-pri-noop-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $channel = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Channel Already Primary',
            'value' => '021-333333',
            'is_primary' => true,
            'is_active' => true,
            'source_name' => 'S3',
            'source_url' => 'https://example.com/3',
        ]);

        $initialCount = EmergencyDirectoryAuditLog::where('entity_id', $channel->id)->count();

        // Promote already primary channel
        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel->id}/primary");

        $response->assertStatus(200);

        $afterCount = EmergencyDirectoryAuditLog::where('entity_id', $channel->id)->count();
        $this->assertEquals($initialCount, $afterCount);
    }

    public function test_channel_deactivated_via_delete_records_audit_log(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Deactivate Delete',
            'slug' => 'parent-del-chan-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $channel = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Channel to Deactivate via Delete',
            'value' => '021-444444',
            'is_active' => true,
            'source_name' => 'S4',
            'source_url' => 'https://example.com/4',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel->id}");

        $response->assertStatus(200);

        $auditLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CHANNEL)
            ->where('entity_id', $channel->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_CHANNEL_DEACTIVATED_VIA_DELETE)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertTrue($auditLog->old_values['is_active']);
        $this->assertFalse($auditLog->new_values['is_active']);
    }

    // ==========================================
    // 3. AUTOMATIC SIDE EFFECTS AUDIT EVENTS
    // ==========================================

    public function test_parent_publication_auto_demoted_due_to_parent_verification_revocation(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Auto Demote Verif',
            'slug' => 'parent-auto-verif-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_PUBLISHED,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Channel Verif',
            'value' => '021-888888',
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'is_active' => true,
            'source_name' => 'S',
            'source_url' => 'https://example.com',
        ]);

        // Revoke parent verification status
        $response = $this->actingAs($this->adminUser)
            ->patchJson("/api/v1/admin/emergency-contacts/{$contact->id}/verification", [
                'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            ]);

        $response->assertStatus(200);

        $contact->refresh();
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $contact->publication_status);

        // Check side effect audit log
        $sideEffectLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contact->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_PARENT_PUB_AUTO_DEMOTED_DUE_TO_VERIFICATION)
            ->first();

        $this->assertNotNull($sideEffectLog);
        $this->assertEquals(EmergencyContact::PUB_PUBLISHED, $sideEffectLog->old_values['publication_status']);
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $sideEffectLog->new_values['publication_status']);
    }

    public function test_parent_publication_auto_demoted_due_to_channel_deactivation(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent Auto Demote Channel',
            'slug' => 'parent-auto-chan-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_PUBLISHED,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        // Only ONE active verified channel exists
        $channel = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Sole Active Verified Channel',
            'value' => '021-777777',
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'is_active' => true,
            'source_name' => 'S',
            'source_url' => 'https://example.com',
        ]);

        // Deactivate that sole channel via delete
        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/emergency-contacts/{$contact->id}/channels/{$channel->id}");

        $response->assertStatus(200);

        $contact->refresh();
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $contact->publication_status);

        // Verify side effect audit log
        $sideEffectLog = EmergencyDirectoryAuditLog::where('entity_type', EmergencyDirectoryAuditLog::ENTITY_CONTACT)
            ->where('entity_id', $contact->id)
            ->where('action', EmergencyDirectoryAuditLog::ACTION_PARENT_PUB_AUTO_DEMOTED_DUE_TO_CHANNEL)
            ->first();

        $this->assertNotNull($sideEffectLog);
        $this->assertEquals(EmergencyContact::PUB_PUBLISHED, $sideEffectLog->old_values['publication_status']);
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $sideEffectLog->new_values['publication_status']);
    }

    // ==========================================
    // 4. TRANSACTION ROLLBACK INTEGRITY
    // ==========================================

    public function test_transaction_rolls_back_completely_on_error(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Rollback Parent',
            'slug' => 'rollback-parent-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $initialLogsCount = EmergencyDirectoryAuditLog::where('parent_contact_id', $contact->id)->count();

        // Simulate transaction with manual throw
        try {
            DB::transaction(function () use ($contact) {
                $contact->name = 'Name That Should Rollback';
                $contact->save();

                app(EmergencyDirectoryAuditService::class)->record(
                    EmergencyDirectoryAuditLog::ENTITY_CONTACT,
                    $contact->id,
                    $contact->id,
                    EmergencyDirectoryAuditLog::ACTION_CONTACT_UPDATED,
                    ['name' => 'Rollback Parent'],
                    ['name' => 'Name That Should Rollback'],
                    $this->adminUser->id,
                    '127.0.0.1'
                );

                throw new \RuntimeException('Simulated unexpected operational failure');
            });
        } catch (\RuntimeException $e) {
            // Expected simulation
        }

        $contact->refresh();
        $this->assertEquals('Rollback Parent', $contact->name);

        $afterLogsCount = EmergencyDirectoryAuditLog::where('parent_contact_id', $contact->id)->count();
        $this->assertEquals($initialLogsCount, $afterLogsCount);
    }

    // ==========================================
    // 5. READ API AUTHORIZATION & ENDPOINTS
    // ==========================================

    public function test_audit_logs_read_endpoint_authorization(): void
    {
        // 1. Guest -> 401
        $this->getJson('/api/v1/admin/emergency-contacts/audit-logs')
            ->assertStatus(401);

        // 2. Regular User -> 403
        $this->actingAs($this->regularUser)
            ->getJson('/api/v1/admin/emergency-contacts/audit-logs')
            ->assertStatus(403);

        // 3. Intelligence User -> 403
        $this->actingAs($this->intelligenceUser)
            ->getJson('/api/v1/admin/emergency-contacts/audit-logs')
            ->assertStatus(403);

        // 4. Admin User -> 200
        $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/emergency-contacts/audit-logs')
            ->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);
    }

    public function test_contact_specific_audit_logs_endpoint(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Parent For Entity Logs',
            'slug' => 'parent-entity-logs-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        // Guest -> 401
        $this->getJson("/api/v1/admin/emergency-contacts/{$contact->id}/audit-logs")
            ->assertStatus(401);

        // User -> 403
        $this->actingAs($this->regularUser)
            ->getJson("/api/v1/admin/emergency-contacts/{$contact->id}/audit-logs")
            ->assertStatus(403);

        // Intel -> 403
        $this->actingAs($this->intelligenceUser)
            ->getJson("/api/v1/admin/emergency-contacts/{$contact->id}/audit-logs")
            ->assertStatus(403);

        // Admin -> 200
        $this->actingAs($this->adminUser)
            ->getJson("/api/v1/admin/emergency-contacts/{$contact->id}/audit-logs")
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        // Non-existent contact -> 404
        $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/emergency-contacts/99999999/audit-logs')
            ->assertStatus(404);
    }

    public function test_audit_logs_filtering_and_pagination(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Filter Parent',
            'slug' => 'filter-parent-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        // Create specific audit log
        app(EmergencyDirectoryAuditService::class)->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            'contact_created',
            null,
            ['name' => 'Filter Parent'],
            $this->adminUser->id,
            '10.0.0.1'
        );

        $response = $this->actingAs($this->adminUser)
            ->getJson("/api/v1/admin/emergency-contacts/audit-logs?entity_type=emergency_contact&parent_contact_id={$contact->id}&action=contact_created");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $item) {
            $this->assertEquals(EmergencyDirectoryAuditLog::ENTITY_CONTACT, $item['entity_type']);
            $this->assertEquals($contact->id, $item['parent_contact_id']);
            $this->assertEquals('contact_created', $item['action']);
        }
    }

    // ==========================================
    // 6. APPEND-ONLY & MUTATION PROTECTION
    // ==========================================

    public function test_eloquent_save_on_existing_audit_log_throws_exception(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Contact Immutability Test',
            'slug' => 'contact-immutability-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $log = EmergencyDirectoryAuditLog::create([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contact->id,
            'parent_contact_id' => $contact->id,
            'actor_id' => $this->adminUser->id,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => ['name' => $contact->name],
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Emergency directory audit logs are immutable');

        $log->action = 'tampered_action';
        $log->save();
    }

    public function test_eloquent_delete_on_audit_log_throws_exception(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Contact Delete Immutability Test',
            'slug' => 'contact-del-immutability-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $log = EmergencyDirectoryAuditLog::create([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contact->id,
            'parent_contact_id' => $contact->id,
            'actor_id' => $this->adminUser->id,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => ['name' => $contact->name],
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Emergency directory audit logs are immutable');

        $log->delete();
    }

    public function test_postgresql_trigger_blocks_raw_update(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Trigger Update Test',
            'slug' => 'trigger-update-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $log = EmergencyDirectoryAuditLog::create([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contact->id,
            'parent_contact_id' => $contact->id,
            'actor_id' => $this->adminUser->id,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => ['name' => $contact->name],
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);

        $failed = false;
        try {
            DB::statement("SAVEPOINT sp_test_update");
            DB::statement("UPDATE emergency_directory_audit_logs SET action = 'tampered' WHERE id = ?", [$log->id]);
        } catch (\Throwable $e) {
            DB::statement("ROLLBACK TO SAVEPOINT sp_test_update");
            $failed = true;
            $this->assertStringContainsString('append-only', $e->getMessage());
        }

        $this->assertTrue($failed, 'Expected PostgreSQL trigger to block UPDATE statement on audit log table.');
    }

    public function test_postgresql_trigger_blocks_raw_delete(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'Trigger Delete Test',
            'slug' => 'trigger-delete-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        $log = EmergencyDirectoryAuditLog::create([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contact->id,
            'parent_contact_id' => $contact->id,
            'actor_id' => $this->adminUser->id,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => ['name' => $contact->name],
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);

        $failed = false;
        try {
            DB::statement("SAVEPOINT sp_test_delete");
            DB::statement("DELETE FROM emergency_directory_audit_logs WHERE id = ?", [$log->id]);
        } catch (\Throwable $e) {
            DB::statement("ROLLBACK TO SAVEPOINT sp_test_delete");
            $failed = true;
            $this->assertStringContainsString('append-only', $e->getMessage());
        }

        $this->assertTrue($failed, 'Expected PostgreSQL trigger to block DELETE statement on audit log table.');
    }

    public function test_postgresql_trigger_blocks_raw_truncate(): void
    {
        $failed = false;
        try {
            DB::statement("SAVEPOINT sp_test_truncate");
            DB::statement("TRUNCATE emergency_directory_audit_logs");
        } catch (\Throwable $e) {
            DB::statement("ROLLBACK TO SAVEPOINT sp_test_truncate");
            $failed = true;
            $this->assertStringContainsString('append-only', $e->getMessage());
        }

        $this->assertTrue($failed, 'Expected PostgreSQL trigger to block TRUNCATE statement on audit log table.');
    }

    // ==========================================
    // 7. FOREIGN KEY & ACTOR INTEGRITY
    // ==========================================

    public function test_actor_deletion_sets_actor_id_null_without_deleting_audit_log(): void
    {
        $tempActor = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $contact = EmergencyContact::create([
            'name' => 'Actor Deletion Test',
            'slug' => 'actor-del-test-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_by' => $tempActor->id,
            'updated_by' => $tempActor->id,
        ]);

        $log = EmergencyDirectoryAuditLog::create([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contact->id,
            'parent_contact_id' => $contact->id,
            'actor_id' => $tempActor->id,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => ['name' => $contact->name],
            'ip_address' => '192.168.1.1',
            'created_at' => now(),
        ]);

        // Delete the actor
        $tempActor->delete();

        $log->refresh();
        $this->assertNull($log->actor_id, 'actor_id should be set to null on user deletion (ON DELETE SET NULL).');
        $this->assertEquals($contact->id, $log->parent_contact_id);
    }

    public function test_parent_contact_hard_delete_restricted_by_foreign_key(): void
    {
        $contact = EmergencyContact::create([
            'name' => 'FK Restrict Test',
            'slug' => 'fk-restrict-test-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_by' => $this->adminUser->id,
            'updated_by' => $this->adminUser->id,
        ]);

        EmergencyDirectoryAuditLog::create([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contact->id,
            'parent_contact_id' => $contact->id,
            'actor_id' => $this->adminUser->id,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => ['name' => $contact->name],
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);

        $failed = false;
        try {
            DB::statement("SAVEPOINT sp_test_force_delete");
            // Force hard delete via SQL to test FK RESTRICT
            DB::statement("DELETE FROM emergency_contacts WHERE id = ?", [$contact->id]);
        } catch (\Throwable $e) {
            DB::statement("ROLLBACK TO SAVEPOINT sp_test_force_delete");
            $failed = true;
            $this->assertStringContainsString('foreign key constraint', strtolower($e->getMessage()));
        }

        $this->assertTrue($failed, 'Expected foreign key constraint violation on parent hard delete (ON DELETE RESTRICT).');
    }
}
