<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use InvalidArgumentException;

class EmergencyContact extends Model
{
    use HasFactory, SoftDeletes;

    // Scope constants
    public const SCOPE_NATIONAL = 'national';
    public const SCOPE_PROVINCIAL = 'provincial';
    public const SCOPE_REGENCY = 'regency';

    // Category constants
    public const CATEGORY_DISASTER_MANAGEMENT = 'disaster_management';
    public const CATEGORY_SAR = 'sar';
    public const CATEGORY_POLICE = 'police';
    public const CATEGORY_MEDICAL = 'medical';
    public const CATEGORY_FIRE = 'fire';
    public const CATEGORY_RED_CROSS = 'red_cross';
    public const CATEGORY_OTHER = 'other';

    // Verification status constants
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_UNVERIFIED = 'unverified';
    public const STATUS_SOURCE_UNAVAILABLE = 'source_unavailable';
    public const STATUS_REJECTED = 'rejected';

    // Publication status constants
    public const PUB_DRAFT = 'draft';
    public const PUB_PUBLISHED = 'published';
    public const PUB_ARCHIVED = 'archived';

    protected $fillable = [
        'name',
        'slug',
        'category',
        'scope',
        'region_id',
        'address',
        'latitude',
        'longitude',
        'description',
        'verification_status',
        'publication_status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (EmergencyContact $contact) {
            $contact->validateScopeRegionIntegrity();
        });
    }

    /**
     * Validate scope and region_id alignment at the model layer.
     * Prevents invalid administrative hierarchy assignment.
     */
    public function validateScopeRegionIntegrity(): void
    {
        if ($this->scope === self::SCOPE_NATIONAL) {
            if ($this->region_id !== null) {
                throw new InvalidArgumentException('National scope emergency contact must have null region_id.');
            }
        } elseif ($this->scope === self::SCOPE_PROVINCIAL) {
            if ($this->region_id === null) {
                throw new InvalidArgumentException('Provincial scope emergency contact must reference a valid region.');
            }
            $region = Region::find($this->region_id);
            if (!$region || $region->level !== 'province') {
                $found = $region ? $region->level : 'non-existent';
                throw new InvalidArgumentException("Provincial scope emergency contact must reference a region with level 'province', found: {$found}.");
            }
        } elseif ($this->scope === self::SCOPE_REGENCY) {
            if ($this->region_id === null) {
                throw new InvalidArgumentException('Regency scope emergency contact must reference a valid region.');
            }
            $region = Region::find($this->region_id);
            if (!$region || $region->level !== 'regency') {
                $found = $region ? $region->level : 'non-existent';
                throw new InvalidArgumentException("Regency scope emergency contact must reference a region with level 'regency', found: {$found}.");
            }
        }
    }

    /**
     * All channels associated with this contact.
     */
    public function channels(): HasMany
    {
        return $this->hasMany(EmergencyContactChannel::class, 'emergency_contact_id');
    }

    /**
     * Only active channels.
     */
    public function activeChannels(): HasMany
    {
        return $this->hasMany(EmergencyContactChannel::class, 'emergency_contact_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }

    /**
     * The single primary active channel for this contact.
     */
    public function primaryChannel(): HasOne
    {
        return $this->hasOne(EmergencyContactChannel::class, 'emergency_contact_id')
            ->where('is_primary', true)
            ->where('is_active', true);
    }

    /**
     * Regional boundary linkage.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * Creator audit link.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Updater audit link.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished($query)
    {
        return $query->where('publication_status', self::PUB_PUBLISHED);
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', self::STATUS_VERIFIED);
    }

    public function scopeNational($query)
    {
        return $query->where('scope', self::SCOPE_NATIONAL);
    }

    public function scopeForRegion($query, int $regionId)
    {
        return $query->where('region_id', $regionId);
    }
}
