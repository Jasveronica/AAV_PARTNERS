<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MonthlyReport extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'branch_id',
        'report_month',
        'report_year',
        'status',
        'created_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'total_employees',
        'present_rate',
        'tasks_assigned',
        'tasks_completed',
        'tasks_pending',
        'documents_processed',
        'documents_completed',
        'average_performance_score',
        'operational_highlights',
        'manager_remarks',
        'admin_feedback',
        'summary_data',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'present_rate' => 'decimal:2',
        'average_performance_score' => 'decimal:2',
        'summary_data' => 'array',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function employeeSummaries()
    {
        return $this->hasMany(EmployeeMonthlySummary::class);
    }
}
