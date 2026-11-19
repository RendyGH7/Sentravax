<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Shelter extends Model
{
    use SoftDeletes;

    protected $table = 'shelters';

    protected $fillable = [
        'name',
        'facility_type',
        'address',
        'region_id',
        'latitude',
        'longitude',
        'capacity',
        'current_occupancy',
        'has_sanitation',
        'sanitation_details',
        'wheelchair_accessible',
        'elderly_friendly',
        'contact_person',
        'contact_phone',
        'operational_status',
        'verification_status',
        'verified_at',
        'verified_by_agency',
        'source_name',
        'source_url',
        'evacuation_route_info',
        'provenance_metadata',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'capacity' => 'integer',
            'current_occupancy' => 'integer',
            'has_sanitation' => 'boolean',
            'wheelchair_accessible' => 'boolean',
            'elderly_friendly' => 'boolean',
            'verified_at' => 'datetime',
            'evacuation_route_info' => 'array',
            'provenance_metadata' => 'array',
        ];
    }

    public const BASELINE_IDS = [1, 2, 3, 4, 5];

    protected static function booted(): void
    {
        static::deleting(function (Shelter $shelter) {
            if (in_array($shelter->id, self::BASELINE_IDS, true)) {
                throw new \RuntimeException("Operasi ditolak: Shelter baseline #{$shelter->id} dilindungi dari penghapusan.");
            }
        });

        static::saved(function (Shelter $shelter) {
            if ($shelter->latitude !== null && $shelter->longitude !== null) {
                DB::statement('
                    UPDATE shelters
                    SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)
                    WHERE id = ?
                ', [$shelter->longitude, $shelter->latitude, $shelter->id]);
            }
        });
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('verification_status', 'VERIFIED');
    }

    public function scopeOperational(Builder $query): Builder
    {
        return $query->whereIn('operational_status', ['open', 'standby', 'full']);
    }

    /**
     * Scope query with distance in kilometers calculated from given coordinates.
     */
    public function scopeWithDistance(Builder $query, float $lat, float $lon): Builder
    {
        return $query->select('shelters.*')
            ->selectRaw('
                ST_Distance(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
                ) / 1000.0 AS distance_km
            ', [$lon, $lat]);
    }
}
