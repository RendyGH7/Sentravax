<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Table: emergency_contacts (Parent entity)
        Schema::create('emergency_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->string('category', 50); // disaster_management, sar, police, medical, fire, red_cross, other
            $table->string('scope', 20); // national, provincial, regency
            $table->foreignId('region_id')
                ->nullable()
                ->constrained('regions')
                ->onDelete('restrict');
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('description')->nullable();
            $table->string('verification_status', 30)->default('unverified'); // verified, unverified, source_unavailable, rejected
            $table->string('publication_status', 30)->default('draft'); // draft, published, archived
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('scope');
            $table->index('verification_status');
            $table->index('publication_status');
        });

        // PostgreSQL CHECK Constraints for emergency_contacts
        DB::statement("
            ALTER TABLE emergency_contacts 
            ADD CONSTRAINT chk_emergency_contacts_scope 
            CHECK (scope IN ('national', 'provincial', 'regency'))
        ");

        DB::statement("
            ALTER TABLE emergency_contacts 
            ADD CONSTRAINT chk_emergency_contacts_verification_status 
            CHECK (verification_status IN ('verified', 'unverified', 'source_unavailable', 'rejected'))
        ");

        DB::statement("
            ALTER TABLE emergency_contacts 
            ADD CONSTRAINT chk_emergency_contacts_publication_status 
            CHECK (publication_status IN ('draft', 'published', 'archived'))
        ");

        // PostgreSQL Scope & Region Trigger Validation
        DB::statement("
            CREATE OR REPLACE FUNCTION check_emergency_contact_scope_region()
            RETURNS TRIGGER AS \$\$
            DECLARE
                target_level VARCHAR(30);
            BEGIN
                IF NEW.scope = 'national' THEN
                    IF NEW.region_id IS NOT NULL THEN
                        RAISE EXCEPTION 'National scope emergency contact must have null region_id';
                    END IF;
                ELSIF NEW.scope = 'provincial' THEN
                    IF NEW.region_id IS NULL THEN
                        RAISE EXCEPTION 'Provincial scope emergency contact must reference a region';
                    END IF;
                    SELECT level INTO target_level FROM regions WHERE id = NEW.region_id;
                    IF target_level IS NULL OR target_level != 'province' THEN
                        RAISE EXCEPTION 'Provincial scope emergency contact must reference a region with level province, found: %', COALESCE(target_level, 'NULL');
                    END IF;
                ELSIF NEW.scope = 'regency' THEN
                    IF NEW.region_id IS NULL THEN
                        RAISE EXCEPTION 'Regency scope emergency contact must reference a region';
                    END IF;
                    SELECT level INTO target_level FROM regions WHERE id = NEW.region_id;
                    IF target_level IS NULL OR target_level != 'regency' THEN
                        RAISE EXCEPTION 'Regency scope emergency contact must reference a region with level regency, found: %', COALESCE(target_level, 'NULL');
                    END IF;
                END IF;
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql;
        ");

        DB::statement("
            CREATE TRIGGER trg_check_emergency_contact_scope_region
            BEFORE INSERT OR UPDATE ON emergency_contacts
            FOR EACH ROW EXECUTE FUNCTION check_emergency_contact_scope_region()
        ");

        // 2. Table: emergency_contact_channels (Child entity)
        Schema::create('emergency_contact_channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_contact_id')
                ->constrained('emergency_contacts')
                ->onDelete('restrict');
            $table->string('channel_type', 30); // shortcode, phone, whatsapp, email, website
            $table->string('channel_classification', 40); // emergency_hotline, operational_contact, office_contact, informational_contact
            $table->string('label', 150);
            $table->string('value', 255);
            $table->boolean('is_toll_free')->default(false);
            $table->boolean('is_primary')->default(false);
            $table->string('operating_hours', 150)->nullable();
            $table->string('verification_status', 30)->default('unverified'); // verified, unverified, source_unavailable, rejected
            $table->string('source_name', 150);
            $table->string('source_url', 500);
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('channel_type');
            $table->index('channel_classification');
            $table->index('verification_status');
            $table->index('is_active');
            $table->index(['emergency_contact_id', 'is_active']);
        });

        // PostgreSQL CHECK Constraints for emergency_contact_channels
        DB::statement("
            ALTER TABLE emergency_contact_channels 
            ADD CONSTRAINT chk_channels_channel_type 
            CHECK (channel_type IN ('shortcode', 'phone', 'whatsapp', 'email', 'website'))
        ");

        DB::statement("
            ALTER TABLE emergency_contact_channels 
            ADD CONSTRAINT chk_channels_classification 
            CHECK (channel_classification IN ('emergency_hotline', 'operational_contact', 'office_contact', 'informational_contact'))
        ");

        DB::statement("
            ALTER TABLE emergency_contact_channels 
            ADD CONSTRAINT chk_channels_verification_status 
            CHECK (verification_status IN ('verified', 'unverified', 'source_unavailable', 'rejected'))
        ");

        // PostgreSQL Partial Unique Index: at most one primary active channel per contact
        DB::statement("
            CREATE UNIQUE INDEX unique_primary_active_channel_per_contact 
            ON emergency_contact_channels (emergency_contact_id) 
            WHERE is_primary = true AND is_active = true
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS unique_primary_active_channel_per_contact");
        Schema::dropIfExists('emergency_contact_channels');

        DB::statement("DROP TRIGGER IF EXISTS trg_check_emergency_contact_scope_region ON emergency_contacts");
        DB::statement("DROP FUNCTION IF EXISTS check_emergency_contact_scope_region()");
        Schema::dropIfExists('emergency_contacts');
    }
};
