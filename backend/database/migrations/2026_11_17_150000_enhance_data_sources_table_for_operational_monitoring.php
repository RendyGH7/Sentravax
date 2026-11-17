<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            if (!Schema::hasColumn('data_sources', 'sync_interval_minutes')) {
                $table->integer('sync_interval_minutes')->default(15);
            }
            if (!Schema::hasColumn('data_sources', 'rate_limit_rpm')) {
                $table->integer('rate_limit_rpm')->default(60);
            }
            if (!Schema::hasColumn('data_sources', 'terms_of_service')) {
                $table->string('terms_of_service', 255)->nullable();
            }
            if (!Schema::hasColumn('data_sources', 'last_observed_at')) {
                $table->timestamp('last_observed_at')->nullable();
            }
            if (!Schema::hasColumn('data_sources', 'is_simulated')) {
                $table->boolean('is_simulated')->default(false);
            }
            if (!Schema::hasColumn('data_sources', 'metadata')) {
                $table->jsonb('metadata')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $columns = [
                'sync_interval_minutes',
                'rate_limit_rpm',
                'terms_of_service',
                'last_observed_at',
                'is_simulated',
                'metadata',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('data_sources', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
