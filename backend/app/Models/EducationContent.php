<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EducationContent extends Model
{
    protected $table = 'education_contents';

    protected $fillable = [
        'hazard_type_id',
        'title',
        'slug',
        'category',
        'summary',
        'content_body',
        'content_type',
        'is_published',
        'published_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class, 'hazard_type_id');
    }
}
