<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('employee_id', 30)->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('designation');
            $table->string('department')->default('Legal');
            $table->string('phone', 25)->nullable();
            $table->string('email');
            $table->date('joining_date');
            $table->string('employment_status', 20)->default('active'); // active, on_leave, probation, inactive
            $table->foreignId('reporting_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('emergency_contact', 50)->nullable();
            $table->integer('leave_balance_casual')->default(12);
            $table->integer('leave_balance_sick')->default(10);
            $table->integer('leave_balance_emergency')->default(5);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
