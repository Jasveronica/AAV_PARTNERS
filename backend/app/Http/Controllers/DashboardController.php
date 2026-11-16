<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\DailyWorkLog;
use App\Models\Document;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\MonthlyReport;
use App\Models\Notification;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Senior Admin Organization-wide Dashboard Metrics.
     */
    public function adminOverview(Request $request)
    {
        $todayStr = Carbon::today()->toDateString();

        $totalBranches = Branch::where('is_active', true)->count();
        $totalEmployees = Employee::where('employment_status', 'active')->count();

        // Attendance today across organization
        $presentToday = Attendance::where('date', $todayStr)
            ->whereIn('status', ['Present', 'Late', 'Half Day'])
            ->count();
        $absentToday = max(0, $totalEmployees - $presentToday);

        // Tasks KPIs
        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'Completed')->count();
        $pendingTasks = Task::whereIn('status', ['Assigned', 'In Progress', 'Submitted', 'Rejected / Needs Revision'])->count();
        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();

        // Branch-wise attendance and performance comparison
        $branches = Branch::withCount([
            'employees as active_employees_count' => fn($q) => $q->where('employment_status', 'active'),
            'tasks as total_tasks_count',
            'tasks as completed_tasks_count' => fn($q) => $q->where('status', 'Completed'),
        ])->get()->map(function ($b) use ($todayStr) {
            $branchPresent = Attendance::where('branch_id', $b->id)
                ->where('date', $todayStr)
                ->whereIn('status', ['Present', 'Late', 'Half Day'])
                ->count();
            
            $rate = $b->active_employees_count > 0 ? round(($branchPresent / $b->active_employees_count) * 100, 1) : 0;
            $taskCompletionRate = $b->total_tasks_count > 0 ? round(($b->completed_tasks_count / $b->total_tasks_count) * 100, 1) : 0;

            return [
                'id' => $b->id,
                'name' => $b->name,
                'code' => $b->code,
                'city' => $b->city,
                'employees_count' => $b->active_employees_count,
                'present_today' => $branchPresent,
                'attendance_rate' => $rate,
                'tasks_total' => $b->total_tasks_count,
                'tasks_completed' => $b->completed_tasks_count,
                'task_completion_rate' => $taskCompletionRate,
            ];
        });

        // Recent Audit / Activities
        $recentActivities = AuditLog::with('user:id,name,role')
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        // Upcoming deadlines
        $upcomingDeadlines = Task::with(['assignee:id,first_name,last_name,employee_id', 'branch:id,name'])
            ->whereIn('status', ['Assigned', 'In Progress', 'Submitted'])
            ->orderBy('deadline', 'asc')
            ->take(6)
            ->get();

        // Pending approvals (EOM reports, Leaves, Documents awaiting review)
        $pendingReports = MonthlyReport::with('branch:id,name')
            ->where('status', 'Submitted')
            ->get();

        return response()->json([
            'kpis' => [
                'total_branches' => $totalBranches,
                'total_employees' => $totalEmployees,
                'employees_present_today' => $presentToday,
                'employees_absent_today' => $absentToday,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks' => $pendingTasks,
                'pending_leave_requests' => $pendingLeaves,
            ],
            'branches' => $branches,
            'recent_activities' => $recentActivities,
            'upcoming_deadlines' => $upcomingDeadlines,
            'pending_eom_reports' => $pendingReports,
        ]);
    }

    /**
     * Branch Manager Dashboard for Assigned Branch.
     */
    public function managerOverview(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id ?? Branch::first()?->id;
        $branch = Branch::findOrFail($branchId);
        $todayStr = Carbon::today()->toDateString();

        $branchEmployees = Employee::with('user')
            ->where('branch_id', $branchId)
            ->where('employment_status', 'active')
            ->get();

        $totalEmployees = $branchEmployees->count();

        // Today attendance records
        $todayAttendances = Attendance::where('branch_id', $branchId)
            ->where('date', $todayStr)
            ->get()
            ->keyBy('employee_id');

        $presentCount = 0;
        $absentCount = 0;
        $onLeaveCount = 0;

        foreach ($branchEmployees as $emp) {
            $att = $todayAttendances->get($emp->id);
            if ($att && in_array($att->status, ['Present', 'Late', 'Half Day'])) {
                $presentCount++;
            } elseif ($att && $att->status === 'Approved Leave') {
                $onLeaveCount++;
            } else {
                $absentCount++;
            }
        }

        // Branch Tasks
        $tasksAssigned = Task::where('branch_id', $branchId)->count();
        $tasksCompleted = Task::where('branch_id', $branchId)->where('status', 'Completed')->count();
        $tasksPending = Task::where('branch_id', $branchId)
            ->whereIn('status', ['Assigned', 'In Progress', 'Submitted', 'Rejected / Needs Revision'])
            ->count();

        // Branch Documents
        $docsInProgress = Document::where('branch_id', $branchId)->where('status', 'In Progress')->count();
        $docsAwaitingReview = Document::where('branch_id', $branchId)->where('status', 'Manager Review')->count();

        // Pending Leave Approvals
        $pendingLeaves = LeaveRequest::where('branch_id', $branchId)->where('status', 'pending')->count();

        // Employee live activity table
        $employeeActivityTable = $branchEmployees->map(function ($emp) use ($todayAttendances, $todayStr) {
            $att = $todayAttendances->get($emp->id);
            $assignedCount = Task::where('assigned_to', $emp->id)->count();
            $completedCount = Task::where('assigned_to', $emp->id)->where('status', 'Completed')->count();
            
            // Latest daily log entry for today
            $latestLog = DailyWorkLog::where('employee_id', $emp->id)
                ->where('work_date', $todayStr)
                ->latest()
                ->first();

            return [
                'employee_id' => $emp->employee_id,
                'id' => $emp->id,
                'name' => $emp->full_name,
                'designation' => $emp->designation,
                'check_in' => $att?->check_in ? substr($att->check_in, 0, 5) : null,
                'check_out' => $att?->check_out ? substr($att->check_out, 0, 5) : null,
                'attendance_status' => $att?->status ?? 'Absent',
                'working_hours' => $att?->working_hours ?? 0,
                'tasks_assigned' => $assignedCount,
                'tasks_completed' => $completedCount,
                'current_activity' => $latestLog ? ($latestLog->task_title . ' (' . $latestLog->work_status . ')') : 'No work log submitted yet',
            ];
        });

        // Pending documents list
        $pendingDocs = Document::with(['assignee:id,first_name,last_name,employee_id'])
            ->where('branch_id', $branchId)
            ->whereIn('status', ['Assigned', 'In Progress', 'Manager Review'])
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();

        // Recent Notifications for this user
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'city' => $branch->city,
                'work_start_time' => $branch->work_start_time,
                'work_end_time' => $branch->work_end_time,
            ],
            'kpis' => [
                'total_employees' => $totalEmployees,
                'present_today' => $presentCount,
                'absent_today' => $absentCount,
                'on_leave' => $onLeaveCount,
                'tasks_assigned' => $tasksAssigned,
                'tasks_completed' => $tasksCompleted,
                'tasks_pending' => $tasksPending,
                'documents_in_progress' => $docsInProgress,
                'documents_awaiting_review' => $docsAwaitingReview,
                'pending_leave_approvals' => $pendingLeaves,
            ],
            'employee_activity_table' => $employeeActivityTable,
            'pending_documents' => $pendingDocs,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Employee Personal Dashboard.
     */
    public function employeeOverview(Request $request)
    {
        $user = $request->user();
        $employee = Employee::with('branch')->where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not associated with this user.'], 404);
        }

        $todayStr = Carbon::today()->toDateString();

        // Attendance status today
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $todayStr)
            ->first();

        // Assigned Tasks
        $tasksAssigned = Task::where('assigned_to', $employee->id)->count();
        $tasksCompleted = Task::where('assigned_to', $employee->id)->where('status', 'Completed')->count();
        $tasksPending = Task::where('assigned_to', $employee->id)
            ->whereIn('status', ['Assigned', 'In Progress', 'Submitted', 'Rejected / Needs Revision'])
            ->count();

        // Today's / Upcoming deadlines
        $upcomingTasks = Task::where('assigned_to', $employee->id)
            ->whereIn('status', ['Assigned', 'In Progress', 'Rejected / Needs Revision'])
            ->with('histories')
            ->orderBy('deadline', 'asc')
            ->take(5)
            ->get();

        // Recent Manager Feedback
        $latestSummary = $employee->monthlySummaries()
            ->latest('id')
            ->first();

        $recentReviews = \App\Models\TaskReview::whereHas('task', function ($q) use ($employee) {
            $q->where('assigned_to', $employee->id);
        })->with(['reviewer:id,name', 'task:id,title,task_id'])
          ->latest()
          ->take(3)
          ->get();

        // Today's work logs submitted
        $todayWorkLogs = DailyWorkLog::where('employee_id', $employee->id)
            ->where('work_date', $todayStr)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->full_name,
                'designation' => $employee->designation,
                'department' => $employee->department,
                'branch_name' => $employee->branch?->name,
                'leave_balance' => [
                    'casual' => $employee->leave_balance_casual,
                    'sick' => $employee->leave_balance_sick,
                    'emergency' => $employee->leave_balance_emergency,
                ],
            ],
            'attendance_today' => [
                'has_checked_in' => $attendance && $attendance->check_in !== null,
                'has_checked_out' => $attendance && $attendance->check_out !== null,
                'check_in' => $attendance?->check_in ? substr($attendance->check_in, 0, 5) : null,
                'check_out' => $attendance?->check_out ? substr($attendance->check_out, 0, 5) : null,
                'status' => $attendance?->status ?? 'Not Checked In',
                'working_hours' => $attendance?->working_hours ?? 0,
            ],
            'tasks_kpi' => [
                'assigned' => $tasksAssigned,
                'completed' => $tasksCompleted,
                'pending' => $tasksPending,
            ],
            'upcoming_tasks' => $upcomingTasks,
            'recent_feedback' => [
                'monthly_remarks' => $latestSummary?->manager_remarks,
                'score' => $latestSummary?->overall_performance_score,
                'reviews' => $recentReviews,
            ],
            'today_work_logs' => $todayWorkLogs,
        ]);
    }
}
