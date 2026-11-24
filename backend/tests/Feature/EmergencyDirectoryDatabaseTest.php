<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\Region;
use App\Models\Shelter;
use App\Models\User;
use Database\Seeders\EmergencyDirectorySeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use Tests\TestCase;

class EmergencyDirectoryDatabaseTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure seeder has run for baseline check
        $this->seed(EmergencyDirectorySeeder::class);
    }

    /**
     * Test 1: Migration berhasil pada PostgreSQL and all columns exist.
     */
    public function test_migration_succeeded_on_postgresql_and_tables_exist(): void
    {
        $this->assertTrue(Schema::hasTable('emergency_contacts'));
        $this->assertTrue(Schema::hasTable('emergency_contact_channels'));

        $this->assertTrue(Schema::hasColumns('emergency_contacts', [
            'id', 'name', 'slug', 'category', 'scope', 'region_id', 'address',
            'latitude', 'longitude', 'description', 'verification_status',
            'publication_status', 'created_by', 'updated_by', 'created_at',
            'updated_at', 'deleted_at'
        ]));

        $this->assertTrue(Schema::hasColumns('emergency_contact_channels', [
            'id', 'emergency_contact_id', 'channel_type', 'channel_classification',
            'label', 'value', 'is_toll_free', 'is_primary', 'operating_hours',
            'verification_status', 'source_name', 'source_url', 'verified_at',
            'verification_notes', 'sort_order', 'is_active', 'created_at', 'updated_at'
        ]));
    }

    /**
     * Test 2: Parent-child relationship functions bidirectionally.
     */
    public function test_parent_child_relationship(): void
    {
        $contact = EmergencyContact::where('slug', 'basarnas-pusat')->first();
        $this->assertNotNull($contact);
        $this->assertGreaterThanOrEqual(1, $contact->channels->count());

        $channel = $contact->channels->first();
        $this->assertNotNull($channel->contact);
        $this->assertEquals($contact->id, $channel->contact->id);
    }

    /**
     * Test 3: National scope requires region_id = NULL.
     */
    public function test_national_scope_requires_region_id_null(): void
    {
        $dki = Region::where('level', 'province')->first();
        $this->assertNotNull($dki);

        $this->expectException(InvalidArgumentException::class);

        EmergencyContact::create([
            'name' => 'Badan Pengawas Ilegal',
            'slug' => 'badan-pengawas-ilegal-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_OTHER,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'region_id' => $dki->id, // VIOLATION: national cannot have region_id
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
        ]);
    }

    /**
     * Test 4: Provincial scope rejects non-province regions (e.g. regencies).
     */
    public function test_provincial_scope_rejects_non_province_region(): void
    {
        $regency = Region::where('level', 'regency')->first();
        $this->assertNotNull($regency);

        $this->expectException(InvalidArgumentException::class);

        EmergencyContact::create([
            'name' => 'BPBD Jawa Barat Fiktif',
            'slug' => 'bpbd-jabar-fiktif-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
            'scope' => EmergencyContact::SCOPE_PROVINCIAL,
            'region_id' => $regency->id, // VIOLATION: regency region used for provincial scope
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
        ]);
    }

    /**
     * Test 5: Regency scope rejects non-regency regions (e.g. province).
     */
    public function test_regency_scope_rejects_non_regency_region(): void
    {
        $province = Region::where('level', 'province')->first();
        $this->assertNotNull($province);

        $this->expectException(InvalidArgumentException::class);

        EmergencyContact::create([
            'name' => 'Posko Damkar Kota Fiktif',
            'slug' => 'posko-damkar-kota-fiktif-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_FIRE,
            'scope' => EmergencyContact::SCOPE_REGENCY,
            'region_id' => $province->id, // VIOLATION: province used for regency scope
            'verification_status' => EmergencyContact::STATUS_UNVERIFIED,
            'publication_status' => EmergencyContact::PUB_DRAFT,
        ]);
    }

    /**
     * Test 6: Satu parent tidak dapat memiliki dua primary active channels (Partial Unique Index).
     */
    public function test_single_parent_cannot_have_two_primary_active_channels(): void
    {
        $contact = EmergencyContact::where('slug', 'polri-pusat')->first();
        $this->assertNotNull($contact);

        // polri-pusat already has one primary active channel (110)
        $this->expectException(QueryException::class);

        // Attempt to insert second primary active channel for the same parent
        EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
            'label' => 'Hotline Cadangan Polri',
            'value' => '110-2',
            'is_toll_free' => true,
            'is_primary' => true, // VIOLATION: second active primary
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'source_name' => 'Test',
            'source_url' => 'https://polri.go.id',
            'is_active' => true,
        ]);
    }

    /**
     * Test 7: Kanal inactive tidak melanggar partial unique index meskipun is_primary = true.
     */
    public function test_inactive_primary_channels_do_not_violate_partial_unique_index(): void
    {
        $contact = EmergencyContact::where('slug', 'polri-pusat')->first();
        $this->assertNotNull($contact);

        // Creating an inactive channel with is_primary = true should succeed because of the index predicate
        $inactivePrimary = EmergencyContactChannel::create([
            'emergency_contact_id' => $contact->id,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Hotline Lama Polri (Nonaktif)',
            'value' => '021-9999999',
            'is_toll_free' => false,
            'is_primary' => true,
            'verification_status' => EmergencyContactChannel::STATUS_UNVERIFIED,
            'source_name' => 'Arsip Sejarah',
            'source_url' => 'https://polri.go.id',
            'is_active' => false, // Inactive -> excluded from unique index predicate
        ]);

        $this->assertDatabaseHas('emergency_contact_channels', [
            'id' => $inactivePrimary->id,
            'is_primary' => true,
            'is_active' => false,
        ]);
    }

    /**
     * Test 8: Parent tidak dapat di-hard-delete ketika memiliki child (ON DELETE RESTRICT).
     */
    public function test_parent_cannot_be_hard_deleted_when_it_has_children_due_to_restrict(): void
    {
        $contact = EmergencyContact::where('slug', 'kemenkes-ncc-119')->first();
        $this->assertNotNull($contact);
        $this->assertGreaterThan(0, $contact->channels()->count());

        $this->expectException(QueryException::class);

        // Attempt raw hard delete on parent
        DB::table('emergency_contacts')->where('id', $contact->id)->delete();
    }

    /**
     * Test 9: Soft delete parent tidak menghapus kanal child.
     */
    public function test_soft_delete_parent_does_not_delete_or_orphan_channels(): void
    {
        $contact = EmergencyContact::where('slug', 'kemenkes-ncc-119')->first();
        $this->assertNotNull($contact);

        $channelId = $contact->channels->first()->id;

        // Perform soft delete
        $contact->delete();

        // Contact is soft deleted
        $this->assertSoftDeleted('emergency_contacts', ['id' => $contact->id]);

        // Child channel still exists and references parent id
        $this->assertDatabaseHas('emergency_contact_channels', [
            'id' => $channelId,
            'emergency_contact_id' => $contact->id,
        ]);
    }

    /**
     * Test 10: Seed menghasilkan jumlah sesuai manifest aktual (7 parent, 11 child).
     */
    public function test_seed_yields_exact_manifest_counts_seven_parents_eleven_channels(): void
    {
        $parentCount = EmergencyContact::count();
        $channelCount = EmergencyContactChannel::count();

        $this->assertEquals(7, $parentCount, 'Emergency contacts parent count must be exactly 7.');
        $this->assertEquals(11, $channelCount, 'Emergency contact channels count must be exactly 11.');
    }

    /**
     * Test 11: Seeder bersifat idempotent.
     */
    public function test_seeder_is_idempotent(): void
    {
        $initialParentCount = EmergencyContact::count();
        $initialChannelCount = EmergencyContactChannel::count();

        // Run seeder second time
        $this->seed(EmergencyDirectorySeeder::class);

        $this->assertEquals($initialParentCount, EmergencyContact::count());
        $this->assertEquals($initialChannelCount, EmergencyContactChannel::count());
    }

    /**
     * Test 12: Seeder tidak mengubah record yang sudah dimodifikasi oleh admin.
     */
    public function test_seeder_does_not_mutate_existing_admin_edited_records(): void
    {
        $contact = EmergencyContact::where('slug', 'basarnas-pusat')->first();
        $this->assertNotNull($contact);

        $customDescription = 'Deskripsi custom diedit oleh superadmin di lapangan.';
        $contact->update(['description' => $customDescription]);

        // Run seeder again
        $this->seed(EmergencyDirectorySeeder::class);

        $refreshed = EmergencyContact::where('slug', 'basarnas-pusat')->first();
        $this->assertEquals($customDescription, $refreshed->description);
    }

    /**
     * Test 13: Damkar 113 tetap draft dan unverified.
     */
    public function test_damkar_113_remains_draft_and_unverified(): void
    {
        $damkar = EmergencyContact::where('slug', 'damkar-nasional')->first();
        $this->assertNotNull($damkar);
        $this->assertEquals(EmergencyContact::PUB_DRAFT, $damkar->publication_status);
        $this->assertEquals(EmergencyContact::STATUS_UNVERIFIED, $damkar->verification_status);

        $channel113 = $damkar->channels()->where('value', '113')->first();
        $this->assertNotNull($channel113);
        $this->assertEquals(EmergencyContactChannel::STATUS_UNVERIFIED, $channel113->verification_status);
        $this->assertNull($channel113->verified_at);
    }

    /**
     * Test 14: PMI tidak diklasifikasikan sebagai emergency hotline melainkan informational.
     */
    public function test_pmi_is_classified_as_informational_contact_not_emergency_hotline(): void
    {
        $pmi = EmergencyContact::where('slug', 'pmi-dki-jakarta')->first();
        $this->assertNotNull($pmi);

        $channel = $pmi->channels()->first();
        $this->assertNotNull($channel);
        $this->assertEquals(EmergencyContactChannel::CLASS_INFORMATIONAL_CONTACT, $channel->channel_classification);
        $this->assertNotEquals(EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE, $channel->channel_classification);
    }

    /**
     * Test 15: Kanal tanpa sumber primer resmi yang valid gagal-tertutup (fail-closed) ke unverified.
     */
    public function test_channels_without_verified_sources_fail_closed_to_unverified(): void
    {
        $unverifiedChannel = EmergencyContactChannel::where('verification_status', EmergencyContactChannel::STATUS_UNVERIFIED)->first();
        $this->assertNotNull($unverifiedChannel);
        $this->assertNull($unverifiedChannel->verified_at);
    }

    /**
     * Test 16: Baseline database counts remain strictly unaltered.
     */
    public function test_baseline_database_counts_remain_intact(): void
    {
        $this->assertEquals(32, User::count(), 'Users baseline count altered!');
        $this->assertEquals(5, Shelter::count(), 'Shelters baseline count altered!');
        $this->assertEquals(5, CommunityReport::count(), 'Reports baseline count altered!');
        $this->assertEquals(6, DataSource::count(), 'DataSources baseline count altered!');
        $this->assertEquals(1, AiInsight::count(), 'AiInsights baseline count altered!');
    }
}
