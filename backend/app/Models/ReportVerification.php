<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'community_report_id',
        'verified_by',
        'previous_status',
        'new_status',
        'notes',
        'evidence_links',
    ];

    protected $casts = [
        'evidence_links' => 'array',
    ];

    /**
     * The "booted" method of the model.
     * Enforce append-only audit trail behavior: records can never be updated or deleted.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('Audit trail records in report_verifications are append-only and cannot be modified.');
        });

        static::deleting(function () {
            throw new \RuntimeException('Audit trail records in report_verifications are append-only and cannot be deleted.');
        });
    }

    public function communityReport(): BelongsTo
    {
        return $this->belongsTo(CommunityReport::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}

