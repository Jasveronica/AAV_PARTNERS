<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->date('work_date');
            $table->string('task_title');
            $table->text('task_description');
            $table->string('work_category'); // Drafting, Case Research, Client Consultation, Court Appearance, Filing & Scrutiny, Administrative
            $table->integer('time_spent_minutes')->default(60); // in minutes
            $table->string('work_status', 30)->default('In Progress'); // In Progress, Completed, Pending, Submitted for Review
            $table->text('pending_reason')->nullable();
            $table->text('employee_remarks')->nullable();
            $table->string('manager_status', 30)->default('pending'); // pending, approved, correction_requested
            $table->text('manager_remarks')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'work_date']);
            $table->index(['branch_id', 'work_date']);
            $table->index(['manager_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_work_logs');
    }
};
