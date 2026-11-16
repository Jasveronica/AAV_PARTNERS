<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user login via Email or Employee ID.
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = trim($request->input('login'));
        $password = $request->input('password');

        // Allow login by email or employee_id_code
        $user = User::where('email', $login)
            ->orWhere('employee_id_code', $login)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials. Please verify your Email/Employee ID and Password.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account is deactivated. Please contact organizational administration.',
            ], 403);
        }

        // Generate Sanctum Token
        $token = $user->createToken('aav-partners-token')->plainTextToken;

        // Log audit event
        AuditLog::log('LOGIN', 'User', $user->id, [
            'login' => $login,
            'role' => $user->role,
            'branch_id' => $user->branch_id,
        ], $user->id, $user->branch_id);

        $user->load(['branch', 'employee']);

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employee_id_code' => $user->employee_id_code,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch' => $user->branch,
                'employee' => $user->employee,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    /**
     * Get current authenticated user details.
     */
    public function user(Request $request)
    {
        $user = $request->user()->load(['branch', 'employee']);
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employee_id_code' => $user->employee_id_code,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch' => $user->branch,
                'employee' => $user->employee,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    /**
     * Logout and revoke token.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            AuditLog::log('LOGOUT', 'User', $user->id);
            $user->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Update password.
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password does not match.'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        AuditLog::log('PASSWORD_CHANGED', 'User', $user->id);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
