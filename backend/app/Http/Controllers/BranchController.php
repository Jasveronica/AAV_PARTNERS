<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    /**
     * List all branches.
     */
    public function index(Request $request)
    {
        $branches = Branch::withCount([
            'employees as active_employees_count' => fn($q) => $q->where('employment_status', 'active'),
            'tasks as active_tasks_count' => fn($q) => $q->whereIn('status', ['Assigned', 'In Progress', 'Submitted']),
        ])->get();

        return response()->json(['branches' => $branches]);
    }

    /**
     * Store a newly created branch (Senior Admin only).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:branches,code',
            'address' => 'nullable|string',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|email|max:255',
            'work_start_time' => 'required|string',
            'work_end_time' => 'required|string',
        ]);

        $branch = Branch::create($validated);

        AuditLog::log('CREATE_BRANCH', 'Branch', $branch->id, [
            'name' => $branch->name,
            'code' => $branch->code,
        ]);

        return response()->json([
            'message' => 'Branch created successfully.',
            'branch' => $branch,
        ], 201);
    }

    /**
     * Display branch details.
     */
    public function show($id)
    {
        $branch = Branch::with(['employees.user'])->findOrFail($id);
        return response()->json(['branch' => $branch]);
    }

    /**
     * Update branch details.
     */
    public function update(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:10|unique:branches,code,' . $branch->id,
            'address' => 'nullable|string',
            'city' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'phone' => 'nullable|string|max:25',
            'email' => 'nullable|email|max:255',
            'work_start_time' => 'sometimes|required|string',
            'work_end_time' => 'sometimes|required|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $branch->update($validated);

        AuditLog::log('UPDATE_BRANCH', 'Branch', $branch->id, $validated);

        return response()->json([
            'message' => 'Branch updated successfully.',
            'branch' => $branch,
        ]);
    }

    /**
     * Toggle active state or delete branch.
     */
    public function destroy($id)
    {
        $branch = Branch::findOrFail($id);
        $branch->is_active = false;
        $branch->save();

        AuditLog::log('DEACTIVATE_BRANCH', 'Branch', $branch->id);

        return response()->json(['message' => 'Branch deactivated successfully.']);
    }
}
