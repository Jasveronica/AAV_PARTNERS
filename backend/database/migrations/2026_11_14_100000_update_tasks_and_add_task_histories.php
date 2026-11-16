<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add progress and time tracking columns to tasks table
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'progress_percent')) {
                $table->integer('progress_percent')->default(0)->after('complexity');
            }
            if (!Schema::hasColumn('tasks', 'progress_notes')) {
                $table->text('progress_notes')->nullable()->after('progress_percent');
            }
            if (!Schema::hasColumn('tasks', 'time_spent_minutes')) {
                $table->integer('time_spent_minutes')->default(0)->after('progress_notes');
            }
        });

        // Create task_histories table for comprehensive audit and lifecycle tracking
        if (!Schema::hasTable('task_histories')) {
            Schema::create('task_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('action', 100); // e.g. Created, Progress Updated, Submitted, Revision Requested, Completed, Reassigned
                $table->string('previous_status', 50)->nullable();
                $table->string('new_status', 50)->nullable();
                $table->integer('progress_percent')->nullable();
                $table->integer('time_spent_minutes')->nullable();
                $table->text('notes')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['task_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('task_histories');
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['progress_percent', 'progress_notes', 'time_spent_minutes']);
        });
    }
};
