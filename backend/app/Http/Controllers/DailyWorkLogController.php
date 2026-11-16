<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DailyWorkLog;
use App\Models\Employee;
use App\Models\Notification;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DailyWorkLogController extends Controller
{
    /**
     * List daily work logs with filters.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DailyWorkLog::with(['employee.branch', 'task', 'reviewer']);

        if ($user->isEmployee()) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json(['work_logs' => []]);
            $query->where('employee_id', $employee->id);
        } elseif ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);
            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
        } elseif ($user->isSeniorAdmin()) {
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }
            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
        }

        if ($request->filled('date')) {
            $query->where('work_date', $request->date);
        }

        if ($request->filled('work_status')) {
            $query->where('work_status', $request->work_status);
        }

        if ($request->filled('manager_status')) {
            $query->where('manager_status', $request->manager_status);
        }

        $logs = $query->orderBy('work_date', 'desc')
                      ->orderBy('created_at', 'desc')
                      ->get();

        $totalMinutes = $logs->sum('time_spent_minutes');
        $totalHours = round($totalMinutes / 60, 1);

        return response()->json([
            'work_logs' => $logs,
            'summary' => [
                'total_entries' => $logs->count(),
                'total_hours' => $totalHours,
                'draft_count' => $logs->where('manager_status', 'draft')->count(),
                'pending_approval_count' => $logs->where('manager_status', 'pending')->count(),
                'approved_count' => $logs->where('manager_status', 'approved')->count(),
                'correction_count' => $logs->where('manager_status', 'correction_requested')->count(),
            ],
        ]);
    }

    /**
     * Store new daily work entry.
     * Supports: "Save as Draft" (is_draft = true) or "Submit for Review" (is_draft = false).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'work_date' => 'required|date',
            'task_id' => 'nullable|exists:tasks,id',
            'task_title' => 'required|string|max:255',
            'task_description' => 'required|string',
            'work_category' => 'required|string|max:100',
            'time_spent_minutes' => 'required|integer|min:5|max:720',
            'work_status' => 'required|in:In Progress,Completed,Pending,Submitted for Review,Draft',
            'pending_reason' => 'nullable|string',
            'employee_remarks' => 'nullable|string',
            'is_draft' => 'boolean',
        ]);

        $isDraft = $request->boolean('is_draft');
        $managerStatus = $isDraft ? 'draft' : 'pending';
        $workStatus = $isDraft ? 'Draft' : $validated['work_status'];

        $log = DailyWorkLog::create([
            'employee_id' => $employee->id,
            'branch_id' => $employee->branch_id,
            'task_id' => $validated['task_id'] ?? null,
            'work_date' => $validated['work_date'],
            'task_title' => $validated['task_title'],
            'task_description' => $validated['task_description'],
            'work_category' => $validated['work_category'],
            'time_spent_minutes' => $validated['time_spent_minutes'],
            'work_status' => $workStatus,
            'pending_reason' => $validated['pending_reason'] ?? null,
            'employee_remarks' => $validated['employee_remarks'] ?? null,
            'manager_status' => $managerStatus,
        ]);

        // Notify Branch Manager only if submitted for review
        if (!$isDraft) {
            $manager = \App\Models\User::where('branch_id', $employee->branch_id)
                ->where('role', 'branch_manager')
                ->first();
            if ($manager) {
                Notification::create([
                    'user_id' => $manager->id,
                    'title' => 'Work Sheet Entry Submitted',
                    'message' => "{$employee->full_name} submitted work log for review: {$validated['task_title']}",
                    'type' => 'task',
                    'link' => '/work-sheets',
                ]);
            }
        }

        AuditLog::log('CREATE_WORK_LOG', 'DailyWorkLog', $log->id, [
            'task_title' => $log->task_title,
            'time_spent' => $log->time_spent_minutes,
            'status' => $managerStatus,
        ]);

        return response()->json([
            'message' => $isDraft ? 'Work sheet entry saved as draft.' : 'Daily work entry submitted for partner review.',
            'work_log' => $log->load(['employee', 'task']),
        ], 201);
    }

    /**
     * Edit daily work entry.
     * Employees CANNOT edit approved entries without a correction request!
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $log = DailyWorkLog::findOrFail($id);

        if ($user->isEmployee()) {
            if ($log->employee_id !== $user->employee?->id) {
                return response()->json(['message' => 'You can only edit your own work sheets.'], 403);
            }

            if ($log->manager_status === 'approved') {
                return response()->json([
                    'message' => 'Approved work entries cannot be modified directly. Please submit an attendance/work correction request to your Branch Manager.',
                ], 403);
            }
        }

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$log->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'work_date' => 'sometimes|required|date',
            'task_id' => 'nullable|exists:tasks,id',
            'task_title' => 'sometimes|required|string|max:255',
            'task_description' => 'sometimes|required|string',
            'work_category' => 'sometimes|required|string|max:100',
            'time_spent_minutes' => 'sometimes|required|integer|min:5|max:720',
            'work_status' => 'sometimes|required|in:In Progress,Completed,Pending,Submitted for Review,Draft',
            'pending_reason' => 'nullable|string',
            'employee_remarks' => 'nullable|string',
            'is_draft' => 'boolean',
        ]);

        $updateData = $validated;
        if ($request->has('is_draft')) {
            $isDraft = $request->boolean('is_draft');
            $updateData['manager_status'] = $isDraft ? 'draft' : 'pending';
            if ($isDraft) {
                $updateData['work_status'] = 'Draft';
            } elseif ($log->manager_status === 'correction_requested') {
                $updateData['work_status'] = 'Submitted for Review';
            }
        }

        $log->update($updateData);

        AuditLog::log('UPDATE_WORK_LOG', 'DailyWorkLog', $log->id, [
            'task_title' => $log->task_title,
            'time_spent' => $log->time_spent_minutes,
            'status' => $log->manager_status,
        ]);

        return response()->json([
            'message' => 'Work sheet entry updated successfully.',
            'work_log' => $log->load(['employee', 'task', 'reviewer']),
        ]);
    }

    /**
     * Submit a draft work sheet for review.
     */
    public function submit(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $log = DailyWorkLog::where('id', $id)->where('employee_id', $employee->id)->firstOrFail();

        if ($log->manager_status === 'approved') {
            return response()->json(['message' => 'Entry is already approved.'], 422);
        }

        $log->update([
            'manager_status' => 'pending',
            'work_status' => 'Submitted for Review',
        ]);

        $manager = \App\Models\User::where('branch_id', $employee->branch_id)
            ->where('role', 'branch_manager')
            ->first();
        if ($manager) {
            Notification::create([
                'user_id' => $manager->id,
                'title' => 'Work Sheet Submitted for Review',
                'message' => "{$employee->full_name} submitted draft for review: {$log->task_title}",
                'type' => 'task',
                'link' => '/work-sheets',
            ]);
        }

        AuditLog::log('SUBMIT_WORK_LOG_FOR_REVIEW', 'DailyWorkLog', $log->id, [
            'task_title' => $log->task_title,
        ]);

        return response()->json([
            'message' => 'Work sheet draft submitted to manager for review.',
            'work_log' => $log->load(['employee', 'task']),
        ]);
    }

    /**
     * Delete a work sheet entry.
     * Employees can only delete their own DRAFT entries.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $log = DailyWorkLog::findOrFail($id);

        if ($user->isEmployee()) {
            if ($log->employee_id !== $user->employee?->id) {
                return response()->json(['message' => 'Access denied.'], 403);
            }
            if ($log->manager_status !== 'draft') {
                return response()->json([
                    'message' => 'Only draft entries can be deleted. Submitted or approved logs must be reviewed by the Branch Manager.',
                ], 422);
            }
        } elseif (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$log->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $title = $log->task_title;
        $log->delete();

        AuditLog::log('DELETE_WORK_LOG', 'DailyWorkLog', $id, [
            'task_title' => $title,
        ]);

        return response()->json([
            'message' => 'Work sheet entry deleted successfully.',
        ]);
    }

    /**
     * Manager reviews daily work entry (Approve or request corrections).
     */
    public function review(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot review work sheets.'], 403);
        }

        $log = DailyWorkLog::with('employee')->findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$log->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'manager_status' => 'required|in:approved,correction_requested',
            'manager_remarks' => 'required|string|min:3',
        ]);

        $newWorkStatus = $validated['manager_status'] === 'approved' ? 'Completed' : 'Pending';

        $log->update([
            'manager_status' => $validated['manager_status'],
            'manager_remarks' => $validated['manager_remarks'],
            'work_status' => $newWorkStatus,
            'reviewed_by' => $user->id,
            'reviewed_at' => Carbon::now(),
        ]);

        // Notify Employee
        if ($log->employee?->user_id) {
            $statusLabel = $validated['manager_status'] === 'approved' ? 'Approved' : 'Correction Requested';
            Notification::create([
                'user_id' => $log->employee->user_id,
                'title' => "Work Sheet Entry {$statusLabel}",
                'message' => "Your work log for {$log->work_date} was {$statusLabel}. Manager Feedback: {$validated['manager_remarks']}",
                'type' => 'task',
                'link' => '/work-sheets',
            ]);
        }

        AuditLog::log('REVIEW_WORK_LOG', 'DailyWorkLog', $log->id, [
            'status' => $validated['manager_status'],
            'remarks' => $validated['manager_remarks'],
        ]);

        return response()->json([
            'message' => "Work sheet entry {$validated['manager_status']} successfully.",
            'work_log' => $log->load(['employee', 'reviewer']),
        ]);
    }
}
