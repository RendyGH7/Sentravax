
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_assessments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hazard_event_id')
                ->constrained('hazard_events')
                ->cascadeOnDelete();

            $table->decimal('risk_score', 5, 2);

            $table->string('risk_level', 30);

            $table->string('methodology_version', 50)->nullable();

            $table->unsignedInteger('impact_radius_meters')
                ->default(1000);

            $table->unsignedBigInteger(
                'affected_population_estimate'
            )->nullable();

            $table->jsonb('calculation_factors')->nullable();

            $table->timestamp('assessed_at');

            $table->timestamps();

            $table->index('risk_score');
            $table->index('risk_level');
            $table->index('assessed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_assessments');
    }
};
