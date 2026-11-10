<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Autentikasi diperlukan untuk mengakses sumber daya ini.',
                'error' => 'UNAUTHENTICATED',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (empty($roles)) {
            return $next($request);
        }

        if (! $user->hasRole($roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Akun Anda tidak memiliki otoritas peran yang sesuai untuk area ini.',
                'error' => 'FORBIDDEN_ROLE',
                'meta' => [
                    'current_role' => $user->role,
                    'required_roles' => $roles,
                ],
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}

