<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 10)->unique();
            $table->string('address')->nullable();
            $table->string('city');
            $table->string('state')->default('Tamil Nadu');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->time('work_start_time')->default('10:00:00');
            $table->time('work_end_time')->default('18:00:00');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
