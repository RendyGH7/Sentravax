<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityReport extends Model
{
    protected $table = 'community_reports';

    protected $fillable = [
        'user_id',
        'hazard_type_id',
        'region_id',
        'title',
        'description',
        'photo_path',
        'media',
        'status',
        'cluster_id',
        'verified_by',
        'verified_at',
        'moderation_notes',
    ];

    protected function casts(): array
    {
        return [
            'media' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public const BASELINE_IDS = [1, 9];

    protected static function booted(): void
    {
        static::deleting(function (CommunityReport $report) {
            if (in_array($report->id, self::BASELINE_IDS, true)) {
                throw new \RuntimeException("Operasi ditolak: CommunityReport baseline #{$report->id} dilindungi dari penghapusan.");
            }
        });
    }

    public function verifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ReportVerification::class, 'community_report_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function hazardType(): BelongsTo
    {
        return $this->belongsTo(HazardType::class, 'hazard_type_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }
}
