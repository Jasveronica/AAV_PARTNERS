<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 50)->unique();
            $table->string('title');
            $table->string('category', 60); // Corporate Contract, Court Pleadings, Affidavit, Conveyance Deed, Legal Opinion, Power of Attorney, Arbitration Petition
            $table->string('client_reference')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('employees')->nullOnDelete();
            $table->date('received_date');
            $table->date('due_date');
            $table->string('priority', 20)->default('Medium'); // Low, Medium, High, Urgent
            $table->string('status', 30)->default('Received'); // Received, Assigned, In Progress, Manager Review, Completed, Delivered
            $table->boolean('is_confidential')->default(false);
            $table->text('manager_remarks')->nullable();
            $table->date('completion_date')->nullable();
            $table->integer('rework_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index(['due_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
