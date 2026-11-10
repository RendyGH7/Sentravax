
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('alert_id')
                ->nullable()
                ->constrained('alerts')
                ->nullOnDelete();

            $table->string('title');

            $table->text('body');

            $table->string('type', 50)->default('system');

            $table->timestamp('read_at')->nullable();

            $table->jsonb('payload')->nullable();

            $table->timestamps();

            $table->index('type');
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
