<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\DailyWorkLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\MonthlyReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TaskController;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Health Check & Auth
Route::get('/ping', function () {
    return response()->json([
        'name' => 'AAV PARTNERS Law Firm Management API',
        'status' => 'operational',
        'version' => '1.0.0',
        'server_time' => now()->toIso8601String(),
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

// Protected API Routes (Authenticated via Laravel Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Current User & Auth
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/update-password', [AuthController::class, 'updatePassword']);

    // Dashboards
    Route::get('/dashboard/admin', [DashboardController::class, 'adminOverview'])->middleware('role:senior_admin');
    Route::get('/dashboard/manager', [DashboardController::class, 'managerOverview'])->middleware('role:senior_admin,branch_manager');
    Route::get('/dashboard/employee', [DashboardController::class, 'employeeOverview']);

    // Branches
    Route::get('/branches', [BranchController::class, 'index']);
    Route::post('/branches', [BranchController::class, 'store'])->middleware('role:senior_admin');
    Route::get('/branches/{id}', [BranchController::class, 'show']);
    Route::put('/branches/{id}', [BranchController::class, 'update'])->middleware('role:senior_admin');
    Route::delete('/branches/{id}', [BranchController::class, 'destroy'])->middleware('role:senior_admin');

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index'])->middleware('role:senior_admin,branch_manager');
    Route::post('/employees', [EmployeeController::class, 'store'])->middleware('role:senior_admin,branch_manager');
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update'])->middleware('role:senior_admin,branch_manager');
    Route::post('/employees/{id}/deactivate', [EmployeeController::class, 'deactivate'])->middleware('role:senior_admin,branch_manager');
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy'])->middleware('role:senior_admin,branch_manager');

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendance/corrections', [AttendanceController::class, 'corrections']);
    Route::post('/attendance/corrections', [AttendanceController::class, 'requestCorrection']);
    Route::post('/attendance/corrections/{id}/review', [AttendanceController::class, 'reviewCorrection'])->middleware('role:senior_admin,branch_manager');

    // Daily Work Sheets
    Route::get('/work-logs', [DailyWorkLogController::class, 'index']);
    Route::post('/work-logs', [DailyWorkLogController::class, 'store']);
    Route::put('/work-logs/{id}', [DailyWorkLogController::class, 'update']);
    Route::post('/work-logs/{id}/submit', [DailyWorkLogController::class, 'submit']);
    Route::delete('/work-logs/{id}', [DailyWorkLogController::class, 'destroy']);
    Route::post('/work-logs/{id}/review', [DailyWorkLogController::class, 'review'])->middleware('role:senior_admin,branch_manager');

    // Task Management
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('role:senior_admin,branch_manager');
    Route::get('/tasks/{id}', [TaskController::class, 'show']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::post('/tasks/{id}/submit', [TaskController::class, 'submitWork']);
    Route::post('/tasks/{id}/review', [TaskController::class, 'review'])->middleware('role:senior_admin,branch_manager');
    Route::post('/tasks/{id}/request-update', [TaskController::class, 'requestUpdate'])->middleware('role:senior_admin,branch_manager');
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])->middleware('role:senior_admin,branch_manager');

    // Legal Document Tracking
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store'])->middleware('role:senior_admin,branch_manager');
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::put('/documents/{id}', [DocumentController::class, 'update'])->middleware('role:senior_admin,branch_manager');
    Route::post('/documents/{id}/status', [DocumentController::class, 'updateStatus']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy'])->middleware('role:senior_admin,branch_manager');

    // Leave Management
    Route::get('/leave-types', [LeaveController::class, 'types']);
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'apply']);
    Route::post('/leaves/{id}/review', [LeaveController::class, 'review'])->middleware('role:senior_admin,branch_manager');
    Route::post('/leaves/{id}/cancel', [LeaveController::class, 'cancel']);

    // Performance Analytics
    Route::get('/performance', [PerformanceController::class, 'index']);
    Route::get('/performance/calculate/{employeeId}', [PerformanceController::class, 'calculate']);
    Route::post('/performance/{summaryId}/feedback', [PerformanceController::class, 'saveFeedback'])->middleware('role:senior_admin,branch_manager');

    // EOM Reports
    Route::get('/reports', [MonthlyReportController::class, 'index']);
    Route::get('/reports/generate', [MonthlyReportController::class, 'generate'])->middleware('role:senior_admin,branch_manager');
    Route::get('/reports/{id}', [MonthlyReportController::class, 'show']);
    Route::post('/reports', [MonthlyReportController::class, 'store'])->middleware('role:senior_admin,branch_manager');
    Route::post('/reports/{id}/approve', [MonthlyReportController::class, 'approve'])->middleware('role:senior_admin');
    Route::get('/reports/{id}/pdf', [MonthlyReportController::class, 'exportPdf']);
    Route::get('/reports/{id}/excel', [MonthlyReportController::class, 'exportExcel']);

    // In-App Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Audit Logs (Senior Admin)
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('role:senior_admin');

    // Settings (Firm configuration)
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update'])->middleware('role:senior_admin');
    Route::post('/settings/holidays', [SettingsController::class, 'createHoliday'])->middleware('role:senior_admin');
    Route::delete('/settings/holidays/{id}', [SettingsController::class, 'deleteHoliday'])->middleware('role:senior_admin');
});
