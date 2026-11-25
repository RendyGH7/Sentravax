<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('emergency_directory_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 50);
            $table->unsignedBigInteger('entity_id');
            $table->foreignId('parent_contact_id')
                ->constrained('emergency_contacts')
                ->onDelete('restrict');
            $table->foreignId('actor_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');
            $table->string('action', 60);
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            // Composite indexes for query patterns
            $table->index(['entity_type', 'entity_id', 'created_at'], 'idx_audit_entity_timeline');
            $table->index(['parent_contact_id', 'created_at'], 'idx_audit_parent_timeline');
            $table->index(['created_at', 'id'], 'idx_audit_chronological');
            $table->index(['actor_id', 'created_at'], 'idx_audit_actor_timeline');
        });

        // PostgreSQL CHECK constraints
        DB::statement("
            ALTER TABLE emergency_directory_audit_logs 
            ADD CONSTRAINT chk_audit_entity_type 
            CHECK (entity_type IN ('emergency_contact', 'emergency_contact_channel'))
        ");

        DB::statement("
            ALTER TABLE emergency_directory_audit_logs 
            ADD CONSTRAINT chk_audit_entity_id_positive 
            CHECK (entity_id > 0)
        ");

        // Database-Level Append-Only Protection (UPDATE, DELETE, and TRUNCATE blocked)
        DB::statement("
            CREATE OR REPLACE FUNCTION prevent_emergency_directory_audit_log_mutation()
            RETURNS TRIGGER AS \$\$
            BEGIN
                IF TG_OP = 'UPDATE' THEN
                    -- Allow foreign key ON DELETE SET NULL when user/actor is deleted
                    IF (OLD.actor_id IS NOT NULL AND NEW.actor_id IS NULL)
                       AND (OLD.id = NEW.id)
                       AND (OLD.entity_type = NEW.entity_type)
                       AND (OLD.entity_id = NEW.entity_id)
                       AND (OLD.parent_contact_id = NEW.parent_contact_id)
                       AND (OLD.action = NEW.action)
                       AND (OLD.old_values IS NOT DISTINCT FROM NEW.old_values)
                       AND (OLD.new_values IS NOT DISTINCT FROM NEW.new_values)
                       AND (OLD.ip_address IS NOT DISTINCT FROM NEW.ip_address)
                       AND (OLD.created_at = NEW.created_at) THEN
                        RETURN NEW;
                    END IF;
                END IF;

                RAISE EXCEPTION 'emergency_directory_audit_logs table is append-only: UPDATE, DELETE, and TRUNCATE are strictly prohibited.';
            END;
            \$\$ LANGUAGE plpgsql;
        ");

        DB::statement("
            CREATE TRIGGER trg_protect_audit_logs_mutation
            BEFORE UPDATE OR DELETE ON emergency_directory_audit_logs
            FOR EACH ROW EXECUTE FUNCTION prevent_emergency_directory_audit_log_mutation();
        ");

        DB::statement("
            CREATE TRIGGER trg_protect_audit_logs_truncate
            BEFORE TRUNCATE ON emergency_directory_audit_logs
            FOR EACH STATEMENT EXECUTE FUNCTION prevent_emergency_directory_audit_log_mutation();
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS trg_protect_audit_logs_truncate ON emergency_directory_audit_logs");
        DB::statement("DROP TRIGGER IF EXISTS trg_protect_audit_logs_mutation ON emergency_directory_audit_logs");
        DB::statement("DROP FUNCTION IF EXISTS prevent_emergency_directory_audit_log_mutation()");

        Schema::dropIfExists('emergency_directory_audit_logs');
    }
};
