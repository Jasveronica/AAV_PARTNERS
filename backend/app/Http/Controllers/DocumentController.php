<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Document;
use App\Models\DocumentHistory;
use App\Models\Employee;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentController extends Controller
{
    /**
     * List documents with confidentiality filtering and role scoping.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Document::with(['branch', 'assignee.user', 'history.user']);

        // Data isolation
        if ($user->isEmployee()) {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json(['documents' => []]);
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
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('reference_number', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%")
                  ->orWhere('client_reference', 'like', "%{$s}%");
            });
        }

        $documents = $query->orderBy('due_date', 'asc')->get();

        // Confidential client masking for non-assigned staff
        if ($user->isEmployee()) {
            $documents->transform(function ($doc) use ($user) {
                if ($doc->is_confidential && $doc->assignee?->user_id !== $user->id) {
                    $doc->client_reference = '[CONFIDENTIAL CLIENT MATTER]';
                }
                return $doc;
            });
        }

        return response()->json([
            'documents' => $documents,
            'summary' => [
                'total' => $documents->count(),
                'received' => $documents->where('status', 'Received')->count(),
                'assigned' => $documents->where('status', 'Assigned')->count(),
                'in_progress' => $documents->where('status', 'In Progress')->count(),
                'manager_review' => $documents->where('status', 'Manager Review')->count(),
                'completed' => $documents->where('status', 'Completed')->count(),
                'delivered' => $documents->where('status', 'Delivered')->count(),
            ],
        ]);
    }

    /**
     * Store new legal document reference (Manager / Admin).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot register new documents.'], 403);
        }

        $branchId = $user->isSeniorAdmin() ? $request->input('branch_id') : $user->branch_id;
        $branch = Branch::findOrFail($branchId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'client_reference' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|exists:employees,id',
            'received_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:received_date',
            'priority' => 'required|in:Low,Medium,High,Urgent',
            'is_confidential' => 'boolean',
            'manager_remarks' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $branch, $user) {
            $year = Carbon::now()->year;
            $count = Document::where('branch_id', $branch->id)->count() + 101;
            $refNumber = "DOC-{$branch->code}-{$year}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
            while (Document::where('reference_number', $refNumber)->exists()) {
                $count++;
                $refNumber = "DOC-{$branch->code}-{$year}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
            }

            $initialStatus = !empty($validated['assigned_to']) ? 'Assigned' : 'Received';

            $document = Document::create([
                'reference_number' => $refNumber,
                'title' => $validated['title'],
                'category' => $validated['category'],
                'client_reference' => $validated['client_reference'] ?? null,
                'branch_id' => $branch->id,
                'assigned_to' => $validated['assigned_to'] ?? null,
                'received_date' => $validated['received_date'],
                'due_date' => $validated['due_date'],
                'priority' => $validated['priority'],
                'status' => $initialStatus,
                'is_confidential' => $validated['is_confidential'] ?? false,
                'manager_remarks' => $validated['manager_remarks'] ?? null,
            ]);

            // Record initial history
            DocumentHistory::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'action' => 'Document Intake Registered',
                'previous_status' => null,
                'new_status' => $initialStatus,
                'notes' => "Reference {$refNumber} registered under category {$validated['category']}.",
            ]);

            // Notify assigned employee if applicable
            if (!empty($validated['assigned_to'])) {
                $assignee = Employee::find($validated['assigned_to']);
                if ($assignee?->user_id) {
                    Notification::create([
                        'user_id' => $assignee->user_id,
                        'title' => 'Legal Document Assigned',
                        'message' => "Document {$refNumber} ({$document->title}) assigned to you.",
                        'type' => 'document',
                        'link' => '/documents',
                    ]);
                }
            }

            AuditLog::log('CREATE_DOCUMENT', 'Document', $document->id, [
                'reference_number' => $refNumber,
                'title' => $document->title,
            ]);

            return response()->json([
                'message' => 'Legal document registered successfully.',
                'document' => $document->load(['branch', 'assignee', 'history.user']),
            ], 201);
        });
    }

    /**
     * Show document details with full workflow history.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::with(['branch', 'assignee.user', 'history.user'])->findOrFail($id);

        if ($user->isEmployee() && $document->assigned_to !== $user->employee?->id) {
            return response()->json(['message' => 'Restricted document: Access denied.'], 403);
        }

        if ($user->isEmployee() && $document->is_confidential && $document->assigned_to !== $user->employee?->id) {
            $document->client_reference = '[CONFIDENTIAL CLIENT MATTER]';
        }

        return response()->json(['document' => $document]);
    }

    /**
     * Edit document parameters (Manager / Admin).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot edit document records.'], 403);
        }

        $document = Document::with(['branch', 'assignee'])->findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$document->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'client_reference' => 'nullable|string|max:255',
            'assigned_to' => 'nullable|exists:employees,id',
            'due_date' => 'sometimes|required|date',
            'priority' => 'sometimes|required|in:Low,Medium,High,Urgent',
            'is_confidential' => 'boolean',
            'manager_remarks' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($document, $validated, $user) {
            $prevAssigneeId = $document->assigned_to;
            $document->update($validated);

            $action = 'Document Details Updated';
            $notes = 'Document metadata updated by manager.';

            if (isset($validated['assigned_to']) && (int)$validated['assigned_to'] !== (int)$prevAssigneeId) {
                $newAssignee = Employee::find($validated['assigned_to']);
                $action = 'Document Reassigned';
                $notes = "Document reassigned to {$newAssignee?->full_name}.";

                if ($document->status === 'Received') {
                    $document->update(['status' => 'Assigned']);
                }

                if ($newAssignee?->user_id) {
                    Notification::create([
                        'user_id' => $newAssignee->user_id,
                        'title' => 'Document Brief Reassigned',
                        'message' => "Document {$document->reference_number} ({$document->title}) has been assigned to you.",
                        'type' => 'document',
                        'link' => '/documents',
                    ]);
                }
            }

            DocumentHistory::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'action' => $action,
                'previous_status' => $document->status,
                'new_status' => $document->status,
                'notes' => $notes,
            ]);

            AuditLog::log('UPDATE_DOCUMENT', 'Document', $document->id, $validated);

            return response()->json([
                'message' => 'Document details updated successfully.',
                'document' => $document->load(['branch', 'assignee', 'history.user']),
            ]);
        });
    }

    /**
     * Update document workflow status.
     * Managers can transition to any status.
     * Employees can only update their assigned documents to "In Progress" or "Manager Review".
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::with('assignee')->findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$document->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        // Employee Permission Check
        if ($user->isEmployee()) {
            if ($document->assigned_to !== $user->employee?->id) {
                return response()->json(['message' => 'You can only update documents assigned to you.'], 403);
            }

            $validated = $request->validate([
                'status' => 'required|in:In Progress,Manager Review',
                'notes' => 'required|string|min:3',
            ]);
        } else {
            // Manager / Admin validation
            $validated = $request->validate([
                'status' => 'required|in:Received,Assigned,In Progress,Manager Review,Completed,Delivered',
                'notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:employees,id',
                'manager_remarks' => 'nullable|string',
            ]);
        }

        return DB::transaction(function () use ($document, $validated, $user) {
            $prevStatus = $document->status;
            $newStatus = $validated['status'];

            $updateData = ['status' => $newStatus];
            if (isset($validated['assigned_to'])) {
                $updateData['assigned_to'] = $validated['assigned_to'];
            }
            if (isset($validated['manager_remarks'])) {
                $updateData['manager_remarks'] = $validated['manager_remarks'];
            }
            if ($newStatus === 'Completed' || $newStatus === 'Delivered') {
                $updateData['completion_date'] = Carbon::today()->toDateString();
            }

            $document->update($updateData);

            // Record in document history
            DocumentHistory::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'action' => "Status transitioned to {$newStatus}",
                'previous_status' => $prevStatus,
                'new_status' => $newStatus,
                'notes' => $validated['notes'] ?? "Status updated by {$user->name}.",
            ]);

            // Notify Assignee if status changed by Manager
            if ($user->isBranchManager() && $document->assignee?->user_id && $document->assignee->user_id !== $user->id) {
                Notification::create([
                    'user_id' => $document->assignee->user_id,
                    'title' => "Document Status: {$newStatus}",
                    'message' => "Document {$document->reference_number} is now marked as {$newStatus}.",
                    'type' => 'document',
                    'link' => '/documents',
                ]);
            }

            // Notify Manager if submitted for review by Employee
            if ($user->isEmployee() && $newStatus === 'Manager Review') {
                $manager = \App\Models\User::where('branch_id', $document->branch_id)
                    ->where('role', 'branch_manager')
                    ->first();
                if ($manager) {
                    Notification::create([
                        'user_id' => $manager->id,
                        'title' => 'Document Submitted for Partner Review',
                        'message' => "{$user->name} submitted {$document->reference_number} ({$document->title}) for partner review.",
                        'type' => 'document',
                        'link' => '/documents',
                    ]);
                }
            }

            AuditLog::log('UPDATE_DOCUMENT_STATUS', 'Document', $document->id, [
                'previous' => $prevStatus,
                'new' => $newStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'message' => "Document status updated to {$newStatus}.",
                'document' => $document->load(['branch', 'assignee', 'history.user']),
            ]);
        });
    }

    /**
     * Delete document (Manager / Admin).
     * Cannot delete Delivered or Completed legal documents.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->isEmployee()) {
            return response()->json(['message' => 'Employees cannot delete documents.'], 403);
        }

        $document = Document::findOrFail($id);

        if (!$user->isSeniorAdmin() && (int)$user->branch_id !== (int)$document->branch_id) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if (in_array($document->status, ['Completed', 'Delivered'])) {
            return response()->json([
                'message' => 'Delivered and Completed documents cannot be deleted as they form part of official client records.',
            ], 422);
        }

        $ref = $document->reference_number;
        $document->delete();

        AuditLog::log('DELETE_DOCUMENT', 'Document', $id, [
            'reference_number' => $ref,
        ]);

        return response()->json([
            'message' => "Document {$ref} deleted successfully.",
        ]);
    }
}
