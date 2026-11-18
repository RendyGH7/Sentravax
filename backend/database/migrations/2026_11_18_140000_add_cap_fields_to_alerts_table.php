<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->string('external_identifier')->nullable()->unique()->after('id');
            $table->string('sender_name')->nullable()->after('title');
            $table->text('instruction')->nullable()->after('message');
            $table->string('area_description')->nullable()->after('instruction');
            $table->string('cap_urgency', 30)->nullable()->after('broadcast_level');
            $table->string('cap_severity', 30)->nullable()->after('cap_urgency');
            $table->string('cap_certainty', 30)->nullable()->after('cap_severity');
            $table->string('source_url')->nullable()->after('cap_certainty');
            $table->text('polygon_coordinates')->nullable()->after('source_url');
            $table->jsonb('raw_provenance')->nullable()->after('polygon_coordinates');
        });
    }

    public function down(): void
    {
        Schema::table('alerts', function (Blueprint $table) {
            $table->dropColumn([
                'external_identifier',
                'sender_name',
                'instruction',
                'area_description',
                'cap_urgency',
                'cap_severity',
                'cap_certainty',
                'source_url',
                'polygon_coordinates',
                'raw_provenance',
            ]);
        });
    }
};
