<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\FirmSetting;
use App\Models\Holiday;
use App\Models\LeaveType;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get all organization settings.
     */
    public function index()
    {
        $settings = FirmSetting::all()->keyBy('key');
        $holidays = Holiday::with('branch')->orderBy('date', 'asc')->get();
        $leaveTypes = LeaveType::all();
        $branches = Branch::all();

        return response()->json([
            'settings' => $settings,
            'holidays' => $holidays,
            'leave_types' => $leaveTypes,
            'branches' => $branches,
        ]);
    }

    /**
     * Update firm settings (Senior Admin).
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            FirmSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        AuditLog::log('UPDATE_FIRM_SETTINGS', 'FirmSetting', null, $validated['settings']);

        return response()->json(['message' => 'Firm settings updated successfully.']);
    }

    /**
     * Create or update holiday.
     */
    public function createHoliday(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'type' => 'required|in:National,State,Branch,Restricted',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::create($validated);

        AuditLog::log('CREATE_HOLIDAY', 'Holiday', $holiday->id, $validated);

        return response()->json([
            'message' => 'Holiday added successfully.',
            'holiday' => $holiday->load('branch'),
        ], 201);
    }

    /**
     * Delete holiday.
     */
    public function deleteHoliday($id)
    {
        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        AuditLog::log('DELETE_HOLIDAY', 'Holiday', $id);

        return response()->json(['message' => 'Holiday removed successfully.']);
    }
}
