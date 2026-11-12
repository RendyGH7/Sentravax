<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Additive schema expansion for Community-First Preparedness, Family Plans,
     * Simulation Scenarios, Sync Logs, and Verification Audit.
     */
    public function up(): void
    {
        // 1. User Saved / Monitored Regions
        if (!Schema::hasTable('user_saved_regions')) {
            Schema::create('user_saved_regions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('region_id')->constrained('regions')->cascadeOnDelete();
                $table->string('label')->default('Rumah'); // Rumah, Kantor, Tempat Keluarga
                $table->boolean('is_primary')->default(false);
                $table->boolean('notify_alerts')->default(true);
                $table->timestamps();

                $table->unique(['user_id', 'region_id']);
                $table->index(['user_id', 'is_primary']);
            });
        }

        // 2. User Family Preparedness Plans
        if (!Schema::hasTable('preparedness_plans')) {
            Schema::create('preparedness_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('title')->default('Rencana Siaga Keluarga');
                $table->string('primary_meeting_point')->nullable(); // Titik kumpul utama (misal: Balai RW 05)
                $table->string('secondary_meeting_point')->nullable(); // Titik kumpul alternatif
                $table->text('evacuation_notes')->nullable(); // Catatan khusus (anggota keluarga lansia, obat)
                $table->jsonb('custom_provisions')->nullable(); // Catatan perlengkapan tambahan
                $table->timestamps();

                $table->unique('user_id');
            });
        }

        // 3. Preparedness Emergency Contacts
        if (!Schema::hasTable('preparedness_contacts')) {
            Schema::create('preparedness_contacts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('name');
                $table->string('relationship'); // Orang Tua, Pasangan, Tetangga, RT/RW, Puskesmas
                $table->string('phone_number');
                $table->boolean('is_emergency_priority')->default(true);
                $table->timestamps();

                $table->index(['user_id', 'is_emergency_priority']);
            });
        }

        // 4. Preparedness Checklist Master Items
        if (!Schema::hasTable('preparedness_checklist_items')) {
            Schema::create('preparedness_checklist_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('hazard_type_id')->nullable()->constrained('hazard_types')->nullOnDelete();
                $table->string('category'); // dokumen, medis, logistik, peralatan, proteksi
                $table->string('name'); // e.g. "Dokumen Identitas & Polis Asuransi Kedap Air"
                $table->text('description')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_essential')->default(true);
                $table->timestamps();

                $table->index(['category', 'hazard_type_id']);
            });
        }

        // 5. User Preparedness Checklist Progress
        if (!Schema::hasTable('preparedness_checklist_progress')) {
            Schema::create('preparedness_checklist_progress', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('checklist_item_id')->constrained('preparedness_checklist_items')->cascadeOnDelete();
                $table->boolean('is_completed')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'checklist_item_id']);
                $table->index(['user_id', 'is_completed']);
            });
        }

        // 6. Interactive Preparedness Scenarios & Simulations
        if (!Schema::hasTable('emergency_scenarios')) {
            Schema::create('emergency_scenarios', function (Blueprint $table) {
                $table->id();
                $table->foreignId('hazard_type_id')->nullable()->constrained('hazard_types')->nullOnDelete();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('difficulty')->default('pemula'); // pemula, menengah, lanjutan
                $table->text('description');
                $table->text('context_brief'); // Skenario narasi awal
                $table->integer('estimated_minutes')->default(5);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 7. Scenario Questions & Action Choices
        if (!Schema::hasTable('scenario_questions')) {
            Schema::create('scenario_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('scenario_id')->constrained('emergency_scenarios')->cascadeOnDelete();
                $table->text('question');
                $table->jsonb('options'); // [{ "id": "A", "text": "...", "is_correct": true, "explanation": "..." }]
                $table->integer('points')->default(10);
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['scenario_id', 'sort_order']);
            });
        }

        // 8. Scenario Completion Attempts
        if (!Schema::hasTable('scenario_attempts')) {
            Schema::create('scenario_attempts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('scenario_id')->constrained('emergency_scenarios')->cascadeOnDelete();
                $table->integer('score')->default(0);
                $table->integer('total_possible_score')->default(0);
                $table->boolean('passed')->default(false);
                $table->jsonb('answers_summary')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'scenario_id']);
            });
        }

        // 9. Data Source Sync Runs (Ingestion Provenance & Health Logs)
        if (!Schema::hasTable('data_source_sync_runs')) {
            Schema::create('data_source_sync_runs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('data_source_id')->constrained('data_sources')->cascadeOnDelete();
                $table->string('status'); // SUCCESS, FAILED, TIMEOUT, PARTIAL
                $table->string('freshness_state'); // LIVE, SIMULATED, STATIC, STALE, UNAVAILABLE
                $table->integer('items_fetched')->default(0);
                $table->integer('items_persisted')->default(0);
                $table->integer('duration_ms')->default(0);
                $table->text('error_message')->nullable();
                $table->jsonb('provenance_metadata')->nullable();
                $table->timestamp('synced_at')->useCurrent();
                $table->timestamps();

                $table->index(['data_source_id', 'status', 'synced_at']);
            });
        }

        // 10. Community Report Verification Audit History
        if (!Schema::hasTable('report_verifications')) {
            Schema::create('report_verifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('community_report_id')->constrained('community_reports')->cascadeOnDelete();
                $table->foreignId('verified_by')->constrained('users')->cascadeOnDelete();
                $table->string('previous_status');
                $table->string('new_status'); // verified, rejected, investigation
                $table->text('notes')->nullable();
                $table->jsonb('evidence_links')->nullable();
                $table->timestamps();

                $table->index(['community_report_id', 'created_at']);
            });
        }

        // 11. User Hazard Notification Preferences
        if (!Schema::hasTable('user_hazard_preferences')) {
            Schema::create('user_hazard_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('hazard_type_id')->constrained('hazard_types')->cascadeOnDelete();
                $table->string('min_severity')->default('advisory'); // advisory, watch, warning
                $table->boolean('in_app_notify')->default(true);
                $table->timestamps();

                $table->unique(['user_id', 'hazard_type_id']);
            });
        }

        // 12. Enhance community_reports with photo attachment and duplicate clustering
        Schema::table('community_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('community_reports', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('description');
            }
            if (!Schema::hasColumn('community_reports', 'cluster_id')) {
                $table->string('cluster_id')->nullable()->after('status');
                $table->index('cluster_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('community_reports', function (Blueprint $table) {
            if (Schema::hasColumn('community_reports', 'cluster_id')) {
                $table->dropIndex(['cluster_id']);
                $table->dropColumn('cluster_id');
            }
            if (Schema::hasColumn('community_reports', 'photo_path')) {
                $table->dropColumn('photo_path');
            }
        });

        Schema::dropIfExists('user_hazard_preferences');
        Schema::dropIfExists('report_verifications');
        Schema::dropIfExists('data_source_sync_runs');
        Schema::dropIfExists('scenario_attempts');
        Schema::dropIfExists('scenario_questions');
        Schema::dropIfExists('emergency_scenarios');
        Schema::dropIfExists('preparedness_checklist_progress');
        Schema::dropIfExists('preparedness_checklist_items');
        Schema::dropIfExists('preparedness_contacts');
        Schema::dropIfExists('preparedness_plans');
        Schema::dropIfExists('user_saved_regions');
    }
};

