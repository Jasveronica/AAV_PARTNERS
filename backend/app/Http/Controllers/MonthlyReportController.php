<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Document;
use App\Models\Employee;
use App\Models\EmployeeMonthlySummary;
use App\Models\MonthlyReport;
use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskReview;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MonthlyReportController extends Controller
{
    /**
     * List existing monthly reports.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = MonthlyReport::with(['branch', 'creator', 'approver']);

        if ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($user->isSeniorAdmin() && $request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reports = $query->orderBy('report_year', 'desc')
                         ->orderBy('report_month', 'desc')
                         ->get();

        return response()->json(['reports' => $reports]);
    }

    /**
     * Generate or Preview EOM Report from live database records for specified month/year.
     */
    public function generate(Request $request)
    {
        $user = $request->user();
        $branchId = $user->isSeniorAdmin() ? ($request->input('branch_id') ?? Branch::first()?->id) : $user->branch_id;
        $branch = Branch::findOrFail($branchId);

        $month = (int) ($request->input('month') ?? Carbon::now()->month);
        $year = (int) ($request->input('year') ?? Carbon::now()->year);

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        // Calculate eligible working days in this month (excluding Sundays)
        $monthPeriod = CarbonPeriod::create($startOfMonth, $endOfMonth);
        $eligibleWorkingDays = 0;
        foreach ($monthPeriod as $day) {
            if (!$day->isSunday()) $eligibleWorkingDays++;
        }

        $employees = Employee::where('branch_id', $branch->id)
            ->where('employment_status', 'active')
            ->get();

        $employeeReports = [];
        $totalPresentDays = 0;
        $totalAssignedTasks = 0;
        $totalCompletedTasks = 0;
        $totalPendingTasks = 0;
        $totalDocsProcessed = 0;
        $totalDocsCompleted = 0;
        $scoreSum = 0;

        foreach ($employees as $emp) {
            // Attendance metrics
            $attRecords = Attendance::where('employee_id', $emp->id)
                ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->get();

            $presentDays = $attRecords->whereIn('status', ['Present', 'Late', 'Half Day'])->count();
            $leaveDays = $attRecords->where('status', 'Approved Leave')->count();
            $lateArrivals = $attRecords->where('status', 'Late')->count();
            $absentDays = max(0, $eligibleWorkingDays - ($presentDays + $leaveDays));
            $attPercentage = $eligibleWorkingDays > 0 ? round(($presentDays / $eligibleWorkingDays) * 100, 2) : 0;

            // Task metrics
            $tasks = Task::where('assigned_to', $emp->id)
                ->whereBetween('deadline', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->get();

            $assigned = $tasks->count();
            $completed = $tasks->where('status', 'Completed')->count();
            $pending = $tasks->whereIn('status', ['Assigned', 'In Progress', 'Submitted', 'Rejected / Needs Revision'])->count();
            $overdue = $tasks->where('deadline', '<', Carbon::today()->toDateString())->where('status', '!=', 'Completed')->count();
            
            $onTimeCompleted = $tasks->where('status', 'Completed')
                ->filter(fn($t) => $t->completed_at && Carbon::parse($t->completed_at)->lte(Carbon::parse($t->deadline)))
                ->count();
            $onTimeRate = $completed > 0 ? round(($onTimeCompleted / $completed) * 100, 2) : 100.00;

            // Document metrics
            $docs = Document::where('assigned_to', $emp->id)
                ->whereBetween('received_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->get();

            $docsProc = $docs->count();
            $docsComp = $docs->whereIn('status', ['Completed', 'Delivered'])->count();
            $reworkCount = $docs->sum('rework_count');

            // Quality rating from reviews
            $reviews = TaskReview::whereHas('task', fn($q) => $q->where('assigned_to', $emp->id)->whereBetween('deadline', [$startOfMonth->toDateString(), $endOfMonth->toDateString()]))->get();
            $workQualityScore = $reviews->count() > 0 ? round(($reviews->avg('rating') / 5.0) * 100, 2) : 92.00;

            // Pillar scores (25%, 30%, 20%, 15%, 10%)
            $taskScore = $assigned > 0 ? round(($completed / $assigned) * 100, 2) : 90.00;
            $deadlineScore = $onTimeRate;
            $docScore = max(70, round(100 - ($reworkCount * 5), 2));
            $coordinationScore = 92.00;

            $overall = round(
                ($taskScore * 0.25) +
                ($workQualityScore * 0.30) +
                ($deadlineScore * 0.20) +
                ($docScore * 0.15) +
                ($coordinationScore * 0.10),
                2
            );

            // Existing summary for custom qualitative remarks if already saved
            $existingSummary = EmployeeMonthlySummary::where('employee_id', $emp->id)
                ->where('month', $month)
                ->where('year', $year)
                ->first();

            $employeeReports[] = [
                'employee_id' => $emp->id,
                'employee_code' => $emp->employee_id,
                'name' => $emp->full_name,
                'designation' => $emp->designation,
                'department' => $emp->department,
                'working_days' => $eligibleWorkingDays,
                'present_days' => $presentDays,
                'leave_days' => $leaveDays,
                'absent_days' => $absentDays,
                'late_arrivals' => $lateArrivals,
                'attendance_percentage' => $attPercentage,
                'tasks_assigned' => $assigned,
                'tasks_completed' => $completed,
                'tasks_pending' => $pending,
                'tasks_overdue' => $overdue,
                'on_time_rate' => $onTimeRate,
                'documents_processed' => $docsProc,
                'documents_completed' => $docsComp,
                'rework_count' => $reworkCount,
                'task_completion_score' => $taskScore,
                'work_quality_score' => $workQualityScore,
                'deadline_score' => $deadlineScore,
                'documentation_accuracy_score' => $docScore,
                'coordination_score' => $coordinationScore,
                'overall_performance_score' => $overall,
                'key_achievements' => $existingSummary?->key_achievements ?? 'Demonstrated strong commitment to client briefs and timely filings.',
                'strengths' => $existingSummary?->strengths ?? 'Strong attention to legal precedents and procedure.',
                'improvement_areas' => $existingSummary?->improvement_areas ?? 'Further enhancement of rapid response to urgent briefs.',
                'manager_remarks' => $existingSummary?->manager_remarks ?? 'Consistent and valuable performance throughout the month.',
                'overall_review' => $existingSummary?->overall_review ?? 'Meets and frequently exceeds firm expectations.',
            ];

            $totalPresentDays += $presentDays;
            $totalAssignedTasks += $assigned;
            $totalCompletedTasks += $completed;
            $totalPendingTasks += $pending;
            $totalDocsProcessed += $docsProc;
            $totalDocsCompleted += $docsComp;
            $scoreSum += $overall;
        }

        $empCount = count($employees);
        $avgAttendanceRate = ($empCount * $eligibleWorkingDays) > 0 ? round(($totalPresentDays / ($empCount * $eligibleWorkingDays)) * 100, 2) : 0;
        $avgPerformanceScore = $empCount > 0 ? round($scoreSum / $empCount, 2) : 0;

        $monthName = Carbon::create($year, $month, 1)->format('F Y');

        return response()->json([
            'branch' => $branch,
            'period' => [
                'month' => $month,
                'year' => $year,
                'month_name' => $monthName,
                'eligible_working_days' => $eligibleWorkingDays,
            ],
            'branch_summary' => [
                'total_employees' => $empCount,
                'present_rate' => $avgAttendanceRate,
                'tasks_assigned' => $totalAssignedTasks,
                'tasks_completed' => $totalCompletedTasks,
                'tasks_pending' => $totalPendingTasks,
                'documents_processed' => $totalDocsProcessed,
                'documents_completed' => $totalDocsCompleted,
                'average_performance_score' => $avgPerformanceScore,
            ],
            'employee_reports' => $employeeReports,
        ]);
    }

    /**
     * Show an existing persisted monthly report with snapshots.
     */
    public function show($id)
    {
        $report = MonthlyReport::with(['branch', 'creator', 'approver', 'employeeSummaries.employee'])
            ->findOrFail($id);

        return response()->json(['report' => $report]);
    }

    /**
     * Save draft or submit EOM report.
     * Persists report and freezes snapshots in employee_monthly_summaries.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'report_month' => 'required|integer|between:1,12',
            'report_year' => 'required|integer|between:2020,2030',
            'status' => 'required|in:Draft,Submitted',
            'operational_highlights' => 'nullable|string',
            'manager_remarks' => 'nullable|string',
            'employee_reports' => 'required|array',
        ]);

        return DB::transaction(function () use ($validated, $user) {
            $branch = Branch::findOrFail($validated['branch_id']);
            $empReports = $validated['employee_reports'];

            $totalEmployees = count($empReports);
            $totalAssigned = array_sum(array_column($empReports, 'tasks_assigned'));
            $totalCompleted = array_sum(array_column($empReports, 'tasks_completed'));
            $totalPending = array_sum(array_column($empReports, 'tasks_pending'));
            $totalDocsProc = array_sum(array_column($empReports, 'documents_processed'));
            $totalDocsComp = array_sum(array_column($empReports, 'documents_completed'));
            $avgScore = $totalEmployees > 0 ? round(array_sum(array_column($empReports, 'overall_performance_score')) / $totalEmployees, 2) : 0;
            $avgPresentRate = $totalEmployees > 0 ? round(array_sum(array_column($empReports, 'attendance_percentage')) / $totalEmployees, 2) : 0;

            $report = MonthlyReport::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'report_month' => $validated['report_month'],
                    'report_year' => $validated['report_year'],
                ],
                [
                    'status' => $validated['status'],
                    'created_by' => $user->id,
                    'submitted_at' => $validated['status'] === 'Submitted' ? Carbon::now() : null,
                    'total_employees' => $totalEmployees,
                    'present_rate' => $avgPresentRate,
                    'tasks_assigned' => $totalAssigned,
                    'tasks_completed' => $totalCompleted,
                    'tasks_pending' => $totalPending,
                    'documents_processed' => $totalDocsProc,
                    'documents_completed' => $totalDocsComp,
                    'average_performance_score' => $avgScore,
                    'operational_highlights' => $validated['operational_highlights'] ?? null,
                    'manager_remarks' => $validated['manager_remarks'] ?? null,
                    'summary_data' => [
                        'branch' => $branch->only(['id', 'name', 'code', 'city']),
                        'generated_at' => Carbon::now()->toIso8601String(),
                        'employee_reports_snapshot' => $empReports,
                    ],
                ]
            );

            // Persist individual employee monthly summaries
            foreach ($empReports as $emp) {
                EmployeeMonthlySummary::updateOrCreate(
                    [
                        'employee_id' => $emp['employee_id'],
                        'month' => $validated['report_month'],
                        'year' => $validated['report_year'],
                    ],
                    [
                        'monthly_report_id' => $report->id,
                        'branch_id' => $branch->id,
                        'working_days' => $emp['working_days'] ?? 0,
                        'present_days' => $emp['present_days'] ?? 0,
                        'leave_days' => $emp['leave_days'] ?? 0,
                        'absent_days' => $emp['absent_days'] ?? 0,
                        'late_arrivals' => $emp['late_arrivals'] ?? 0,
                        'attendance_percentage' => $emp['attendance_percentage'] ?? 0,
                        'tasks_assigned' => $emp['tasks_assigned'] ?? 0,
                        'tasks_completed' => $emp['tasks_completed'] ?? 0,
                        'tasks_pending' => $emp['tasks_pending'] ?? 0,
                        'tasks_overdue' => $emp['tasks_overdue'] ?? 0,
                        'on_time_rate' => $emp['on_time_rate'] ?? 0,
                        'documents_processed' => $emp['documents_processed'] ?? 0,
                        'documents_completed' => $emp['documents_completed'] ?? 0,
                        'rework_count' => $emp['rework_count'] ?? 0,
                        'task_completion_score' => $emp['task_completion_score'] ?? 0,
                        'work_quality_score' => $emp['work_quality_score'] ?? 0,
                        'deadline_score' => $emp['deadline_score'] ?? 0,
                        'documentation_accuracy_score' => $emp['documentation_accuracy_score'] ?? 0,
                        'coordination_score' => $emp['coordination_score'] ?? 0,
                        'overall_performance_score' => $emp['overall_performance_score'] ?? 0,
                        'key_achievements' => $emp['key_achievements'] ?? null,
                        'strengths' => $emp['strengths'] ?? null,
                        'improvement_areas' => $emp['improvement_areas'] ?? null,
                        'manager_remarks' => $emp['manager_remarks'] ?? null,
                        'overall_review' => $emp['overall_review'] ?? null,
                    ]
                );
            }

            // Notify Senior Admin if submitted
            if ($validated['status'] === 'Submitted') {
                $admins = User::where('role', 'senior_admin')->get();
                foreach ($admins as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'title' => 'EOM Report Submitted for Approval',
                        'message' => "EOM Report for {$branch->name} ({$validated['report_month']}/{$validated['report_year']}) submitted by {$user->name}.",
                        'type' => 'eom_report',
                        'link' => '/reports',
                    ]);
                }
            }

            AuditLog::log('SAVE_EOM_REPORT', 'MonthlyReport', $report->id, [
                'status' => $validated['status'],
                'branch' => $branch->name,
            ]);

            return response()->json([
                'message' => "End-of-Month report " . ($validated['status'] === 'Submitted' ? 'submitted to Senior Admin.' : 'saved as draft.'),
                'report' => $report->load(['branch', 'creator', 'employeeSummaries.employee']),
            ]);
        });
    }

    /**
     * Senior Admin approves or rejects EOM report.
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isSeniorAdmin()) {
            return response()->json(['message' => 'Only Senior Admin can approve monthly reports.'], 403);
        }

        $report = MonthlyReport::with(['branch', 'creator'])->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:Approved,Rejected',
            'admin_feedback' => 'nullable|string',
        ]);

        $report->update([
            'status' => $validated['status'],
            'approved_by' => $user->id,
            'approved_at' => Carbon::now(),
            'admin_feedback' => $validated['admin_feedback'] ?? null,
        ]);

        // Notify Branch Manager
        Notification::create([
            'user_id' => $report->created_by,
            'title' => "EOM Report {$validated['status']}",
            'message' => "Your EOM Report for {$report->branch->name} ({$report->report_month}/{$report->report_year}) has been {$validated['status']} by Senior Admin.",
            'type' => 'eom_report',
            'link' => '/reports',
        ]);

        AuditLog::log('APPROVE_EOM_REPORT', 'MonthlyReport', $report->id, [
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => "EOM report {$validated['status']} successfully.",
            'report' => $report->load(['approver']),
        ]);
    }

    /**
     * Export professional PDF report using DomPDF.
     */
    public function exportPdf($id)
    {
        $report = MonthlyReport::with(['branch', 'creator', 'approver', 'employeeSummaries.employee'])->findOrFail($id);
        $monthName = Carbon::create($report->report_year, $report->report_month, 1)->format('F Y');

        $data = [
            'report' => $report,
            'branch' => $report->branch,
            'monthName' => $monthName,
            'summaries' => $report->employeeSummaries,
        ];

        $pdf = Pdf::loadView('reports.eom_pdf', $data)
            ->setPaper('a4', 'portrait');

        $filename = "AAV_Partners_EOM_{$report->branch->code}_{$report->report_year}_{$report->report_month}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Export spreadsheet / CSV.
     */
    public function exportExcel($id)
    {
        $report = MonthlyReport::with(['branch', 'employeeSummaries.employee'])->findOrFail($id);
        $monthName = Carbon::create($report->report_year, $report->report_month, 1)->format('F Y');
        $filename = "AAV_Partners_EOM_{$report->branch->code}_{$report->report_year}_{$report->report_month}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($report, $monthName) {
            $handle = fopen('php://output', 'w');

            // Header banner
            fputcsv($handle, ['AAV PARTNERS LAW FIRM - END OF MONTH REPORT']);
            fputcsv($handle, ['Branch:', $report->branch->name, 'Period:', $monthName, 'Status:', $report->status]);
            fputcsv($handle, ['Total Employees:', $report->total_employees, 'Avg Attendance %:', $report->present_rate . '%', 'Avg Score:', $report->average_performance_score . '/100']);
            fputcsv($handle, []);

            // Table headers
            fputcsv($handle, [
                'Employee ID',
                'Full Name',
                'Designation',
                'Working Days',
                'Present Days',
                'Leave Days',
                'Late Arrivals',
                'Attendance %',
                'Tasks Assigned',
                'Tasks Completed',
                'Tasks Pending',
                'On-Time %',
                'Docs Completed',
                'Rework Count',
                'Task Score (25%)',
                'Quality Score (30%)',
                'Deadline Score (20%)',
                'Doc Accuracy (15%)',
                'Coordination (10%)',
                'Overall Performance Score',
                'Manager Remarks',
            ]);

            foreach ($report->employeeSummaries as $s) {
                fputcsv($handle, [
                    $s->employee?->employee_id,
                    $s->employee?->full_name,
                    $s->employee?->designation,
                    $s->working_days,
                    $s->present_days,
                    $s->leave_days,
                    $s->late_arrivals,
                    $s->attendance_percentage . '%',
                    $s->tasks_assigned,
                    $s->tasks_completed,
                    $s->tasks_pending,
                    $s->on_time_rate . '%',
                    $s->documents_completed,
                    $s->rework_count,
                    $s->task_completion_score,
                    $s->work_quality_score,
                    $s->deadline_score,
                    $s->documentation_accuracy_score,
                    $s->coordination_score,
                    $s->overall_performance_score,
                    $s->manager_remarks,
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}
