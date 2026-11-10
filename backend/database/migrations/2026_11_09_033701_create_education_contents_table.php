
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('education_contents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hazard_type_id')
                ->nullable()
                ->constrained('hazard_types')
                ->nullOnDelete();

            $table->string('title');

            $table->string('slug')->unique();

            $table->string('category', 50)
                ->default('mitigation');

            $table->text('summary')->nullable();

            $table->longText('content_body');

            $table->string('content_type', 30)
                ->default('article');

            $table->boolean('is_published')->default(false);

            $table->timestamp('published_at')->nullable();

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index('category');
            $table->index('is_published');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('education_contents');
    }
};
