<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyContactChannel extends Model
{
    use HasFactory;

    // Channel types
    public const TYPE_SHORTCODE = 'shortcode';
    public const TYPE_PHONE = 'phone';
    public const TYPE_WHATSAPP = 'whatsapp';
    public const TYPE_EMAIL = 'email';
    public const TYPE_WEBSITE = 'website';

    // Channel classifications
    public const CLASS_EMERGENCY_HOTLINE = 'emergency_hotline';
    public const CLASS_OPERATIONAL_CONTACT = 'operational_contact';
    public const CLASS_OFFICE_CONTACT = 'office_contact';
    public const CLASS_INFORMATIONAL_CONTACT = 'informational_contact';

    // Verification status
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_UNVERIFIED = 'unverified';
    public const STATUS_SOURCE_UNAVAILABLE = 'source_unavailable';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'emergency_contact_id',
        'channel_type',
        'channel_classification',
        'label',
        'value',
        'is_toll_free',
        'is_primary',
        'operating_hours',
        'verification_status',
        'source_name',
        'source_url',
        'verified_at',
        'verification_notes',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_toll_free' => 'boolean',
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'verified_at' => 'datetime',
        'sort_order' => 'integer',
    ];

    /**
     * Parent emergency contact entity.
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(EmergencyContact::class, 'emergency_contact_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', self::STATUS_VERIFIED);
    }

    public function scopeEmergencyHotline($query)
    {
        return $query->where('channel_classification', self::CLASS_EMERGENCY_HOTLINE);
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
}
