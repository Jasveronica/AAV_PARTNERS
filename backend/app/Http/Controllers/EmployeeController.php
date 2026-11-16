<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    /**
     * List employees with filtering and search.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Employee::with(['branch', 'user', 'reportingManager']);

        // Data isolation: Branch Manager only views own branch
        if ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($request->filled('branch_id') && $user->isSeniorAdmin()) {
            $query->where('branch_id', $request->branch_id);
        }

        // Search by name, employee_id, email, or designation
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('employee_id', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('designation', 'like', "%{$s}%");
            });
        }

        // Filter by employment_status
        if ($request->filled('status')) {
            $query->where('employment_status', $request->status);
        }

        // Filter by department
        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        $employees = $query->orderBy('first_name', 'asc')->get();

        return response()->json(['employees' => $employees]);
    }

    /**
     * Create a new employee along with user login account.
     * Uses automatic branch-based employee ID generation: AAV-{BRANCH_CODE}-{SEQ}
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Branch determination
        $branchId = $user->isSeniorAdmin() ? $request->input('branch_id') : $user->branch_id;
        $branch = Branch::findOrFail($branchId);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email|unique:employees,email',
            'phone' => 'nullable|string|max:25',
            'designation' => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'joining_date' => 'required|date',
            'role' => 'required|in:employee,branch_manager',
            'reporting_manager_id' => 'nullable|exists:users,id',
            'emergency_contact' => 'nullable|string|max:100',
            'password' => 'required|string|min:8',
        ]);

        return DB::transaction(function () use ($validated, $branch, $user) {
            // Generate unique branch-based Employee ID: e.g. AAV-TNV-005
            $count = Employee::where('branch_id', $branch->id)->count() + 1;
            $codeSeq = str_pad($count, 3, '0', STR_PAD_LEFT);
            $generatedEmpId = "AAV-{$branch->code}-{$codeSeq}";

            // Ensure uniqueness
            while (Employee::where('employee_id', $generatedEmpId)->exists()) {
                $count++;
                $codeSeq = str_pad($count, 3, '0', STR_PAD_LEFT);
                $generatedEmpId = "AAV-{$branch->code}-{$codeSeq}";
            }

            // Create User Account
            $newUser = User::create([
                'name' => "{$validated['first_name']} {$validated['last_name']}",
                'email' => $validated['email'],
                'employee_id_code' => $generatedEmpId,
                'role' => $validated['role'],
                'branch_id' => $branch->id,
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'is_active' => true,
            ]);

            // Create Employee Record
            $employee = Employee::create([
                'user_id' => $newUser->id,
                'branch_id' => $branch->id,
                'employee_id' => $generatedEmpId,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'designation' => $validated['designation'],
                'department' => $validated['department'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'],
                'joining_date' => $validated['joining_date'],
                'employment_status' => 'active',
                'reporting_manager_id' => $validated['reporting_manager_id'] ?? $user->id,
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'leave_balance_casual' => 12,
                'leave_balance_sick' => 10,
                'leave_balance_emergency' => 5,
            ]);

            AuditLog::log('CREATE_EMPLOYEE', 'Employee', $employee->id, [
                'employee_id' => $generatedEmpId,
                'name' => $employee->full_name,
                'branch' => $branch->name,
            ]);

            return response()->json([
                'message' => 'Employee and login credentials created successfully.',
                'employee' => $employee->load(['branch', 'user', 'reportingManager']),
            ], 201);
        });
    }

    /**
     * Show detailed employee profile with attendance, tasks, and performance histories.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::with(['branch', 'user', 'reportingManager'])->findOrFail($id);

        // Branch Isolation check
        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$employee->branch_id) {
            return response()->json(['message' => 'Branch data isolation: Access denied.'], 403);
        }

        // Attendance history (past 30 records)
        $attendances = $employee->attendances()
            ->orderBy('date', 'desc')
            ->take(30)
            ->get();

        // Tasks history
        $tasks = $employee->tasks()
            ->with('reviews')
            ->orderBy('deadline', 'desc')
            ->take(15)
            ->get();

        // Performance Summaries
        $performanceSummaries = $employee->monthlySummaries()
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json([
            'employee' => $employee,
            'attendances' => $attendances,
            'tasks' => $tasks,
            'performance_history' => $performanceSummaries,
        ]);
    }

    /**
     * Update employee profile.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$employee->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'phone' => 'nullable|string|max:25',
            'designation' => 'sometimes|required|string|max:100',
            'department' => 'sometimes|required|string|max:100',
            'employment_status' => 'sometimes|required|in:active,on_leave,probation,inactive',
            'reporting_manager_id' => 'nullable|exists:users,id',
            'emergency_contact' => 'nullable|string|max:100',
            'leave_balance_casual' => 'sometimes|integer|min:0',
            'leave_balance_sick' => 'sometimes|integer|min:0',
            'leave_balance_emergency' => 'sometimes|integer|min:0',
        ]);

        $employee->update($validated);

        // Update corresponding User name and phone if altered
        if (isset($validated['first_name']) || isset($validated['last_name'])) {
            $employee->user->update([
                'name' => "{$employee->first_name} {$employee->last_name}",
                'phone' => $employee->phone,
            ]);
        }

        AuditLog::log('UPDATE_EMPLOYEE', 'Employee', $employee->id, $validated);

        return response()->json([
            'message' => 'Employee profile updated successfully.',
            'employee' => $employee->load(['branch', 'user', 'reportingManager']),
        ]);
    }

    /**
     * Activate or Deactivate employee.
     */
    public function deactivate(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$employee->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $newStatus = $employee->employment_status === 'active' ? 'inactive' : 'active';
        $employee->employment_status = $newStatus;
        $employee->save();

        if ($employee->user) {
            $employee->user->is_active = ($newStatus === 'active');
            $employee->user->save();
        }

        AuditLog::log('TOGGLE_EMPLOYEE_STATUS', 'Employee', $employee->id, ['status' => $newStatus]);

        return response()->json([
            'message' => "Employee status changed to {$newStatus}.",
            'employee' => $employee,
        ]);
    }

    /**
     * Delete an employee (Manager / Admin).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot delete staff records.'], 403);
        }

        $employee = Employee::findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$employee->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        // Check if employee has active pending tasks
        $activeTasks = $employee->tasks()->whereIn('status', ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'NEEDS_REVISION'])->count();
        if ($activeTasks > 0) {
            return response()->json([
                'message' => "Cannot delete employee: {$employee->full_name} has {$activeTasks} active brief(s). Please reassign them first.",
            ], 422);
        }

        $name = $employee->full_name;
        $empCode = $employee->employee_id;

        // Deactivate user account
        if ($employee->user) {
            $employee->user->is_active = false;
            $employee->user->save();
        }

        $employee->delete();

        AuditLog::log('DELETE_EMPLOYEE', 'Employee', $id, [
            'name' => $name,
            'employee_id' => $empCode,
        ]);

        return response()->json([
            'message' => "Employee {$name} ({$empCode}) removed from active branch directory.",
        ]);
    }
}
