<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'action',
        'previous_status',
        'new_status',
        'progress_percent',
        'time_spent_minutes',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'progress_percent' => 'integer',
        'time_spent_minutes' => 'integer',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
