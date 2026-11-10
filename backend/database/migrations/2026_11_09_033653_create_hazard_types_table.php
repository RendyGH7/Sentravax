
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_types', function (Blueprint $table) {
            $table->id();

            $table->string('slug', 50)->unique();
            $table->string('name', 100);

            $table->string('category', 50)
                ->default('natural');

            $table->text('description')->nullable();

            $table->string('icon', 100)->nullable();

            $table->jsonb('severity_levels')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_types');
    }
};
