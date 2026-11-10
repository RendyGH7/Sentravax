<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    /**
     * Test health check remains operational.
     */
    public function test_health_check_endpoint(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'application' => 'SENTRAVAX',
                    'status' => 'operational',
                    'database' => 'connected',
                ],
            ]);
    }

    /**
     * Test login with invalid credentials fails with 401.
     */
    public function test_login_with_invalid_credentials_returns_401(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'unknown@sentravax.id',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => 'INVALID_CREDENTIALS',
            ]);
    }

    /**
     * Test login with valid seeded admin credentials succeeds.
     */
    public function test_login_with_valid_credentials_returns_token_and_user(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@sentravax.go.id',
            'password' => 'Sentravax2026!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'admin@sentravax.go.id',
                        'role' => 'admin',
                    ],
                    'token_type' => 'Bearer',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Test public registration strictly forces role = 'user'
     * even if attacker attempts to inject role = 'admin'.
     */
    public function test_public_registration_forces_user_role(): void
    {
        $uniqueEmail = 'warga_' . uniqid() . '@example.com';

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Warga Baru',
            'email' => $uniqueEmail,
            'password' => 'Password123!',
            'role' => 'admin', // Attack attempt to escalate privilege
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => 'Warga Baru',
                        'email' => $uniqueEmail,
                        'role' => User::ROLE_USER, // Strictly forced to 'user'!
                    ],
                ],
            ]);

        $user = User::where('email', $uniqueEmail)->first();
        $this->assertNotNull($user);
        $this->assertEquals(User::ROLE_USER, $user->role);
    }

    /**
     * Test GET /api/v1/auth/me returns authenticated user profile.
     */
    public function test_auth_me_returns_current_user(): void
    {
        $user = User::where('email', 'analyst@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'analyst@sentravax.go.id',
                        'role' => 'analyst',
                    ],
                ],
            ]);
    }

    /**
     * Test server-side role authorization blocks non-admin from admin routes.
     */
    public function test_role_middleware_blocks_user_from_admin_area(): void
    {
        $user = User::where('email', 'user@sentravax.id')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/ping');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN_ROLE',
            ]);
    }

    /**
     * Test server-side role authorization permits admin to access admin routes.
     */
    public function test_role_middleware_permits_admin(): void
    {
        $admin = User::where('email', 'admin@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/ping');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Otorisasi Konsol Admin terverifikasi.',
            ]);
    }

    /**
     * Test role middleware permits super_admin to access all staff routes.
     */
    public function test_super_admin_has_full_staff_access(): void
    {
        $superAdmin = User::where('email', 'superadmin@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/v1/admin/ping')->assertStatus(200);
        $this->getJson('/api/v1/intel/ping')->assertStatus(200);
        $this->getJson('/api/v1/user/ping')->assertStatus(200);
    }

    /**
     * Test logout terminates session.
     */
    public function test_logout_succeeds(): void
    {
        $user = User::where('email', 'user@sentravax.id')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}

