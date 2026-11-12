<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Additive enhancements for Risk Assessments & AI Insights to support
     * both regional baseline assessments (for Siaga Personal Location Checker)
     * and event-driven disaster assessments.
     */
    public function up(): void
    {
        Schema::table('risk_assessments', function (Blueprint $table) {
            $table->foreignId('hazard_event_id')->nullable()->change();

            if (!Schema::hasColumn('risk_assessments', 'region_id')) {
                $table->foreignId('region_id')->nullable()->after('hazard_event_id')->constrained('regions')->nullOnDelete();
            }
            if (!Schema::hasColumn('risk_assessments', 'hazard_type_id')) {
                $table->foreignId('hazard_type_id')->nullable()->after('region_id')->constrained('hazard_types')->nullOnDelete();
            }
            if (!Schema::hasColumn('risk_assessments', 'title')) {
                $table->string('title')->nullable()->after('hazard_type_id');
            }

            $table->index(['region_id', 'hazard_type_id']);
        });

        Schema::table('ai_insights', function (Blueprint $table) {
            $table->foreignId('risk_assessment_id')->nullable()->change();

            if (!Schema::hasColumn('ai_insights', 'title')) {
                $table->string('title')->nullable()->after('risk_assessment_id');
            }
            if (!Schema::hasColumn('ai_insights', 'region_id')) {
                $table->foreignId('region_id')->nullable()->after('title')->constrained('regions')->nullOnDelete();
            }
            if (!Schema::hasColumn('ai_insights', 'hazard_type_id')) {
                $table->foreignId('hazard_type_id')->nullable()->after('region_id')->constrained('hazard_types')->nullOnDelete();
            }

            $table->index(['region_id', 'hazard_type_id']);
        });

        Schema::table('alerts', function (Blueprint $table) {
            if (!Schema::hasColumn('alerts', 'region_id')) {
                $table->foreignId('region_id')->nullable()->after('hazard_event_id')->constrained('regions')->nullOnDelete();
            }
            if (!Schema::hasColumn('alerts', 'hazard_type_id')) {
                $table->foreignId('hazard_type_id')->nullable()->after('region_id')->constrained('hazard_types')->nullOnDelete();
            }

            $table->index(['region_id', 'hazard_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            if (Schema::hasColumn('alerts', 'hazard_type_id')) {
                $table->dropForeign(['hazard_type_id']);
                $table->dropColumn('hazard_type_id');
            }
            if (Schema::hasColumn('alerts', 'region_id')) {
                $table->dropForeign(['region_id']);
                $table->dropColumn('region_id');
            }
        });

        Schema::table('ai_insights', function (Blueprint $table) {
            if (Schema::hasColumn('ai_insights', 'hazard_type_id')) {
                $table->dropForeign(['hazard_type_id']);
                $table->dropColumn('hazard_type_id');
            }
            if (Schema::hasColumn('ai_insights', 'region_id')) {
                $table->dropForeign(['region_id']);
                $table->dropColumn('region_id');
            }
            if (Schema::hasColumn('ai_insights', 'title')) {
                $table->dropColumn('title');
            }
        });

        Schema::table('risk_assessments', function (Blueprint $table) {
            if (Schema::hasColumn('risk_assessments', 'title')) {
                $table->dropColumn('title');
            }
            if (Schema::hasColumn('risk_assessments', 'hazard_type_id')) {
                $table->dropForeign(['hazard_type_id']);
                $table->dropColumn('hazard_type_id');
            }
            if (Schema::hasColumn('risk_assessments', 'region_id')) {
                $table->dropForeign(['region_id']);
                $table->dropColumn('region_id');
            }
        });
    }
};

