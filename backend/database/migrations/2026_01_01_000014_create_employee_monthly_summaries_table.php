<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_monthly_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monthly_report_id')->nullable()->constrained('monthly_reports')->nullOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->unsignedSmallInteger('month');
            $table->unsignedSmallInteger('year');
            
            // Attendance metrics
            $table->unsignedSmallInteger('working_days')->default(0);
            $table->unsignedSmallInteger('present_days')->default(0);
            $table->unsignedSmallInteger('leave_days')->default(0);
            $table->unsignedSmallInteger('absent_days')->default(0);
            $table->unsignedSmallInteger('late_arrivals')->default(0);
            $table->decimal('attendance_percentage', 5, 2)->default(0.00);
            
            // Work & task metrics
            $table->unsignedInteger('tasks_assigned')->default(0);
            $table->unsignedInteger('tasks_completed')->default(0);
            $table->unsignedInteger('tasks_pending')->default(0);
            $table->unsignedInteger('tasks_overdue')->default(0);
            $table->decimal('on_time_rate', 5, 2)->default(0.00);
            $table->unsignedInteger('documents_processed')->default(0);
            $table->unsignedInteger('documents_completed')->default(0);
            $table->unsignedInteger('rework_count')->default(0);

            // Performance breakdown scores (0-100)
            $table->decimal('task_completion_score', 5, 2)->default(0.00); // 25%
            $table->decimal('work_quality_score', 5, 2)->default(0.00); // 30%
            $table->decimal('deadline_score', 5, 2)->default(0.00); // 20%
            $table->decimal('documentation_accuracy_score', 5, 2)->default(0.00); // 15%
            $table->decimal('coordination_score', 5, 2)->default(0.00); // 10%
            $table->decimal('overall_performance_score', 5, 2)->default(0.00);

            // Manager qualitative review
            $table->text('key_achievements')->nullable();
            $table->text('strengths')->nullable();
            $table->text('improvement_areas')->nullable();
            $table->text('manager_remarks')->nullable();
            $table->text('overall_review')->nullable();

            $table->timestamps();

            $table->unique(['employee_id', 'month', 'year']);
            $table->index(['branch_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_monthly_summaries');
    }
};
