
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();

            $table->foreignId('risk_assessment_id')
                ->constrained('risk_assessments')
                ->cascadeOnDelete();

            $table->string('insight_type', 50)
                ->default('risk_analysis');

            $table->text('summary');

            $table->jsonb('recommendations');

            $table->decimal('confidence_score', 4, 3)->nullable();

            $table->string('generation_mode', 30)
                ->default('rule_based');

            $table->string('model_name', 100)->nullable();

            $table->jsonb('evidence')->nullable();

            $table->timestamps();

            $table->index('insight_type');
            $table->index('generation_mode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};
