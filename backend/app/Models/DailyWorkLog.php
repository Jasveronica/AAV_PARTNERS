<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyWorkLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'branch_id',
        'task_id',
        'work_date',
        'task_title',
        'task_description',
        'work_category',
        'time_spent_minutes',
        'work_status',
        'pending_reason',
        'employee_remarks',
        'manager_status',
        'manager_remarks',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'work_date' => 'date',
        'time_spent_minutes' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
