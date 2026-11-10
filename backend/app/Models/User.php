<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public const ROLE_USER = 'user';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_ANALYST = 'analyst';
    public const ROLE_OPERATOR = 'operator';
    public const ROLE_SUPER_ADMIN = 'super_admin';

    public const ROLES = [
        self::ROLE_USER,
        self::ROLE_ADMIN,
        self::ROLE_ANALYST,
        self::ROLE_OPERATOR,
        self::ROLE_SUPER_ADMIN,
    ];

    /**
     * Check if user has specific role or one of given roles.
     *
     * @param string|array<string> $roles
     */
    public function hasRole(string|array $roles): bool
    {
        $roles = is_array($roles) ? $roles : [$roles];
        return in_array($this->role, $roles, true);
    }

    /**
     * Check if user is staff (admin, analyst, operator, super_admin).
     */
    public function isStaff(): bool
    {
        return in_array($this->role, [
            self::ROLE_ADMIN,
            self::ROLE_SUPER_ADMIN,
            self::ROLE_ANALYST,
            self::ROLE_OPERATOR,
        ], true);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
