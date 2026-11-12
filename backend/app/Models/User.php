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
    public const ROLE_INTELLIGENCE = 'intelligence';

    public const ROLES = [
        self::ROLE_USER,
        self::ROLE_ADMIN,
        self::ROLE_INTELLIGENCE,
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
     * Check if user is staff (admin or intelligence).
     */
    public function isStaff(): bool
    {
        return in_array($this->role, [
            self::ROLE_ADMIN,
            self::ROLE_INTELLIGENCE,
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

    public function savedRegions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserSavedRegion::class);
    }

    public function preparednessPlan(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(PreparednessPlan::class);
    }

    public function preparednessContacts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PreparednessContact::class);
    }

    public function checklistProgress(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PreparednessChecklistProgress::class);
    }

    public function scenarioAttempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ScenarioAttempt::class);
    }

    public function communityReports(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CommunityReport::class);
    }

    public function notifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    public function hazardPreferences(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserHazardPreference::class);
    }
}
