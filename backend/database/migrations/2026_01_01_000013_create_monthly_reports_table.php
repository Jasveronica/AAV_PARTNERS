<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->unsignedSmallInteger('report_month'); // 1 - 12
            $table->unsignedSmallInteger('report_year'); // e.g. 2026
            $table->string('status', 30)->default('Draft'); // Draft, Submitted, Approved, Rejected
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedInteger('total_employees')->default(0);
            $table->decimal('present_rate', 5, 2)->default(0.00);
            $table->unsignedInteger('tasks_assigned')->default(0);
            $table->unsignedInteger('tasks_completed')->default(0);
            $table->unsignedInteger('tasks_pending')->default(0);
            $table->unsignedInteger('documents_processed')->default(0);
            $table->unsignedInteger('documents_completed')->default(0);
            $table->decimal('average_performance_score', 5, 2)->default(0.00);
            $table->text('operational_highlights')->nullable();
            $table->text('manager_remarks')->nullable();
            $table->text('admin_feedback')->nullable();
            $table->json('summary_data')->nullable(); // full frozen historical snapshot
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['branch_id', 'report_month', 'report_year']);
            $table->index(['branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_reports');
    }
};
