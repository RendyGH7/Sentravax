<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * List registered users with role and search filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->select(['id', 'name', 'email', 'role', 'phone', 'created_at', 'updated_at']);

        if ($request->has('role') && in_array($request->query('role'), ['admin', 'intelligence', 'user'])) {
            $query->where('role', $request->query('role'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', $search)
                  ->orWhere('email', 'ilike', $search);
            });
        }

        $users = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengguna berhasil dimuat.',
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Create a new system user directly from the Admin console.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', Rule::in(['admin', 'intelligence', 'user'])],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$user->name} ({$user->role}) berhasil didaftarkan.",
            'data' => $user->only(['id', 'name', 'email', 'role', 'phone', 'created_at']),
        ], 201);
    }

    /**
     * Get details of a single user.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::withCount(['communityReports', 'savedRegions', 'notifications'])
            ->find($id);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail pengguna berhasil dimuat.',
            'data' => $user,
        ]);
    }

    /**
     * Update a user's role and profile.
     * Enforces the 3 canonical roles: admin, intelligence, user.
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'intelligence', 'user'])],
        ]);

        // Safety check: Cannot demote oneself if currently logged in as this admin
        if ($user->id === $request->user()->id && $validated['role'] !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menurunkan role akun admin Anda sendiri.',
            ], 422);
        }

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Role pengguna {$user->name} berhasil diubah menjadi {$user->role}.",
            'data' => $user->only(['id', 'name', 'email', 'role', 'updated_at']),
        ]);
    }

    /**
     * Delete user account.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$user->name} berhasil dihapus.",
        ]);
    }
}

