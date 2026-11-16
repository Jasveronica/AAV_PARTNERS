<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'branch_id',
        'employee_id',
        'first_name',
        'last_name',
        'designation',
        'department',
        'phone',
        'email',
        'joining_date',
        'employment_status',
        'reporting_manager_id',
        'emergency_contact',
        'leave_balance_casual',
        'leave_balance_sick',
        'leave_balance_emergency',
    ];

    protected $casts = [
        'joining_date' => 'date',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function reportingManager()
    {
        return $this->belongsTo(User::class, 'reporting_manager_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function dailyWorkLogs()
    {
        return $this->hasMany(DailyWorkLog::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'assigned_to');
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function monthlySummaries()
    {
        return $this->hasMany(EmployeeMonthlySummary::class);
    }
}
