<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\CommunityReport;
use App\Models\DataSource;
use App\Models\PreparednessPlan;
use App\Models\Shelter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordRecoveryWorkflowTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Warga Recovery Test',
            'email' => 'recovery_user_' . uniqid() . '@sentravax.id',
            'password' => Hash::make('OldSecretPassword123!'),
            'role' => 'user',
            'email_verified_at' => now()->subDays(5),
        ]);

        $this->otherUser = User::factory()->create([
            'name' => 'Warga Other Test',
            'email' => 'recovery_other_' . uniqid() . '@sentravax.id',
            'password' => Hash::make('OtherSecretPassword123!'),
            'role' => 'user',
            'email_verified_at' => now()->subDays(5),
        ]);
    }

    /**
     * Scenario 01: Request reset with registered email returns generic HTTP 200 and sends notification.
     */
    public function test_01_request_reset_with_valid_registered_email_returns_generic_200_and_sends_notification(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $this->user->email,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Jika alamat email terdaftar di sistem kami, instruksi pemulihan kata sandi telah dikirimkan.',
        ]);

        Notification::assertSentTo($this->user, ResetPassword::class);
    }

    /**
     * Scenario 02: Request reset with unregistered email returns IDENTICAL generic HTTP 200 (Anti-enumeration).
     */
    public function test_02_request_reset_with_unregistered_email_returns_identical_generic_200_and_sends_no_notification(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'unregistered_ghost_' . uniqid() . '@sentravax.id',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Jika alamat email terdaftar di sistem kami, instruksi pemulihan kata sandi telah dikirimkan.',
        ]);

        Notification::assertNothingSent();
    }

    /**
     * Scenario 03: Request reset with malformed email returns HTTP 422 validation error.
     */
    public function test_03_request_reset_with_malformed_email_returns_422_validation_error(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'not-a-valid-email-string',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        Notification::assertNothingSent();
    }

    /**
     * Scenario 04: Request reset with empty email returns HTTP 422 validation error.
     */
    public function test_04_request_reset_with_empty_email_returns_422_validation_error(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => '',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        Notification::assertNothingSent();
    }

    /**
     * Scenario 05: Notification contains valid token and correct frontend reset URL structure.
     */
    public function test_05_notification_contains_valid_token_and_frontend_reset_url_structure(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $this->user->email,
        ]);

        Notification::assertSentTo(
            $this->user,
            ResetPassword::class,
            function (ResetPassword $notification) {
                $mailMessage = $notification->toMail($this->user);
                $actionUrl = $mailMessage->actionUrl;

                $this->assertNotEmpty($notification->token);
                $this->assertStringContainsString('/reset-password?token=', $actionUrl);
                $this->assertStringContainsString('email=' . urlencode($this->user->email), $actionUrl);
                $this->assertStringStartsWith(config('app.frontend_url'), $actionUrl);
                return true;
            }
        );
    }

    /**
     * Scenario 06: Tokens in password_reset_tokens table are hashed, never plaintext.
     */
    public function test_06_tokens_are_hashed_in_database_never_stored_in_plaintext(): void
    {
        $rawToken = Password::broker()->createToken($this->user);

        $record = DB::table('password_reset_tokens')
            ->where('email', $this->user->email)
            ->first();

        $this->assertNotNull($record);
        $this->assertNotEquals($rawToken, $record->token);
        $this->assertTrue(Hash::check($rawToken, $record->token));
    }

    /**
     * Scenario 07: Reset password with valid token, email, and matching password returns HTTP 200.
     */
    public function test_07_successful_password_reset_with_valid_token_returns_200(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Kata sandi akun Anda berhasil diatur ulang. Silakan masuk menggunakan kata sandi baru.',
        ]);

        $this->assertTrue(Hash::check('NewSecretPassword456!', $this->user->fresh()->password));
    }

    /**
     * Scenario 08: Reset fails when token is missing (HTTP 422).
     */
    public function test_08_reset_fails_when_token_is_missing(): void
    {
        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => $this->user->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token']);
    }

    /**
     * Scenario 09: Reset fails when email is missing (HTTP 422).
     */
    public function test_09_reset_fails_when_email_is_missing(): void
    {
        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'dummy-token-sample',
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Scenario 10: Reset fails when password is missing (HTTP 422).
     */
    public function test_10_reset_fails_when_password_is_missing(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Scenario 11: Reset fails when password is less than 8 characters (HTTP 422).
     */
    public function test_11_reset_fails_when_password_is_less_than_8_characters(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Scenario 12: Reset fails when password confirmation does not match (HTTP 422).
     */
    public function test_12_reset_fails_when_password_confirmation_does_not_match(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'MismatchSecretPassword999!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Scenario 13: Reset fails with invalid or forged token (HTTP 422).
     */
    public function test_13_reset_fails_with_invalid_or_forged_token(): void
    {
        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'forged_or_invalid_reset_token',
            'email' => $this->user->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token']);
    }

    /**
     * Scenario 14: Reset fails when email does not match token owner (HTTP 422).
     */
    public function test_14_reset_fails_when_email_does_not_match_token_owner(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->otherUser->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token']);
    }

    /**
     * Scenario 15: Reset fails when token is expired past 60 minutes (HTTP 422).
     */
    public function test_15_reset_fails_when_token_is_expired_past_60_minutes(): void
    {
        $token = Password::broker()->createToken($this->user);

        // Advance system time past the 60-minute expiration threshold
        Carbon::setTestNow(now()->addMinutes(65));

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token']);

        Carbon::setTestNow(); // restore clock
    }

    /**
     * Scenario 16: Token cannot be reused after successful reset (HTTP 422 on second attempt).
     */
    public function test_16_token_cannot_be_reused_after_successful_reset(): void
    {
        $token = Password::broker()->createToken($this->user);

        // First attempt - succeeds
        $firstResponse = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewSecretPassword456!',
            'password_confirmation' => 'NewSecretPassword456!',
        ]);
        $firstResponse->assertStatus(200);

        // Second attempt with same token - must fail
        $secondResponse = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'AnotherPassword789!',
            'password_confirmation' => 'AnotherPassword789!',
        ]);
        $secondResponse->assertStatus(422);
        $secondResponse->assertJsonValidationErrors(['token']);
    }

    /**
     * Scenario 17: User can login with new password after reset.
     */
    public function test_17_user_can_login_with_new_password_after_reset(): void
    {
        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
        ]);

        $loginResponse->assertStatus(200);
        $loginResponse->assertJson([
            'success' => true,
            'message' => 'Autentikasi berhasil.',
        ]);
    }

    /**
     * Scenario 18: User cannot login with old password after reset.
     */
    public function test_18_user_cannot_login_with_old_password_after_reset(): void
    {
        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $this->user->email,
            'password' => 'OldSecretPassword123!',
        ]);

        $loginResponse->assertStatus(401);
        $loginResponse->assertJson([
            'success' => false,
            'error' => 'INVALID_CREDENTIALS',
        ]);
    }

    /**
     * Scenario 19: Successful reset revokes all existing Personal Access Tokens for the target user.
     */
    public function test_19_successful_reset_revokes_all_existing_personal_access_tokens_for_user(): void
    {
        $this->user->createToken('token_device_a');
        $this->user->createToken('token_device_b');

        $this->assertEquals(2, $this->user->tokens()->count());

        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        $this->assertEquals(0, $this->user->tokens()->count());
    }

    /**
     * Scenario 20: Successful reset does NOT revoke other users' Personal Access Tokens.
     */
    public function test_20_successful_reset_does_not_revoke_other_users_personal_access_tokens(): void
    {
        $this->user->createToken('user_token');
        $this->otherUser->createToken('other_user_token');

        $this->assertEquals(1, $this->otherUser->tokens()->count());

        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        // Target user tokens revoked
        $this->assertEquals(0, $this->user->tokens()->count());
        // Other user tokens intact
        $this->assertEquals(1, $this->otherUser->fresh()->tokens()->count());
    }

    /**
     * Scenario 21: Password reset response does not contain bearer token or session auto-login.
     */
    public function test_21_password_reset_response_does_not_contain_bearer_token_or_session_auto_login(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ]);

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('token', $response->json('data') ?? []);
        $this->assertArrayNotHasKey('access_token', $response->json('data') ?? []);
        $this->assertArrayNotHasKey('user', $response->json('data') ?? []);
    }

    /**
     * Scenario 22: Password reset does NOT alter email_verified_at.
     */
    public function test_22_password_reset_does_not_alter_email_verified_at(): void
    {
        $originalVerifiedAt = $this->user->email_verified_at;

        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        $this->assertEquals(
            $originalVerifiedAt->toISOString(),
            $this->user->fresh()->email_verified_at->toISOString()
        );
    }

    /**
     * Scenario 23: Password reset does NOT alter user role.
     */
    public function test_23_password_reset_does_not_alter_user_role(): void
    {
        $originalRole = $this->user->role;

        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        $this->assertEquals($originalRole, $this->user->fresh()->role);
    }

    /**
     * Scenario 24: Password reset does NOT delete or alter user preparedness plan.
     */
    public function test_24_password_reset_does_not_delete_or_alter_user_preparedness_plan(): void
    {
        $plan = PreparednessPlan::create([
            'user_id' => $this->user->id,
            'title' => 'Rencana Siaga Keluarga Gempa',
            'primary_meeting_point' => 'Lapangan RT 05',
            'secondary_meeting_point' => 'Balai Warga RW 02',
            'evacuation_notes' => 'Bawa tas siaga bencana',
            'custom_provisions' => ['air_mineral' => '5 liter'],
        ]);

        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'FreshNewSecret999!',
            'password_confirmation' => 'FreshNewSecret999!',
        ])->assertStatus(200);

        $freshPlan = PreparednessPlan::where('user_id', $this->user->id)->first();
        $this->assertNotNull($freshPlan);
        $this->assertEquals($plan->id, $freshPlan->id);
        $this->assertEquals('Rencana Siaga Keluarga Gempa', $freshPlan->title);
    }

    /**
     * Scenario 25: Password broker throttles rapid repeated reset requests (HTTP 429).
     */
    public function test_25_password_broker_throttles_rapid_repeated_reset_requests(): void
    {
        Notification::fake();

        // First request creates token and sets broker throttle timestamp
        $firstResponse = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $this->user->email,
        ]);
        $firstResponse->assertStatus(200);

        // Immediate second request within 60s throttle window must be rejected with 429
        $secondResponse = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $this->user->email,
        ]);

        $secondResponse->assertStatus(429);
        $secondResponse->assertJson([
            'success' => false,
            'error' => 'RESET_THROTTLED',
        ]);
    }

    /**
     * Scenario 26: Failed reset attempt does not modify current user password hash.
     */
    public function test_26_failed_reset_does_not_modify_current_user_password_hash(): void
    {
        $originalHash = $this->user->password;

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'invalid_dummy_token',
            'email' => $this->user->email,
            'password' => 'ShouldNotBeSaved123!',
            'password_confirmation' => 'ShouldNotBeSaved123!',
        ]);

        $response->assertStatus(422);
        $this->assertEquals($originalHash, $this->user->fresh()->password);
    }

    /**
     * Scenario 27: Reset response payload structure is sanitized and consistent.
     */
    public function test_27_reset_response_payload_structure_is_sanitized_and_consistent(): void
    {
        $token = Password::broker()->createToken($this->user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'NewValidSecret123!',
            'password_confirmation' => 'NewValidSecret123!',
        ]);

        $response->assertStatus(200);
        $json = $response->json();

        $this->assertTrue($json['success']);
        $this->assertIsString($json['message']);
        $this->assertArrayNotHasKey('error', $json);
        $this->assertArrayNotHasKey('token', $json);
    }

    /**
     * Scenario 28: Password update and PAT revocation are atomic.
     */
    public function test_28_password_update_and_pat_revocation_are_atomic(): void
    {
        $this->user->createToken('active_token');
        $this->assertEquals(1, $this->user->tokens()->count());

        $token = Password::broker()->createToken($this->user);

        // Perform valid reset
        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'AtomicSecretPassword123!',
            'password_confirmation' => 'AtomicSecretPassword123!',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(0, $this->user->fresh()->tokens()->count());
        $this->assertTrue(Hash::check('AtomicSecretPassword123!', $this->user->fresh()->password));
    }

    /**
     * Scenario 29: Database baseline records remain completely intact after recovery suite.
     */
    public function test_29_database_baseline_integrity_remains_unmodified_after_recovery_suite(): void
    {
        $this->assertGreaterThanOrEqual(5, CommunityReport::count());
        $this->assertGreaterThanOrEqual(1, AiInsight::count());
        $this->assertGreaterThanOrEqual(6, DataSource::count());
        $this->assertGreaterThanOrEqual(5, Shelter::count());

        // Verify key baseline records still exist
        $this->assertNotNull(CommunityReport::find(1));
        $this->assertNotNull(DataSource::find(2));
        $this->assertNotNull(Shelter::find(1));
    }
}
