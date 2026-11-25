<?php

namespace Tests\Feature;

use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\EmergencyDirectoryAuditLog;
use App\Models\User;
use App\Services\EmergencyDirectory\EmergencyDirectoryAuditService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EmergencyDirectoryAuditDurabilityTest extends TestCase
{
    protected static string $dbName = 'sentravax_test_durability';
    protected static bool $migrated = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (! static::$migrated) {
            // 1. Ensure any prior disposable test database is dropped, then create fresh
            DB::statement('DROP DATABASE IF EXISTS ' . static::$dbName . ' WITH (FORCE)');
            DB::statement('CREATE DATABASE ' . static::$dbName);

            // Enable PostGIS extension in the isolated test database
            $initPdo = new \PDO(
                'pgsql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '5432') . ';dbname=' . static::$dbName,
                env('DB_USERNAME', 'postgres'),
                env('DB_PASSWORD', 'admin123')
            );
            $initPdo->exec('CREATE EXTENSION IF NOT EXISTS postgis');
            unset($initPdo);

            // 2. Register dynamic isolated connection
            Config::set('database.connections.isolated_test_db', [
                'driver' => 'pgsql',
                'host' => env('DB_HOST', '127.0.0.1'),
                'port' => env('DB_PORT', '5432'),
                'database' => static::$dbName,
                'username' => env('DB_USERNAME', 'postgres'),
                'password' => env('DB_PASSWORD', 'admin123'),
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
                'sslmode' => 'prefer',
            ]);

            // 3. Migrate the isolated disposable database with full constraints and triggers
            Artisan::call('migrate', [
                '--database' => 'isolated_test_db',
                '--force' => true,
            ]);

            static::$migrated = true;
        } else {
            Config::set('database.connections.isolated_test_db', [
                'driver' => 'pgsql',
                'host' => env('DB_HOST', '127.0.0.1'),
                'port' => env('DB_PORT', '5432'),
                'database' => static::$dbName,
                'username' => env('DB_USERNAME', 'postgres'),
                'password' => env('DB_PASSWORD', 'admin123'),
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
                'sslmode' => 'prefer',
            ]);
        }
    }

    public function tearDown(): void
    {
        DB::purge('isolated_test_db');
        parent::tearDown();
    }

    public static function tearDownAfterClass(): void
    {
        if (static::$migrated) {
            try {
                $pdo = new \PDO(
                    'pgsql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '5432') . ';dbname=sentravax_db',
                    env('DB_USERNAME', 'postgres'),
                    env('DB_PASSWORD', 'admin123')
                );
                $pdo->exec('DROP DATABASE IF EXISTS ' . static::$dbName . ' WITH (FORCE)');
            } catch (\Throwable $e) {
                // Ignore cleanup errors
            }
            static::$migrated = false;
        }

        parent::tearDownAfterClass();
    }

    /**
     * Test proving actual outermost database commit durability across independent PostgreSQL sessions.
     */
    public function test_outermost_transaction_commit_persists_audit_log_across_independent_sessions(): void
    {
        $connName = 'isolated_test_db';

        // Session A: Create user, contact, channel, and audit logs within a real outermost transaction
        $connA = DB::connection($connName);

        $connA->beginTransaction();
        $this->assertEquals(1, $connA->transactionLevel(), 'Must be at outermost transaction level 1');

        // Create actor in isolated database
        $actorId = $connA->table('users')->insertGetId([
            'name' => 'Durability Admin',
            'email' => 'admin-durability-' . uniqid() . '@sentravax.go.id',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create parent contact
        $contactId = $connA->table('emergency_contacts')->insertGetId([
            'name' => 'Badan Penanggulangan Durability',
            'slug' => 'bpbd-durability-' . uniqid(),
            'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'verification_status' => EmergencyContact::STATUS_VERIFIED,
            'publication_status' => EmergencyContact::PUB_PUBLISHED,
            'created_by' => $actorId,
            'updated_by' => $actorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create channel
        $channelId = $connA->table('emergency_contact_channels')->insertGetId([
            'emergency_contact_id' => $contactId,
            'channel_type' => EmergencyContactChannel::TYPE_PHONE,
            'channel_classification' => EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
            'label' => 'Hotline Durability',
            'value' => '021-999111',
            'is_toll_free' => false,
            'is_primary' => true,
            'verification_status' => EmergencyContactChannel::STATUS_VERIFIED,
            'source_name' => 'Portal Durability',
            'source_url' => 'https://example.com/durability',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert audit log for contact
        $contactLogId = $connA->table('emergency_directory_audit_logs')->insertGetId([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contactId,
            'parent_contact_id' => $contactId,
            'actor_id' => $actorId,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => json_encode([
                'name' => 'Badan Penanggulangan Durability',
                'category' => EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                'scope' => EmergencyContact::SCOPE_NATIONAL,
                'verification_status' => EmergencyContact::STATUS_VERIFIED,
                'publication_status' => EmergencyContact::PUB_PUBLISHED,
            ]),
            'ip_address' => '10.20.30.40',
            'created_at' => now(),
        ]);

        // Insert audit log for channel
        $channelLogId = $connA->table('emergency_directory_audit_logs')->insertGetId([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            'entity_id' => $channelId,
            'parent_contact_id' => $contactId,
            'actor_id' => $actorId,
            'action' => EmergencyDirectoryAuditLog::ACTION_CHANNEL_CREATED,
            'old_values' => null,
            'new_values' => json_encode([
                'label' => 'Hotline Durability',
                'value' => '021-999111',
                'is_primary' => true,
                'is_active' => true,
            ]),
            'ip_address' => '10.20.30.40',
            'created_at' => now(),
        ]);

        // Step 3: Commit outermost transaction
        $connA->commit();
        $this->assertEquals(0, $connA->transactionLevel(), 'Transaction level must be 0 after outermost commit');

        // Step 4 & 5: Disconnect connection A and open completely fresh connection B
        DB::purge($connName);

        $connB = DB::connection($connName);

        // Step 6: Query and verify committed operational and audit records on connection B
        $persistedContact = $connB->table('emergency_contacts')->where('id', $contactId)->first();
        $this->assertNotNull($persistedContact, 'Committed contact must exist in fresh PostgreSQL session');
        $this->assertEquals('Badan Penanggulangan Durability', $persistedContact->name);

        $persistedChannel = $connB->table('emergency_contact_channels')->where('id', $channelId)->first();
        $this->assertNotNull($persistedChannel, 'Committed channel must exist in fresh PostgreSQL session');
        $this->assertEquals('Hotline Durability', $persistedChannel->label);

        // Query contact audit log
        $persistedContactLog = $connB->table('emergency_directory_audit_logs')->where('id', $contactLogId)->first();
        $this->assertNotNull($persistedContactLog, 'Committed contact audit log must exist in fresh PostgreSQL session');
        $this->assertEquals(EmergencyDirectoryAuditLog::ENTITY_CONTACT, $persistedContactLog->entity_type);
        $this->assertEquals($contactId, $persistedContactLog->parent_contact_id);
        $this->assertEquals($actorId, $persistedContactLog->actor_id);
        $this->assertEquals('10.20.30.40', $persistedContactLog->ip_address);

        $newValuesContact = json_decode($persistedContactLog->new_values, true);
        $this->assertEquals('Badan Penanggulangan Durability', $newValuesContact['name']);

        // Query channel audit log
        $persistedChannelLog = $connB->table('emergency_directory_audit_logs')->where('id', $channelLogId)->first();
        $this->assertNotNull($persistedChannelLog, 'Committed channel audit log must exist in fresh PostgreSQL session');
        $this->assertEquals(EmergencyDirectoryAuditLog::ENTITY_CHANNEL, $persistedChannelLog->entity_type);
        $this->assertEquals($contactId, $persistedChannelLog->parent_contact_id);

        $newValuesChannel = json_decode($persistedChannelLog->new_values, true);
        $this->assertEquals('Hotline Durability', $newValuesChannel['label']);
        $this->assertTrue($newValuesChannel['is_primary']);

        // Step 7: Verify parent relationship via SQL join across tables
        $joinQuery = $connB->table('emergency_directory_audit_logs as a')
            ->join('emergency_contacts as c', 'a.parent_contact_id', '=', 'c.id')
            ->where('a.parent_contact_id', $contactId)
            ->select('a.id', 'a.action', 'c.name as contact_name')
            ->get();

        $this->assertCount(2, $joinQuery, 'Both audit logs must link to parent contact via FK');
        $this->assertEquals('Badan Penanggulangan Durability', $joinQuery[0]->contact_name);

        // Step 8: Verify safe cleanup of isolated database records
        // Attempting to hard-delete parent contact must fail due to ON DELETE RESTRICT on audit table
        $restrictFailed = false;
        try {
            $connB->statement('DELETE FROM emergency_contacts WHERE id = ?', [$contactId]);
        } catch (\Throwable $e) {
            $restrictFailed = true;
            $this->assertStringContainsString('foreign key constraint', strtolower($e->getMessage()));
        }
        $this->assertTrue($restrictFailed, 'FK RESTRICT must prevent deleting parent contact when audit logs exist');
    }

    /**
     * Test proving outermost transaction rollback leaves 0 records in PostgreSQL.
     */
    public function test_outermost_transaction_rollback_ensures_zero_partial_records_across_sessions(): void
    {
        $connName = 'isolated_test_db';

        $connA = DB::connection($connName);
        $connA->beginTransaction();

        $uniqueSlug = 'rollback-test-' . uniqid();

        $contactId = $connA->table('emergency_contacts')->insertGetId([
            'name' => 'Will Rollback Contact',
            'slug' => $uniqueSlug,
            'category' => EmergencyContact::CATEGORY_SAR,
            'scope' => EmergencyContact::SCOPE_NATIONAL,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $connA->table('emergency_directory_audit_logs')->insert([
            'entity_type' => EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            'entity_id' => $contactId,
            'parent_contact_id' => $contactId,
            'action' => EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            'old_values' => null,
            'new_values' => json_encode(['slug' => $uniqueSlug]),
            'created_at' => now(),
        ]);

        // Roll back outermost transaction
        $connA->rollBack();

        DB::purge($connName);

        // Fresh session B verifies zero rows exist in PostgreSQL
        $connB = DB::connection($connName);
        $contactCount = $connB->table('emergency_contacts')->where('slug', $uniqueSlug)->count();
        $this->assertEquals(0, $contactCount, 'Rolled back contact must not exist in database');

        $auditCount = $connB->table('emergency_directory_audit_logs')->where('entity_id', $contactId)->count();
        $this->assertEquals(0, $auditCount, 'Rolled back audit record must not exist in database');
    }
}
