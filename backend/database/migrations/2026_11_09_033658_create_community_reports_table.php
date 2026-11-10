
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('hazard_type_id')
                ->constrained('hazard_types')
                ->restrictOnDelete();

            $table->foreignId('region_id')
                ->nullable()
                ->constrained('regions')
                ->nullOnDelete();

            $table->string('title');

            $table->text('description');

            $table->jsonb('media')->nullable();

            $table->string('status', 30)->default('pending');

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('verified_at')->nullable();

            $table->text('moderation_notes')->nullable();

            $table->timestamps();

            $table->index('status');
        });

        DB::statement("
            ALTER TABLE community_reports
            ADD COLUMN location geometry(Point, 4326)
        ");

        DB::statement("
            CREATE INDEX community_reports_location_gist_idx
            ON community_reports USING GIST (location)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('community_reports');
    }
};
