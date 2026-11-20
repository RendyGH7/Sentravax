<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
        $this->configurePasswordRecovery();
    }

    /**
     * Configure password recovery notification and frontend reset link.
     */
    protected function configurePasswordRecovery(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            return "{$frontendUrl}/reset-password?token=" . urlencode($token) . "&email=" . urlencode($notifiable->getEmailForPasswordReset());
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            $email = $notifiable->getEmailForPasswordReset();
            $resetUrl = "{$frontendUrl}/reset-password?token=" . urlencode($token) . "&email=" . urlencode($email);

            return (new MailMessage)
                ->subject('[SENTRAVAX] Instruksi Pemulihan Kata Sandi Akun')
                ->greeting("Halo, {$notifiable->name}")
                ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun warga SENTRAVAX Anda.')
                ->action('Atur Ulang Kata Sandi', $resetUrl)
                ->line('Tautan pemulihan kata sandi ini akan kedaluwarsa secara otomatis dalam 60 menit.')
                ->line('Jika Anda tidak merasa meminta pengaturan ulang kata sandi, abaikan email ini dan akun Anda tetap aman.')
                ->salutation("Salam Tangguh,\nTim SENTRAVAX");
        });
    }

    /**
     * Configure rate limiters for public, auth, and sensitive operational endpoints.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            if (app()->environment('testing')) {
                return Limit::none();
            }
            return Limit::perMinute(15)->by($request->ip());
        });

        RateLimiter::for('public-report', function (Request $request) {
            if (app()->environment('testing') && ! $request->hasHeader('X-Test-Rate-Limit')) {
                return Limit::none();
            }
            return Limit::perMinute(20)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return response()->json([
                        'success' => false,
                        'message' => "Batas pengiriman laporan tercapai. Demi keandalan sistem dan verifikasi berjenjang, silakan tunggu {$retryAfter} detik sebelum mengirimkan laporan baru.",
                        'retry_after' => $retryAfter,
                    ], 429, $headers);
                });
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
