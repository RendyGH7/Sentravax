<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Additive schema expansion for SENTRAVAX In-App Notification Domain:
     * - Enhanced attributes on user_notifications (fingerprint, urgency, related entity)
     * - Notification delivery and audit logs (notification_delivery_logs)
     * - User-level notification category and urgency preferences (user_notification_preferences)
     */
    public function up(): void
    {
        // 1. Enhance user_notifications table
        Schema::table('user_notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('user_notifications', 'category')) {
                $table->string('category', 50)->default('system')->after('type');
                $table->index('category');
            }
            if (!Schema::hasColumn('user_notifications', 'urgency')) {
                $table->string('urgency', 20)->default('info')->after('category');
                $table->index('urgency');
            }
            if (!Schema::hasColumn('user_notifications', 'related_type')) {
                $table->string('related_type', 50)->nullable()->after('urgency');
            }
            if (!Schema::hasColumn('user_notifications', 'related_id')) {
                $table->unsignedBigInteger('related_id')->nullable()->after('related_type');
                $table->index(['related_type', 'related_id']);
            }
            if (!Schema::hasColumn('user_notifications', 'event_fingerprint')) {
                $table->string('event_fingerprint', 64)->nullable()->after('related_id');
            }
            if (!Schema::hasColumn('user_notifications', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('read_at');
                $table->index('expires_at');
            }
        });

        // Add unique constraint for deduplication race-condition safety
        // In PostgreSQL: Unique index on user_id and event_fingerprint when not null
        \DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_user_fingerprint_unique 
            ON user_notifications (user_id, event_fingerprint) 
            WHERE event_fingerprint IS NOT NULL
        ");

        // 2. Create notification_delivery_logs table
        if (!Schema::hasTable('notification_delivery_logs')) {
            Schema::create('notification_delivery_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('notification_id')->nullable()->constrained('user_notifications')->nullOnDelete();
                $table->string('channel', 30)->default('in_app'); // in_app
                $table->string('status', 30); // delivered, deduplicated, preference_filtered, failed
                $table->string('category', 50)->nullable();
                $table->string('urgency', 20)->nullable();
                $table->string('event_fingerprint', 64)->nullable();
                $table->text('reason')->nullable();
                $table->jsonb('metadata')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'status']);
                $table->index(['event_fingerprint']);
                $table->index(['created_at']);
            });
        }

        // 3. Create user_notification_preferences table
        if (!Schema::hasTable('user_notification_preferences')) {
            Schema::create('user_notification_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->boolean('enable_ai_insights')->default(true);
                $table->boolean('enable_official_warnings')->default(true);
                $table->boolean('enable_report_status')->default(true);
                $table->boolean('enable_disaster_alerts')->default(true);
                $table->boolean('enable_system')->default(true);
                $table->string('min_urgency', 20)->default('info'); // info, advisory, watch, warning
                $table->boolean('in_app_enabled')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
        Schema::dropIfExists('notification_delivery_logs');

        \DB::statement("DROP INDEX IF EXISTS user_notifications_user_fingerprint_unique");

        Schema::table('user_notifications', function (Blueprint $table) {
            $cols = ['category', 'urgency', 'related_type', 'related_id', 'event_fingerprint', 'expires_at'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('user_notifications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
