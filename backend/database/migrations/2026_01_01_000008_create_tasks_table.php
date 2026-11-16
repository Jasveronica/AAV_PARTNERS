<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_id', 30)->unique();
            $table->string('title');
            $table->text('description');
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->cascadeOnDelete();
            $table->string('priority', 20)->default('Medium'); // Low, Medium, High, Urgent
            $table->string('complexity', 20)->default('Medium'); // Simple, Medium, Complex
            $table->string('status', 30)->default('Assigned'); // Assigned, In Progress, Submitted, Completed, Rejected / Needs Revision
            $table->date('deadline');
            $table->timestamp('completed_at')->nullable();
            $table->text('submission_notes')->nullable();
            $table->boolean('requires_review')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index(['deadline', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
