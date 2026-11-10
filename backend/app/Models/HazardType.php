<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HazardType extends Model
{
    protected $table = 'hazard_types';

    protected $fillable = [
        'slug',
        'name',
        'category',
        'description',
        'icon',
        'severity_levels',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'severity_levels' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function hazardEvents(): HasMany
    {
        return $this->hasMany(HazardEvent::class, 'hazard_type_id');
    }

    public function communityReports(): HasMany
    {
        return $this->hasMany(CommunityReport::class, 'hazard_type_id');
    }

    public function educationContents(): HasMany
    {
        return $this->hasMany(EducationContent::class, 'hazard_type_id');
    }
}
