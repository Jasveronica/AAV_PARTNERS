<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\TaskReview;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * List tasks with filters and role-based data isolation.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Task::with(['branch', 'assignee.user', 'assigner', 'reviews.reviewer', 'histories.user']);

        if ($user->isEmployee()) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json(['tasks' => []]);
            $query->where('assigned_to', $employee->id);
        } elseif ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);
            if ($request->filled('employee_id')) {
                $query->where('assigned_to', $request->employee_id);
            }
        } elseif ($user->isSeniorAdmin()) {
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }
            if ($request->filled('employee_id')) {
                $query->where('assigned_to', $request->employee_id);
            }
        }

        if ($request->filled('status')) {
            $status = strtoupper(str_replace(' ', '_', $request->status));
            $query->where(function ($q) use ($status, $request) {
                $q->where('status', $status)
                  ->orWhere('status', $request->status);
            });
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('complexity')) {
            $query->where('complexity', $request->complexity);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('task_id', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $tasks = $query->orderBy('deadline', 'asc')->get();

        return response()->json([
            'tasks' => $tasks,
            'summary' => [
                'total' => $tasks->count(),
                'assigned' => $tasks->filter(fn($t) => in_array($t->status, ['ASSIGNED', 'Assigned']))->count(),
                'in_progress' => $tasks->filter(fn($t) => in_array($t->status, ['IN_PROGRESS', 'In Progress']))->count(),
                'submitted' => $tasks->filter(fn($t) => in_array($t->status, ['SUBMITTED', 'Submitted']))->count(),
                'needs_revision' => $tasks->filter(fn($t) => in_array($t->status, ['NEEDS_REVISION', 'Rejected / Needs Revision']))->count(),
                'completed' => $tasks->filter(fn($t) => in_array($t->status, ['COMPLETED', 'Completed']))->count(),
                'urgent' => $tasks->where('priority', 'Urgent')->count(),
            ],
        ]);
    }

    /**
     * Create & assign a new legal task (Manager / Admin).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot create or assign tasks.'], 403);
        }

        $branchId = $user->isSeniorAdmin() ? $request->input('branch_id') : $user->branch_id;
        $branch = Branch::findOrFail($branchId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'assigned_to' => 'required|exists:employees,id',
            'priority' => 'required|in:Low,Medium,High,Urgent',
            'complexity' => 'required|in:Simple,Medium,Complex',
            'deadline' => 'required|date|after_or_equal:today',
            'requires_review' => 'boolean',
        ]);

        return DB::transaction(function () use ($validated, $branch, $user) {
            $count = Task::where('branch_id', $branch->id)->count() + 101;
            $taskId = "TSK-{$branch->code}-{$count}";
            while (Task::where('task_id', $taskId)->exists()) {
                $count++;
                $taskId = "TSK-{$branch->code}-{$count}";
            }

            $assignee = Employee::findOrFail($validated['assigned_to']);

            $task = Task::create([
                'task_id' => $taskId,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'branch_id' => $branch->id,
                'assigned_to' => $validated['assigned_to'],
                'assigned_by' => $user->id,
                'priority' => $validated['priority'],
                'complexity' => $validated['complexity'],
                'progress_percent' => 0,
                'progress_notes' => 'Task assigned to associate.',
                'time_spent_minutes' => 0,
                'status' => 'ASSIGNED',
                'deadline' => $validated['deadline'],
                'requires_review' => $validated['requires_review'] ?? true,
            ]);

            // Create initial task history
            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'action' => 'Task Created and Assigned',
                'previous_status' => null,
                'new_status' => 'ASSIGNED',
                'progress_percent' => 0,
                'time_spent_minutes' => 0,
                'notes' => "Task assigned to {$assignee->full_name} with priority {$task->priority}, due {$task->deadline->format('Y-m-d')}.",
            ]);

            // Notify assigned employee
            if ($assignee->user_id) {
                Notification::create([
                    'user_id' => $assignee->user_id,
                    'title' => 'New Legal Brief Assigned',
                    'message' => "You have been assigned: {$task->title} (Due: {$task->deadline->format('Y-m-d')})",
                    'type' => 'task',
                    'link' => '/tasks',
                ]);
            }

            AuditLog::log('CREATE_TASK', 'Task', $task->id, [
                'task_id' => $taskId,
                'title' => $task->title,
                'assigned_to' => $assignee->full_name,
                'priority' => $task->priority,
            ]);

            return response()->json([
                'message' => 'Task assigned successfully.',
                'task' => $task->load(['branch', 'assignee.user', 'assigner', 'histories.user']),
            ], 201);
        });
    }

    /**
     * Show task details with full history timeline and reviews.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::with(['branch', 'assignee.user', 'assigner', 'reviews.reviewer', 'histories.user', 'dailyWorkLogs.employee'])
            ->findOrFail($id);

        if ($user->isEmployee() && $task->assigned_to !== $user->employee?->id) {
            return response()->json(['message' => 'Restricted task: Access denied.'], 403);
        }

        if ($user->isBranchManager() && (int)$user->branch_id !== (int)$task->branch_id) {
            return response()->json(['message' => 'Branch data isolation: Access denied.'], 403);
        }

        return response()->json(['task' => $task]);
    }

    /**
     * Update task (Manager edits parameters / Employee updates progress).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::with(['assignee', 'branch'])->findOrFail($id);

        // Branch Isolation
        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$task->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        // 1. Employee Update Flow: Progress, Time, Description ONLY
        if ($user->isEmployee()) {
            if ($task->assigned_to !== $user->employee?->id) {
                return response()->json(['message' => 'You can only update tasks assigned to you.'], 403);
            }

            if (in_array($task->status, ['COMPLETED', 'Completed'])) {
                return response()->json(['message' => 'Completed tasks cannot be edited.'], 422);
            }

            $validated = $request->validate([
                'progress_percent' => 'required|integer|min:0|max:100',
                'progress_notes' => 'required|string|min:3',
                'time_spent_minutes' => 'nullable|integer|min:0|max:720',
                'status' => 'nullable|in:IN_PROGRESS,In Progress,SUBMITTED,Submitted',
            ]);

            return DB::transaction(function () use ($task, $validated, $user) {
                $prevStatus = $task->status;
                $newStatus = $validated['status'] ?? 'IN_PROGRESS';
                if ($newStatus === 'In Progress') $newStatus = 'IN_PROGRESS';

                // If task was ASSIGNED or NEEDS_REVISION, advance to IN_PROGRESS
                if (in_array($prevStatus, ['ASSIGNED', 'Assigned', 'NEEDS_REVISION', 'Rejected / Needs Revision'])) {
                    $newStatus = 'IN_PROGRESS';
                }

                $totalMinutes = ($task->time_spent_minutes ?? 0) + ($validated['time_spent_minutes'] ?? 0);

                $task->update([
                    'progress_percent' => $validated['progress_percent'],
                    'progress_notes' => $validated['progress_notes'],
                    'time_spent_minutes' => $totalMinutes,
                    'status' => $newStatus,
                ]);

                // Record in TaskHistory
                TaskHistory::create([
                    'task_id' => $task->id,
                    'user_id' => $user->id,
                    'action' => 'Progress Updated',
                    'previous_status' => $prevStatus,
                    'new_status' => $newStatus,
                    'progress_percent' => $validated['progress_percent'],
                    'time_spent_minutes' => $validated['time_spent_minutes'] ?? 0,
                    'notes' => $validated['progress_notes'],
                ]);

                AuditLog::log('UPDATE_TASK_PROGRESS', 'Task', $task->id, [
                    'progress_percent' => $validated['progress_percent'],
                    'time_spent' => $validated['time_spent_minutes'] ?? 0,
                    'notes' => $validated['progress_notes'],
                ]);

                return response()->json([
                    'message' => 'Task progress updated successfully.',
                    'task' => $task->load(['branch', 'assignee.user', 'assigner', 'histories.user', 'reviews']),
                ]);
            });
        }

        // 2. Manager / Senior Admin Update Flow: Instructions, Deadlines, Reassignment
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'assigned_to' => 'sometimes|required|exists:employees,id',
            'priority' => 'sometimes|required|in:Low,Medium,High,Urgent',
            'complexity' => 'sometimes|required|in:Simple,Medium,Complex',
            'deadline' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:ASSIGNED,IN_PROGRESS,SUBMITTED,NEEDS_REVISION,COMPLETED,Assigned,In Progress,Submitted,Completed,Rejected / Needs Revision',
            'submission_notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($task, $validated, $user) {
            $prevStatus = $task->status;
            $prevAssigneeId = $task->assigned_to;

            // Normalize status if provided
            if (isset($validated['status'])) {
                $statusMap = [
                    'Assigned' => 'ASSIGNED',
                    'In Progress' => 'IN_PROGRESS',
                    'Submitted' => 'SUBMITTED',
                    'Rejected / Needs Revision' => 'NEEDS_REVISION',
                    'Completed' => 'COMPLETED',
                ];
                $validated['status'] = $statusMap[$validated['status']] ?? $validated['status'];
            }

            $task->update($validated);

            $action = 'Task Updated by Manager';
            $notes = 'Task instructions / parameters modified.';

            // If reassigned to a different employee
            if (isset($validated['assigned_to']) && (int)$validated['assigned_to'] !== (int)$prevAssigneeId) {
                $newAssignee = Employee::find($validated['assigned_to']);
                $action = 'Task Reassigned';
                $notes = "Task reassigned from {$task->assignee?->full_name} to {$newAssignee?->full_name}.";

                if ($newAssignee?->user_id) {
                    Notification::create([
                        'user_id' => $newAssignee->user_id,
                        'title' => 'Brief Reassigned To You',
                        'message' => "Task '{$task->title}' has been assigned to you by {$user->name}.",
                        'type' => 'task',
                        'link' => '/tasks',
                    ]);
                }
            }

            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'action' => $action,
                'previous_status' => $prevStatus,
                'new_status' => $task->status,
                'progress_percent' => $task->progress_percent,
                'time_spent_minutes' => $task->time_spent_minutes,
                'notes' => $notes,
            ]);

            AuditLog::log('UPDATE_TASK', 'Task', $task->id, [
                'previous_status' => $prevStatus,
                'new_status' => $task->status,
                'action' => $action,
            ]);

            return response()->json([
                'message' => 'Task updated successfully.',
                'task' => $task->load(['branch', 'assignee.user', 'assigner', 'histories.user', 'reviews']),
            ]);
        });
    }

    /**
     * Submit completed work (Employee action).
     * Task status transitions to SUBMITTED.
     */
    public function submitWork(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $task = Task::where('id', $id)->where('assigned_to', $employee->id)->firstOrFail();

        $validated = $request->validate([
            'submission_notes' => 'required|string|min:5',
            'time_spent_minutes' => 'nullable|integer|min:0|max:720',
        ]);

        return DB::transaction(function () use ($task, $validated, $employee, $user) {
            $prevStatus = $task->status;
            $addMinutes = $validated['time_spent_minutes'] ?? 0;
            $totalMinutes = ($task->time_spent_minutes ?? 0) + $addMinutes;

            $task->update([
                'status' => 'SUBMITTED',
                'progress_percent' => 100,
                'submission_notes' => $validated['submission_notes'],
                'time_spent_minutes' => $totalMinutes,
            ]);

            // Record in TaskHistory
            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'action' => 'Work Submitted for Review',
                'previous_status' => $prevStatus,
                'new_status' => 'SUBMITTED',
                'progress_percent' => 100,
                'time_spent_minutes' => $addMinutes,
                'notes' => $validated['submission_notes'],
            ]);

            // Notify assigner / branch manager
            Notification::create([
                'user_id' => $task->assigned_by,
                'title' => 'Brief Submitted for Review',
                'message' => "{$employee->full_name} submitted work for review: {$task->title}",
                'type' => 'task',
                'link' => '/tasks',
            ]);

            AuditLog::log('SUBMIT_TASK_WORK', 'Task', $task->id, [
                'notes' => $validated['submission_notes'],
                'time_spent' => $addMinutes,
            ]);

            return response()->json([
                'message' => 'Task work submitted successfully for manager appraisal.',
                'task' => $task->load(['branch', 'assignee.user', 'assigner', 'histories.user', 'reviews']),
            ]);
        });
    }

    /**
     * Manager reviews submitted task.
     * Actions:
     * - approved: status becomes COMPLETED, rating 1-5, completed_at set.
     * - revision_requested: status becomes NEEDS_REVISION, returned to employee.
     */
    public function review(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot review or approve tasks.'], 403);
        }

        $task = Task::with('assignee')->findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$task->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'action' => 'required|in:approved,rejected,revision_requested',
            'rating' => 'required|integer|min:1|max:5',
            'remarks' => 'required|string|min:5',
        ]);

        return DB::transaction(function () use ($task, $validated, $user) {
            $prevStatus = $task->status;
            $isApproved = ($validated['action'] === 'approved');
            $newStatus = $isApproved ? 'COMPLETED' : 'NEEDS_REVISION';

            $task->update([
                'status' => $newStatus,
                'completed_at' => $isApproved ? Carbon::now() : null,
            ]);

            $review = TaskReview::create([
                'task_id' => $task->id,
                'reviewer_id' => $user->id,
                'action' => $validated['action'],
                'rating' => $validated['rating'],
                'remarks' => $validated['remarks'],
            ]);

            $historyAction = $isApproved ? 'Task Approved & Completed' : 'Revision Requested';
            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'action' => $historyAction,
                'previous_status' => $prevStatus,
                'new_status' => $newStatus,
                'progress_percent' => $isApproved ? 100 : 75,
                'notes' => "Rating: {$validated['rating']}/5. Remarks: {$validated['remarks']}",
            ]);

            // Notify Assignee
            if ($task->assignee?->user_id) {
                Notification::create([
                    'user_id' => $task->assignee->user_id,
                    'title' => $isApproved ? 'Task Approved & Completed' : 'Task Needs Revision',
                    'message' => "Task '{$task->title}' review: {$historyAction}. Rating: {$validated['rating']}/5. Feedback: {$validated['remarks']}",
                    'type' => 'task',
                    'link' => '/tasks',
                ]);
            }

            AuditLog::log('REVIEW_TASK', 'Task', $task->id, [
                'action' => $validated['action'],
                'rating' => $validated['rating'],
                'new_status' => $newStatus,
                'remarks' => $validated['remarks'],
            ]);

            return response()->json([
                'message' => "Task review recorded: Task is now marked {$newStatus}.",
                'task' => $task->load(['branch', 'assignee.user', 'assigner', 'histories.user', 'reviews.reviewer']),
                'review' => $review,
            ]);
        });
    }

    /**
     * Request a status update / progress follow-up from the assigned associate.
     * Used when a task has been in progress for a while or approaching deadlines.
     */
    public function requestUpdate(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot request task updates.'], 403);
        }

        $task = Task::with('assignee.user')->findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$task->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'message' => 'nullable|string|max:500',
        ]);

        $note = !empty($validated['message']) ? $validated['message'] : 'Management requested an interim status update on this matter.';

        return DB::transaction(function () use ($task, $user, $note) {
            // Record in TaskHistory timeline
            TaskHistory::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'action' => 'Update Requested by Management',
                'previous_status' => $task->status,
                'new_status' => $task->status,
                'progress_percent' => $task->progress_percent,
                'time_spent_minutes' => 0,
                'notes' => $note,
            ]);

            // Notify assigned employee
            if ($task->assignee?->user_id) {
                Notification::create([
                    'user_id' => $task->assignee->user_id,
                    'title' => "Status Update Requested: {$task->task_id}",
                    'message' => "Partner {$user->name} requested an update on '{$task->title}': \"{$note}\"",
                    'type' => 'task',
                    'link' => '/tasks',
                ]);
            }

            AuditLog::log('REQUEST_TASK_UPDATE', 'Task', $task->id, [
                'manager' => $user->name,
                'note' => $note,
            ]);

            return response()->json([
                'message' => "Status update requested from {$task->assignee?->full_name}.",
                'task' => $task->load(['branch', 'assignee.user', 'assigner', 'histories.user', 'reviews.reviewer']),
            ]);
        });
    }

    /**
     * Delete a task (Manager / Admin).
     * Cannot delete COMPLETED tasks to preserve monthly legal audit integrity.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot delete tasks.'], 403);
        }

        $task = Task::findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$task->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if (in_array($task->status, ['COMPLETED', 'Completed'])) {
            return response()->json([
                'message' => 'Completed tasks cannot be deleted as they form part of official monthly legal audit records.',
            ], 422);
        }

        $taskId = $task->task_id;
        $title = $task->title;

        $task->delete();

        AuditLog::log('DELETE_TASK', 'Task', $task->id, [
            'task_id' => $taskId,
            'title' => $title,
        ]);

        return response()->json([
            'message' => "Task {$taskId} deleted successfully.",
        ]);
    }
}
