<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Notification;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaveController extends Controller
{
    /**
     * Get active leave types.
     */
    public function types()
    {
        $types = LeaveType::where('is_active', true)->get();
        return response()->json(['leave_types' => $types]);
    }

    /**
     * List leave requests with filters.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LeaveRequest::with(['employee.branch', 'leaveType', 'reviewer']);

        if ($user->isEmployee()) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json(['leave_requests' => []]);
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

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'leave_requests' => $requests,
            'summary' => [
                'total' => $requests->count(),
                'pending' => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Apply for leave (Employee action).
     * Validates balance and prevents overlapping approved leave records.
     */
    public function apply(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|min:5|max:500',
        ]);

        $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);

        // Calculate days excluding Sundays
        $period = CarbonPeriod::create($start, $end);
        $daysCount = 0;
        foreach ($period as $dt) {
            if (!$dt->isSunday()) {
                $daysCount++;
            }
        }

        if ($daysCount === 0) {
            return response()->json(['message' => 'The selected dates fall only on non-working days (Sundays).'], 422);
        }

        // Validate leave balance
        $balanceField = match ($leaveType->code) {
            'CL' => 'leave_balance_casual',
            'SL' => 'leave_balance_sick',
            'EL' => 'leave_balance_emergency',
            default => null,
        };

        if ($balanceField && $employee->{$balanceField} < $daysCount) {
            return response()->json([
                'message' => "Insufficient {$leaveType->name} balance. Available: {$employee->{$balanceField}} days, Requested: {$daysCount} days.",
            ], 422);
        }

        // Prevent overlapping approved leave records
        $overlap = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                  ->orWhereBetween('end_date', [$start->toDateString(), $end->toDateString()])
                  ->orWhere(function ($sub) use ($start, $end) {
                      $sub->where('start_date', '<=', $start->toDateString())
                          ->where('end_date', '>=', $end->toDateString());
                  });
            })->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'You already have an approved leave record overlapping with the requested date range.',
            ], 422);
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'branch_id' => $employee->branch_id,
            'leave_type_id' => $leaveType->id,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'days_count' => $daysCount,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        // Notify Branch Manager
        $manager = \App\Models\User::where('branch_id', $employee->branch_id)
            ->where('role', 'branch_manager')
            ->first();
        if ($manager) {
            Notification::create([
                'user_id' => $manager->id,
                'title' => 'New Leave Application',
                'message' => "{$employee->full_name} applied for {$daysCount} days of {$leaveType->name}.",
                'type' => 'leave',
                'link' => '/leaves',
            ]);
        }

        AuditLog::log('APPLY_LEAVE', 'LeaveRequest', $leaveRequest->id, [
            'days' => $daysCount,
            'type' => $leaveType->name,
        ]);

        return response()->json([
            'message' => 'Leave application submitted successfully.',
            'leave_request' => $leaveRequest->load('leaveType'),
        ], 201);
    }

    /**
     * Review leave request (Approve or Reject).
     * Deducts balance and marks Attendance records when approved.
     */
    public function review(Request $request, $id)
    {
        $user = $request->user();
        $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$leaveRequest->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'manager_remarks' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($leaveRequest, $validated, $user) {
            $prevStatus = $leaveRequest->status;
            $leaveRequest->update([
                'status' => $validated['status'],
                'manager_remarks' => $validated['manager_remarks'] ?? null,
                'reviewed_by' => $user->id,
                'reviewed_at' => Carbon::now(),
            ]);

            // Deduct balance and update attendance if newly approved
            if ($validated['status'] === 'approved' && $prevStatus !== 'approved') {
                $employee = $leaveRequest->employee;
                $balanceField = match ($leaveRequest->leaveType?->code) {
                    'CL' => 'leave_balance_casual',
                    'SL' => 'leave_balance_sick',
                    'EL' => 'leave_balance_emergency',
                    default => null,
                };

                if ($balanceField && $employee) {
                    $employee->decrement($balanceField, $leaveRequest->days_count);
                }

                // Populate / update attendance records as 'Approved Leave'
                $period = CarbonPeriod::create($leaveRequest->start_date, $leaveRequest->end_date);
                foreach ($period as $date) {
                    if (!$date->isSunday()) {
                        Attendance::updateOrCreate(
                            [
                                'employee_id' => $employee->id,
                                'date' => $date->toDateString(),
                            ],
                            [
                                'branch_id' => $employee->branch_id,
                                'status' => 'Approved Leave',
                                'working_hours' => 0.00,
                                'notes' => "Approved {$leaveRequest->leaveType?->name} (#LR-{$leaveRequest->id})",
                            ]
                        );
                    }
                }
            }

            // Notify Employee
            if ($leaveRequest->employee?->user_id) {
                Notification::create([
                    'user_id' => $leaveRequest->employee->user_id,
                    'title' => 'Leave Request ' . ucfirst($validated['status']),
                    'message' => "Your leave application for {$leaveRequest->start_date} to {$leaveRequest->end_date} was {$validated['status']}.",
                    'type' => 'leave',
                    'link' => '/leaves',
                ]);
            }

            AuditLog::log('REVIEW_LEAVE', 'LeaveRequest', $leaveRequest->id, [
                'status' => $validated['status'],
            ]);

            return response()->json([
                'message' => "Leave application {$validated['status']} successfully.",
                'leave_request' => $leaveRequest->fresh(['employee', 'leaveType', 'reviewer']),
            ]);
        });
    }

    /**
     * Cancel pending leave request (Employee action).
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $leaveRequest = LeaveRequest::where('id', $id)
            ->where('employee_id', $employee->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $leaveRequest->update(['status' => 'cancelled']);

        AuditLog::log('CANCEL_LEAVE', 'LeaveRequest', $leaveRequest->id);

        return response()->json(['message' => 'Leave request cancelled successfully.']);
    }
}
