<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeMonthlySummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'monthly_report_id',
        'employee_id',
        'branch_id',
        'month',
        'year',
        'working_days',
        'present_days',
        'leave_days',
        'absent_days',
        'late_arrivals',
        'attendance_percentage',
        'tasks_assigned',
        'tasks_completed',
        'tasks_pending',
        'tasks_overdue',
        'on_time_rate',
        'documents_processed',
        'documents_completed',
        'rework_count',
        'task_completion_score',
        'work_quality_score',
        'deadline_score',
        'documentation_accuracy_score',
        'coordination_score',
        'overall_performance_score',
        'key_achievements',
        'strengths',
        'improvement_areas',
        'manager_remarks',
        'overall_review',
    ];

    protected $casts = [
        'attendance_percentage' => 'decimal:2',
        'on_time_rate' => 'decimal:2',
        'task_completion_score' => 'decimal:2',
        'work_quality_score' => 'decimal:2',
        'deadline_score' => 'decimal:2',
        'documentation_accuracy_score' => 'decimal:2',
        'coordination_score' => 'decimal:2',
        'overall_performance_score' => 'decimal:2',
    ];

    public function monthlyReport()
    {
        return $this->belongsTo(MonthlyReport::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
