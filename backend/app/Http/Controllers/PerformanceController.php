<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Document;
use App\Models\Employee;
use App\Models\EmployeeMonthlySummary;
use App\Models\FirmSetting;
use App\Models\Task;
use App\Models\TaskReview;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    /**
     * Get performance analytics for branch or organization.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $month = (int) ($request->input('month') ?? Carbon::now()->month);
        $year = (int) ($request->input('year') ?? Carbon::now()->year);

        $query = EmployeeMonthlySummary::with(['employee.branch', 'employee.user'])
            ->where('month', $month)
            ->where('year', $year);

        if ($user->isEmployee()) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json(['summaries' => []]);
            $query->where('employee_id', $employee->id);
        } elseif ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($user->isSeniorAdmin()) {
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }
        }

        $summaries = $query->orderBy('overall_performance_score', 'desc')->get();

        // Configured weightage breakdown from FirmSettings
        $weights = [
            'task_completion' => (float) FirmSetting::get('weight_task_completion', 25),
            'work_quality' => (float) FirmSetting::get('weight_work_quality', 30),
            'deadline_management' => (float) FirmSetting::get('weight_deadline_management', 20),
            'documentation_accuracy' => (float) FirmSetting::get('weight_doc_accuracy', 15),
            'team_coordination' => (float) FirmSetting::get('weight_coordination', 10),
        ];

        return response()->json([
            'summaries' => $summaries,
            'weights' => $weights,
            'period' => ['month' => $month, 'year' => $year],
        ]);
    }

    /**
     * Compute real-time transparent performance score for an employee.
     */
    public function calculate(Request $request, $employeeId)
    {
        $employee = Employee::with('branch')->findOrFail($employeeId);
        $month = (int) ($request->input('month') ?? Carbon::now()->month);
        $year = (int) ($request->input('year') ?? Carbon::now()->year);

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        // 1. Task metrics
        $tasksQuery = Task::where('assigned_to', $employee->id)
            ->whereBetween('deadline', [$startOfMonth->toDateString(), $endOfMonth->toDateString()]);

        $tasksAssigned = $tasksQuery->count();
        $tasksCompleted = (clone $tasksQuery)->where('status', 'Completed')->count();
        $tasksPending = (clone $tasksQuery)->whereIn('status', ['Assigned', 'In Progress', 'Submitted', 'Rejected / Needs Revision'])->count();
        $tasksOverdue = (clone $tasksQuery)->where('deadline', '<', Carbon::today()->toDateString())->where('status', '!=', 'Completed')->count();

        // Task completion score (0-100)
        $taskCompletionScore = $tasksAssigned > 0 ? round(($tasksCompleted / $tasksAssigned) * 100, 2) : 90.00;

        // 2. Work quality score from verified manager reviews (1-5 scaled to 0-100)
        $reviews = TaskReview::whereHas('task', function ($q) use ($employee, $startOfMonth, $endOfMonth) {
            $q->where('assigned_to', $employee->id)
              ->whereBetween('deadline', [$startOfMonth->toDateString(), $endOfMonth->toDateString()]);
        })->get();

        $avgRating = $reviews->count() > 0 ? $reviews->avg('rating') : 4.5;
        $workQualityScore = round(($avgRating / 5.0) * 100, 2);

        // 3. Deadline management score
        $onTimeCompleted = (clone $tasksQuery)->where('status', 'Completed')
            ->whereColumn('completed_at', '<=', 'deadline')
            ->count();
        $onTimeRate = $tasksCompleted > 0 ? round(($onTimeCompleted / $tasksCompleted) * 100, 2) : 95.00;
        $deadlineScore = $onTimeRate;

        // 4. Documentation accuracy (based on rework count on documents)
        $docsQuery = Document::where('assigned_to', $employee->id)
            ->whereBetween('received_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()]);
        $docsProcessed = $docsQuery->count();
        $docsCompleted = (clone $docsQuery)->whereIn('status', ['Completed', 'Delivered'])->count();
        $totalRework = (clone $docsQuery)->sum('rework_count');
        $docAccuracyScore = max(70, round(100 - ($totalRework * 5), 2));

        // 5. Team coordination (baseline 92)
        $coordinationScore = 92.00;

        // Configurable weights
        $w1 = (float) FirmSetting::get('weight_task_completion', 25) / 100;
        $w2 = (float) FirmSetting::get('weight_work_quality', 30) / 100;
        $w3 = (float) FirmSetting::get('weight_deadline_management', 20) / 100;
        $w4 = (float) FirmSetting::get('weight_doc_accuracy', 15) / 100;
        $w5 = (float) FirmSetting::get('weight_coordination', 10) / 100;

        $overall = round(
            ($taskCompletionScore * $w1) +
            ($workQualityScore * $w2) +
            ($deadlineScore * $w3) +
            ($docAccuracyScore * $w4) +
            ($coordinationScore * $w5),
            2
        );

        return response()->json([
            'employee' => $employee,
            'calculation' => [
                'task_completion' => ['score' => $taskCompletionScore, 'weight' => $w1 * 100, 'contribution' => round($taskCompletionScore * $w1, 2)],
                'work_quality' => ['score' => $workQualityScore, 'weight' => $w2 * 100, 'contribution' => round($workQualityScore * $w2, 2)],
                'deadline_management' => ['score' => $deadlineScore, 'weight' => $w3 * 100, 'contribution' => round($deadlineScore * $w3, 2)],
                'documentation_accuracy' => ['score' => $docAccuracyScore, 'weight' => $w4 * 100, 'contribution' => round($docAccuracyScore * $w4, 2)],
                'team_coordination' => ['score' => $coordinationScore, 'weight' => $w5 * 100, 'contribution' => round($coordinationScore * $w5, 2)],
                'overall_performance_score' => $overall,
            ],
            'metrics' => [
                'tasks_assigned' => $tasksAssigned,
                'tasks_completed' => $tasksCompleted,
                'tasks_pending' => $tasksPending,
                'tasks_overdue' => $tasksOverdue,
                'on_time_rate' => $onTimeRate,
                'documents_processed' => $docsProcessed,
                'documents_completed' => $docsCompleted,
                'rework_count' => $totalRework,
            ],
        ]);
    }

    /**
     * Save manager feedback and qualitative assessment.
     */
    public function saveFeedback(Request $request, $id)
    {
        $summary = EmployeeMonthlySummary::findOrFail($id);

        $validated = $request->validate([
            'key_achievements' => 'nullable|string',
            'strengths' => 'nullable|string',
            'improvement_areas' => 'nullable|string',
            'manager_remarks' => 'nullable|string',
            'overall_review' => 'nullable|string',
        ]);

        $summary->update($validated);

        AuditLog::log('UPDATE_PERFORMANCE_FEEDBACK', 'EmployeeMonthlySummary', $summary->id);

        return response()->json([
            'message' => 'Manager feedback saved successfully.',
            'summary' => $summary,
        ]);
    }
}
