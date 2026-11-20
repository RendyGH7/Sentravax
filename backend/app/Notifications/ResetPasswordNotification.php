<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    /**
     * The password reset token.
     */
    public string $token;

    /**
     * Create a notification instance.
     */
    public function __construct(string $token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's channels.
     *
     * @return array<int, string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $email = $notifiable->getEmailForPasswordReset();
        $resetUrl = "{$frontendUrl}/reset-password?token=" . urlencode($this->token) . "&email=" . urlencode($email);

        return (new MailMessage)
            ->subject('[SENTRAVAX] Instruksi Pemulihan Kata Sandi Akun')
            ->greeting("Halo, {$notifiable->name}")
            ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun warga SENTRAVAX Anda.')
            ->action('Atur Ulang Kata Sandi', $resetUrl)
            ->line('Tautan pemulihan kata sandi ini akan kedaluwarsa secara otomatis dalam 60 menit.')
            ->line('Jika Anda tidak pernah meminta pemulihan kata sandi, abaikan surel ini. Kata sandi akun Anda tidak akan berubah dan tetap terlindungi.')
            ->salutation('Salam Tangguh, Tim Siaga Bencana SENTRAVAX');
    }
}
