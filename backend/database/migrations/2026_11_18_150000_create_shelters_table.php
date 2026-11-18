<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shelters', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('facility_type', 50)->default('assembly_point');
            $table->text('address');
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            
            $table->integer('capacity')->nullable();
            $table->integer('current_occupancy')->default(0);
            
            $table->boolean('has_sanitation')->default(false);
            $table->string('sanitation_details', 255)->nullable();
            $table->boolean('wheelchair_accessible')->default(false);
            $table->boolean('elderly_friendly')->default(false);
            
            $table->string('contact_person', 150)->nullable();
            $table->string('contact_phone', 50)->nullable();
            
            $table->string('operational_status', 30)->default('open');
            $table->string('verification_status', 30)->default('VERIFIED');
            $table->timestamp('verified_at')->nullable();
            $table->string('verified_by_agency', 150)->nullable();
            
            $table->string('source_name', 150)->nullable();
            $table->string('source_url', 255)->nullable();
            
            $table->jsonb('evacuation_route_info')->nullable();
            $table->jsonb('provenance_metadata')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('facility_type');
            $table->index('operational_status');
            $table->index('verification_status');
            $table->index('region_id');
        });

        // Add PostGIS spatial Point geometry column and spatial GIST index
        DB::statement('
            ALTER TABLE shelters
            ADD COLUMN location geometry(Point, 4326)
        ');

        DB::statement('
            CREATE INDEX shelters_location_gist_idx
            ON shelters USING GIST (location)
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shelters');
    }
};
