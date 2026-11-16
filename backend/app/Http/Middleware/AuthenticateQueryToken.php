<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateQueryToken
{
    /**
     * Handle an incoming request.
     * If request contains a token query parameter and no Bearer header, convert it to Authorization header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('token') && !$request->bearerToken()) {
            $token = $request->query('token');
            if (!empty($token)) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
