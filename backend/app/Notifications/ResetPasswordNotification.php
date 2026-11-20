<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;

class ResetPasswordNotification extends BaseResetPassword
{
    use Queueable;

    /**
     * Create a notification instance.
     *
     * @param string $token
     */
    public function __construct(#[\SensitiveParameter] $token)
    {
        parent::__construct($token);
    }
}
