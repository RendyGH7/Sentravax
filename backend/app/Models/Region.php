<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    protected $table = 'regions';

    protected $fillable = [
        'code',
        'name',
        'level',
        'parent_id',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Region::class, 'parent_id');
    }

    public function hazardEvents(): HasMany
    {
        return $this->hasMany(HazardEvent::class, 'region_id');
    }

    public function communityReports(): HasMany
    {
        return $this->hasMany(CommunityReport::class, 'region_id');
    }
}