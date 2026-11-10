
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('region_id')
                ->nullable()
                ->constrained('regions')
                ->nullOnDelete();

            $table->foreignId('hazard_type_id')
                ->constrained('hazard_types')
                ->restrictOnDelete();

            $table->foreignId('data_source_id')
                ->constrained('data_sources')
                ->restrictOnDelete();

            $table->string('external_id', 150)->nullable();

            $table->string('title');

            $table->text('description')->nullable();

            $table->string('severity', 30)->default('low');

            $table->string('status', 30)->default('active');

            $table->timestamp('occurred_at');

            $table->timestamp('reported_at')->nullable();

            $table->jsonb('source_metadata')->nullable();

            $table->timestamps();

            $table->index('severity');
            $table->index('status');
            $table->index('occurred_at');

            $table->index(
                ['data_source_id', 'external_id'],
                'hazard_events_source_external_idx'
            );
        });

        DB::statement("
            ALTER TABLE hazard_events
            ADD COLUMN location geometry(Point, 4326)
        ");

        DB::statement("
            CREATE INDEX hazard_events_location_gist_idx
            ON hazard_events USING GIST (location)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_events');
    }
};
