<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBranchAccess
{
    /**
     * Handle an incoming request.
     * Ensures managers & employees only query/update records within their branch.
     * Senior Admins have organization-wide access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Senior Admin has global branch access
        if ($user->isSeniorAdmin()) {
            return $next($request);
        }

        // For Manager or Employee, verify branch_id in route parameters or query/body
        $requestedBranchId = $request->route('branchId') 
            ?? $request->route('branch') 
            ?? $request->input('branch_id') 
            ?? $request->query('branch_id');

        if ($requestedBranchId && (int)$requestedBranchId !== (int)$user->branch_id) {
            return response()->json([
                'message' => 'Branch data isolation: You cannot access or modify records of another branch.',
            ], 403);
        }

        return $next($request);
    }
}
