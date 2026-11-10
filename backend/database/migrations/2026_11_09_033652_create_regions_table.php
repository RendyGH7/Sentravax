
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table) {
            $table->id();

            $table->string('code', 30)->unique();
            $table->string('name');

            $table->string('level', 30);

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('regions')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('level');
        });

        // PostGIS geometry columns
        DB::statement("
            ALTER TABLE regions
            ADD COLUMN center_point geometry(Point, 4326)
        ");

        DB::statement("
            ALTER TABLE regions
            ADD COLUMN boundary geometry(MultiPolygon, 4326)
        ");

        // Spatial indexes
        DB::statement("
            CREATE INDEX regions_center_point_gist_idx
            ON regions USING GIST (center_point)
        ");

        DB::statement("
            CREATE INDEX regions_boundary_gist_idx
            ON regions USING GIST (boundary)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
