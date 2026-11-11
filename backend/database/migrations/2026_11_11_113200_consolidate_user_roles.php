<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Consolidate legacy roles into standard SENTRAVAX 3-role matrix:
     * - super_admin -> admin
     * - analyst, operator -> intelligence
     * - public -> user
     */
    public function up(): void
    {
        // Consolidate existing database records
        DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
        DB::table('users')->whereIn('role', ['analyst', 'operator'])->update(['role' => 'intelligence']);
        DB::table('users')->where('role', 'public')->update(['role' => 'user']);

        // Set default value for role column to 'user'
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('user')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('public')->change();
        });
    }
};

