<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_number',
        'title',
        'category',
        'client_reference',
        'branch_id',
        'assigned_to',
        'received_date',
        'due_date',
        'priority',
        'status',
        'is_confidential',
        'manager_remarks',
        'completion_date',
        'rework_count',
    ];

    protected $casts = [
        'received_date' => 'date',
        'due_date' => 'date',
        'completion_date' => 'date',
        'is_confidential' => 'boolean',
        'rework_count' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignee()
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function history()
    {
        return $this->hasMany(DocumentHistory::class)->orderBy('created_at', 'desc');
    }
}
