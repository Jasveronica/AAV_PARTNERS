<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\FirmSetting;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Get attendance records with filters (branch, employee, date, month, year).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Attendance::with(['employee.branch']);

        // Data isolation
        if ($user->isEmployee()) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json(['attendance' => []]);
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

        // Filter by specific date
        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        // Filter by month and year
        if ($request->filled('month') && $request->filled('year')) {
            $query->whereYear('date', $request->year)
                  ->whereMonth('date', $request->month);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $records = $query->orderBy('date', 'desc')
                         ->orderBy('check_in', 'asc')
                         ->get();

        // Calculate summary metrics for the returned set
        $totalPresent = $records->whereIn('status', ['Present', 'Late', 'Half Day'])->count();
        $totalLate = $records->where('status', 'Late')->count();
        $totalLeaves = $records->where('status', 'Approved Leave')->count();
        $totalHours = round($records->sum('working_hours'), 2);

        return response()->json([
            'records' => $records,
            'summary' => [
                'total_records' => $records->count(),
                'total_present' => $totalPresent,
                'total_late' => $totalLate,
                'total_approved_leaves' => $totalLeaves,
                'total_working_hours' => $totalHours,
            ],
        ]);
    }

    /**
     * Check-in for current employee.
     * Prevents duplicate check-in for the same date.
     */
    public function checkIn(Request $request)
    {
        $user = $request->user();
        $employee = Employee::with('branch')->where('user_id', $user->id)->firstOrFail();
        $todayStr = Carbon::today()->toDateString();
        $now = Carbon::now();
        $timeStr = $now->toTimeString();

        // Prevent duplicate attendance for the same employee and date
        $existing = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $todayStr)
            ->first();

        if ($existing && $existing->check_in) {
            return response()->json([
                'message' => 'You have already checked in for today at ' . substr($existing->check_in, 0, 5),
                'attendance' => $existing,
            ], 422);
        }

        // Branch configurable start time and grace period
        $branch = $employee->branch;
        $branchStartTime = $branch?->work_start_time ?? FirmSetting::get('work_start_time', '10:00:00');
        $graceMinutes = (int) FirmSetting::get('grace_period_minutes', 15);

        $threshold = Carbon::createFromTimeString($branchStartTime)->addMinutes($graceMinutes);
        $status = $now->greaterThan($threshold) ? 'Late' : 'Present';

        if ($existing) {
            $existing->update([
                'check_in' => $timeStr,
                'status' => $status,
                'check_in_ip' => $request->ip(),
                'notes' => $request->input('notes'),
            ]);
            $attendance = $existing;
        } else {
            $attendance = Attendance::create([
                'employee_id' => $employee->id,
                'branch_id' => $employee->branch_id,
                'date' => $todayStr,
                'check_in' => $timeStr,
                'check_out' => null,
                'working_hours' => 0.00,
                'status' => $status,
                'check_in_ip' => $request->ip(),
                'notes' => $request->input('notes'),
            ]);
        }

        // If late arrival, notify branch manager
        if ($status === 'Late' && $branch) {
            $manager = \App\Models\User::where('branch_id', $branch->id)
                ->where('role', 'branch_manager')
                ->first();
            if ($manager) {
                Notification::create([
                    'user_id' => $manager->id,
                    'title' => 'Late Arrival Alert',
                    'message' => "{$employee->full_name} checked in at {$timeStr} (Late).",
                    'type' => 'attendance',
                    'link' => '/attendance',
                ]);
            }
        }

        AuditLog::log('CHECK_IN', 'Attendance', $attendance->id, [
            'time' => $timeStr,
            'status' => $status,
        ]);

        return response()->json([
            'message' => "Checked in successfully at " . substr($timeStr, 0, 5) . ($status === 'Late' ? ' (Late)' : ''),
            'attendance' => $attendance,
        ]);
    }

    /**
     * Check-out for current employee.
     * Accurately calculates working duration in hours.
     */
    public function checkOut(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();
        $todayStr = Carbon::today()->toDateString();
        $now = Carbon::now();
        $timeStr = $now->toTimeString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $todayStr)
            ->first();

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'No active check-in record found for today.'], 422);
        }

        // Calculate working hours between check_in and check_out
        $checkInDateTime = Carbon::parse("{$todayStr} {$attendance->check_in}");
        $checkOutDateTime = $now;
        $minutes = max(0, $checkInDateTime->diffInMinutes($checkOutDateTime));
        $hours = round($minutes / 60, 2);

        // Check for Half Day (if less than 4.5 hours)
        $status = $attendance->status;
        if ($hours < 4.5 && $status !== 'Approved Leave') {
            $status = 'Half Day';
        }

        $attendance->update([
            'check_out' => $timeStr,
            'working_hours' => $hours,
            'status' => $status,
        ]);

        AuditLog::log('CHECK_OUT', 'Attendance', $attendance->id, [
            'time' => $timeStr,
            'working_hours' => $hours,
            'status' => $status,
        ]);

        return response()->json([
            'message' => "Checked out successfully at " . substr($timeStr, 0, 5) . ". Total duration: {$hours} hrs.",
            'attendance' => $attendance,
        ]);
    }

    /**
     * Get correction requests.
     */
    public function corrections(Request $request)
    {
        $user = $request->user();
        $query = AttendanceCorrection::with(['employee.branch', 'reviewer']);

        if ($user->isEmployee()) {
            $emp = Employee::where('user_id', $user->id)->first();
            if ($emp) $query->where('employee_id', $emp->id);
        } elseif ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $corrections = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['corrections' => $corrections]);
    }

    /**
     * Submit an attendance correction request (Employee).
     */
    public function requestCorrection(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'date' => 'required|date',
            'requested_check_in' => 'nullable|date_format:H:i',
            'requested_check_out' => 'nullable|date_format:H:i',
            'requested_status' => 'nullable|string',
            'reason' => 'required|string|max:500',
        ]);

        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $validated['date'])
            ->first();

        $correction = AttendanceCorrection::create([
            'attendance_id' => $attendance?->id,
            'employee_id' => $employee->id,
            'branch_id' => $employee->branch_id,
            'date' => $validated['date'],
            'requested_check_in' => $validated['requested_check_in'] ? $validated['requested_check_in'] . ':00' : null,
            'requested_check_out' => $validated['requested_check_out'] ? $validated['requested_check_out'] . ':00' : null,
            'requested_status' => $validated['requested_status'] ?? 'Present',
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
                'title' => 'Attendance Correction Request',
                'message' => "{$employee->full_name} submitted a correction request for {$validated['date']}.",
                'type' => 'attendance',
                'link' => '/attendance',
            ]);
        }

        return response()->json([
            'message' => 'Attendance correction request submitted for manager review.',
            'correction' => $correction,
        ], 201);
    }

    /**
     * Review attendance correction (Branch Manager or Admin).
     */
    public function reviewCorrection(Request $request, $id)
    {
        $user = $request->user();
        $correction = AttendanceCorrection::findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$correction->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'manager_remarks' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($correction, $validated, $user) {
            $correction->update([
                'status' => $validated['status'],
                'manager_remarks' => $validated['manager_remarks'] ?? null,
                'reviewed_by' => $user->id,
                'reviewed_at' => Carbon::now(),
            ]);

            // If approved, update or create corresponding attendance record
            if ($validated['status'] === 'approved') {
                $hours = 8.00;
                if ($correction->requested_check_in && $correction->requested_check_out) {
                    $in = Carbon::parse("{$correction->date} {$correction->requested_check_in}");
                    $out = Carbon::parse("{$correction->date} {$correction->requested_check_out}");
                    $hours = round(max(0, $in->diffInMinutes($out)) / 60, 2);
                }

                Attendance::updateOrCreate(
                    [
                        'employee_id' => $correction->employee_id,
                        'date' => $correction->date,
                    ],
                    [
                        'branch_id' => $correction->branch_id,
                        'check_in' => $correction->requested_check_in,
                        'check_out' => $correction->requested_check_out,
                        'working_hours' => $hours,
                        'status' => $correction->requested_status ?? 'Present',
                        'notes' => 'Corrected via request #' . $correction->id . ' by ' . $user->name,
                    ]
                );
            }

            // Notify Employee
            if ($correction->employee?->user_id) {
                Notification::create([
                    'user_id' => $correction->employee->user_id,
                    'title' => 'Attendance Correction ' . ucfirst($validated['status']),
                    'message' => "Your correction request for {$correction->date} was {$validated['status']}.",
                    'type' => 'attendance',
                    'link' => '/attendance',
                ]);
            }

            return response()->json([
                'message' => "Correction request {$validated['status']} successfully.",
                'correction' => $correction,
            ]);
        });
    }
}
