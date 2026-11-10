
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_sources', function (Blueprint $table) {
            $table->id();

            $table->string('name', 150);
            $table->string('provider', 150)->nullable();

            $table->string('source_type', 30);

            $table->string('category', 50)->nullable();

            $table->text('endpoint_url')->nullable();

            $table->string('status', 30)
                ->default('active');

            $table->timestamp('last_fetched_at')->nullable();
            $table->timestamp('last_successful_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('source_type');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_sources');
    }
};
