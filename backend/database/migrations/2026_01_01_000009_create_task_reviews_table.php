<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 30); // approved, rejected, revision_requested
            $table->unsignedTinyInteger('rating')->default(5); // 1-5 quality rating
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_reviews');
    }
};
