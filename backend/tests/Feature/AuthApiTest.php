<?php

namespace Tests\Feature;

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\SentravaxMasterSeeder::class);
    }

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
                        'role' => User::ROLE_ADMIN,
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
                        'role' => User::ROLE_USER,
                    ],
                ],
            ]);

        $user = User::where('email', $uniqueEmail)->first();
        $this->assertNotNull($user);
        $this->assertEquals(User::ROLE_USER, $user->role);
    }

    /**
     * Test login with valid seeded intelligence credentials succeeds.
     */
    public function test_login_with_intelligence_credentials_returns_token_and_user(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'intelligence@sentravax.go.id',
            'password' => 'Sentravax2026!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'intelligence@sentravax.go.id',
                        'role' => User::ROLE_INTELLIGENCE,
                    ],
                    'token_type' => 'Bearer',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Test login with valid seeded regular user credentials succeeds.
     */
    public function test_login_with_user_credentials_returns_token_and_user(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@sentravax.id',
            'password' => 'Sentravax2026!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'user@sentravax.id',
                        'role' => User::ROLE_USER,
                    ],
                    'token_type' => 'Bearer',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Test server-side role authorization blocks 'user' from Intelligence area.
     */
    public function test_role_middleware_blocks_user_from_intelligence_area(): void
    {
        $user = User::where('email', 'user@sentravax.id')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/intel/ping');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN_ROLE',
            ]);
    }

    /**
     * Test unauthenticated guests are completely blocked from internal APIs with 401.
     */
    public function test_unauthenticated_guests_are_blocked_from_internal_apis(): void
    {
        $this->getJson('/api/v1/admin/ping')->assertStatus(401);
        $this->getJson('/api/v1/intel/ping')->assertStatus(401);
        $this->getJson('/api/v1/user/ping')->assertStatus(401);
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }
    public function test_auth_me_returns_current_user(): void
    {
        $user = User::where('email', 'intelligence@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'intelligence@sentravax.go.id',
                        'role' => User::ROLE_INTELLIGENCE,
                    ],
                ],
            ]);
    }

    /**
     * Test server-side role authorization blocks 'user' from Admin area.
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
     * Test server-side role authorization blocks 'intelligence' from Admin area.
     * Admin and Intelligence must remain strictly separated.
     */
    public function test_role_middleware_blocks_intelligence_from_admin_area(): void
    {
        $intel = User::where('email', 'intelligence@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($intel);

        $response = $this->getJson('/api/v1/admin/ping');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN_ROLE',
            ]);
    }

    /**
     * Test server-side role authorization permits 'admin' to access Admin area.
     */
    public function test_role_middleware_permits_admin_to_admin_area(): void
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
     * Test server-side role authorization blocks 'admin' from Intelligence area.
     * Admin and Intelligence must remain strictly separated.
     */
    public function test_role_middleware_blocks_admin_from_intelligence_area(): void
    {
        $admin = User::where('email', 'admin@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/intel/ping');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN_ROLE',
            ]);
    }

    /**
     * Test server-side role authorization permits 'intelligence' to Intelligence area.
     */
    public function test_role_middleware_permits_intelligence_to_intelligence_area(): void
    {
        $intel = User::where('email', 'intelligence@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($intel);

        $response = $this->getJson('/api/v1/intel/ping');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Otorisasi Intelligence Center terverifikasi.',
            ]);
    }

    /**
     * Test User Portal is accessible to all authenticated roles ('user', 'admin', 'intelligence').
     */
    public function test_all_authenticated_roles_can_access_user_portal(): void
    {
        $user = User::where('email', 'user@sentravax.id')->firstOrFail();
        Sanctum::actingAs($user);
        $this->getJson('/api/v1/user/ping')->assertStatus(200);

        $admin = User::where('email', 'admin@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/user/ping')->assertStatus(200);

        $intel = User::where('email', 'intelligence@sentravax.go.id')->firstOrFail();
        Sanctum::actingAs($intel);
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
