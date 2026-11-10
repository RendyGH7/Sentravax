
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hazard_event_id')
                ->nullable()
                ->constrained('hazard_events')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('title');

            $table->text('message');

            $table->string('alert_class', 40)
                ->default('platform_advisory');

            $table->string('broadcast_level', 30)
                ->default('advisory');

            $table->string('status', 30)
                ->default('draft');

            $table->timestamp('starts_at')->nullable();

            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            $table->index('alert_class');
            $table->index('broadcast_level');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
