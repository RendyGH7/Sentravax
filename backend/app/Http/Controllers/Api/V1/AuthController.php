<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Authenticate user via Sanctum SPA Session and issue an API Token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $remember = $validated['remember'] ?? false;

        if (! Auth::guard('web')->attempt(['email' => $validated['email'], 'password' => $validated['password']], $remember)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau kata sandi tidak cocok dengan data terdaftar.',
                'error' => 'INVALID_CREDENTIALS',
            ], Response::HTTP_UNAUTHORIZED);
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        // Regenerate session for SPA cookie-based protection
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Issue Sanctum Personal Access Token as hybrid / fallback support
        $token = $user->createToken('sentravax_token', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Autentikasi berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Register a new public resident account.
     * Enforces role = 'user' strictly. Never allows client role injection.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        // STRICT SECURITY: Public registration is ALWAYS forced to 'user' role
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => User::ROLE_USER,
            'email_verified_at' => now(),
        ]);

        Auth::guard('web')->login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $token = $user->createToken('sentravax_token', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi akun warga berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Get currently authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                ],
            ],
        ]);
    }

    /**
     * Terminate user session and revoke current access tokens.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user) {
            $currentToken = $user->currentAccessToken();
            // Revoke database personal access token if using Bearer token (not cookie-based TransientToken)
            if ($currentToken instanceof \Laravel\Sanctum\PersonalAccessToken) {
                $currentToken->delete();
            }
        }

        // Invalidate web session
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesi autentikasi telah diakhiri dengan aman.',
        ]);
    }

    /**
     * Dedicated endpoint for external / non-browser machine token issue.
     * Used exclusively by CLI, background daemons, or machine integrations (not browser SPA).
     */
    public function issueToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau kata sandi tidak cocok.',
                'error' => 'INVALID_CREDENTIALS',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $deviceName = $validated['device_name'] ?? 'external_client';
        $token = $user->createToken($deviceName, ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token API eksternal berhasil diterbitkan.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_at' => now()->addDays(30)->toIso8601String(),
            ],
        ]);
    }
}

