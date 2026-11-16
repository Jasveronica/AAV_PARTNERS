<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'task_id',
        'title',
        'description',
        'branch_id',
        'assigned_to',
        'assigned_by',
        'priority',
        'complexity',
        'progress_percent',
        'progress_notes',
        'time_spent_minutes',
        'status',
        'deadline',
        'completed_at',
        'submission_notes',
        'requires_review',
    ];

    protected $casts = [
        'deadline' => 'date',
        'completed_at' => 'datetime',
        'requires_review' => 'boolean',
        'progress_percent' => 'integer',
        'time_spent_minutes' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignee()
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function reviews()
    {
        return $this->hasMany(TaskReview::class);
    }

    public function histories()
    {
        return $this->hasMany(TaskHistory::class)->orderBy('created_at', 'asc');
    }

    public function dailyWorkLogs()
    {
        return $this->hasMany(DailyWorkLog::class);
    }
}
