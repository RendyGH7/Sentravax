<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    protected User $user;
    protected User $targetOtherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::where('email', 'test_pwd_user@sentravax.id')->first()
            ?? User::factory()->create([
                'name' => 'Warga Test Password',
                'email' => 'test_pwd_user@sentravax.id',
                'password' => Hash::make('CurrentSecret123!'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]);

        // Ensure clean initial password
        $this->user->update([
            'password' => Hash::make('CurrentSecret123!'),
        ]);

        $this->targetOtherUser = User::where('email', 'test_other_user@sentravax.id')->first()
            ?? User::factory()->create([
                'name' => 'Warga Lain',
                'email' => 'test_other_user@sentravax.id',
                'password' => Hash::make('OtherSecret123!'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]);

        $this->targetOtherUser->update([
            'password' => Hash::make('OtherSecret123!'),
        ]);
    }

    protected function tearDown(): void
    {
        // Reset passwords
        if (isset($this->user)) {
            $this->user->update(['password' => Hash::make('CurrentSecret123!')]);
        }
        if (isset($this->targetOtherUser)) {
            $this->targetOtherUser->update(['password' => Hash::make('OtherSecret123!')]);
        }
        parent::tearDown();
    }

    /**
     * Skenario 1: Kata sandi saat ini benar dan kata sandi baru valid.
     */
    public function test_1_authenticated_user_can_change_password_with_valid_credentials(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Kata sandi akun Anda berhasil diperbarui.',
        ]);

        $this->assertTrue(Hash::check('BrandNewSecret456!', $this->user->fresh()->password));
    }

    /**
     * Skenario 2: Kata sandi saat ini salah menghasilkan error validasi yang aman.
     */
    public function test_2_change_password_fails_with_incorrect_current_password(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'WrongCurrentPassword999!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);
        $this->assertTrue(Hash::check('CurrentSecret123!', $this->user->fresh()->password));
    }

    /**
     * Skenario 3: Kata sandi saat ini tidak disertakan dalam payload.
     */
    public function test_3_change_password_fails_when_current_password_is_missing(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);
    }

    /**
     * Skenario 4: Kata sandi baru tidak disertakan dalam payload.
     */
    public function test_4_change_password_fails_when_new_password_is_missing(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Skenario 5: Konfirmasi kata sandi baru tidak disertakan.
     */
    public function test_5_change_password_fails_when_confirmation_is_missing(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Skenario 6: Konfirmasi kata sandi baru tidak cocok.
     */
    public function test_6_change_password_fails_when_confirmation_does_not_match(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'MismatchSecret999!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Skenario 7: Kata sandi baru identik dengan kata sandi saat ini.
     */
    public function test_7_change_password_fails_when_new_password_is_identical_to_current(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'CurrentSecret123!',
            'password_confirmation' => 'CurrentSecret123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Skenario 8: Kata sandi baru di bawah batas minimum (kurang dari 8 karakter).
     */
    public function test_8_change_password_fails_when_new_password_is_below_minimum_length(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'Short7!',
            'password_confirmation' => 'Short7!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    /**
     * Skenario 9: Request tanpa autentikasi ditolak dengan HTTP 401.
     */
    public function test_9_unauthenticated_request_is_rejected(): void
    {
        $response = $this->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Skenario 10: Isolasi akun ketat: User A tidak dapat memodifikasi password User B meskipun menyisipkan user_id lain.
     */
    public function test_10_user_cannot_change_another_users_password_via_spoofed_payload(): void
    {
        $otherInitialHash = $this->targetOtherUser->password;

        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
            'user_id' => $this->targetOtherUser->id,
            'id' => $this->targetOtherUser->id,
            'email' => $this->targetOtherUser->email,
        ]);

        $response->assertStatus(200);

        // User A's password was updated
        $this->assertTrue(Hash::check('BrandNewSecret456!', $this->user->fresh()->password));

        // User B's password MUST NOT change
        $this->assertEquals($otherInitialHash, $this->targetOtherUser->fresh()->password);
        $this->assertTrue(Hash::check('OtherSecret123!', $this->targetOtherUser->fresh()->password));
    }

    /**
     * Skenario 11: Rate limiting membatasi upaya berulang secara wajar (maksimal 6 per menit).
     */
    public function test_11_repeated_attempts_are_rate_limited(): void
    {
        // First 6 attempts are processed
        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
                'current_password' => 'WrongGuess' . $i,
                'password' => 'BrandNewSecret456!',
                'password_confirmation' => 'BrandNewSecret456!',
            ]);
        }

        // 7th attempt within the same minute should receive HTTP 429
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'WrongGuessExtra',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(429);
    }

    /**
     * Skenario 12: Kata sandi tersimpan dalam format hash aman, tidak pernah plaintext.
     */
    public function test_12_password_is_stored_hashed_never_plaintext(): void
    {
        $newPlaintext = 'SecurePass789!#$';

        $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => $newPlaintext,
            'password_confirmation' => $newPlaintext,
        ]);

        $rawPasswordInDb = DB::table('users')->where('id', $this->user->id)->value('password');

        $this->assertNotEquals($newPlaintext, $rawPasswordInDb);
        $this->assertMatchesRegularExpression('/^\$2y\$|\$argon2id\$/', $rawPasswordInDb);
    }

    /**
     * Skenario 13: Login berhasil menggunakan kata sandi baru setelah diubah.
     */
    public function test_13_login_succeeds_with_new_password_after_change(): void
    {
        $newPassword = 'NewWorkingPassword123!';

        $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);

        // Attempt login with new password
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => $this->user->email,
            'password' => $newPassword,
        ]);

        $loginRes->assertStatus(200);
        $loginRes->assertJson(['success' => true]);
    }

    /**
     * Skenario 14: Login dengan kata sandi lama ditolak seketika setelah perubahan berhasil.
     */
    public function test_14_old_password_fails_login_after_successful_change(): void
    {
        $newPassword = 'NewWorkingPassword123!';

        $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);

        // Attempt login with old password
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => $this->user->email,
            'password' => 'CurrentSecret123!',
        ]);

        $loginRes->assertStatus(401);
        $loginRes->assertJson(['success' => false]);
    }

    /**
     * Skenario 15: Seluruh Personal Access Token dicabut setelah pergantian kata sandi berhasil.
     */
    public function test_15_personal_access_tokens_are_revoked_upon_password_change(): void
    {
        // Issue 2 personal access tokens
        $this->user->createToken('token_device_1');
        $this->user->createToken('token_device_2');
        $this->assertCount(2, $this->user->fresh()->tokens);

        $response = $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $response->assertStatus(200);
        $this->assertCount(0, $this->user->fresh()->tokens);
    }

    /**
     * Skenario 16: Request tanpa sesi web (stateless bearer token) tidak mengalami error session.
     */
    public function test_16_stateless_request_without_session_executes_cleanly(): void
    {
        $token = $this->user->createToken('stateless_test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/user/account/password', [
                'current_password' => 'CurrentSecret123!',
                'password' => 'StatelessNewPassword123!',
                'password_confirmation' => 'StatelessNewPassword123!',
            ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('StatelessNewPassword123!', $this->user->fresh()->password));
    }

    /**
     * Skenario 17: Operasi pergantian password tidak pernah memutasi data baseline.
     */
    public function test_17_baseline_records_remain_intact_during_and_after_password_change(): void
    {
        $aiInsightCount = DB::table('ai_insights')->count();
        $communityReportCount = DB::table('community_reports')->count();
        $dataSourceCount = DB::table('data_sources')->count();
        $shelterCount = DB::table('shelters')->count();

        $this->actingAs($this->user)->putJson('/api/v1/user/account/password', [
            'current_password' => 'CurrentSecret123!',
            'password' => 'BrandNewSecret456!',
            'password_confirmation' => 'BrandNewSecret456!',
        ]);

        $this->assertEquals($aiInsightCount, DB::table('ai_insights')->count(), 'AI Insights baseline count must not change.');
        $this->assertEquals($communityReportCount, DB::table('community_reports')->count(), 'Community Reports baseline count must not change.');
        $this->assertEquals($dataSourceCount, DB::table('data_sources')->count(), 'DataSources baseline count must not change.');
        $this->assertEquals($shelterCount, DB::table('shelters')->count(), 'Shelters baseline count must not change.');
    }
}
