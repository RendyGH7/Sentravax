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
     * Enforce append-only audit trail behavior at the application layer:
     * Eloquent records can never be updated or deleted.
     * Note: This enforces immutability at the application/ORM level,
     * not claiming hardware or direct SQL DBA-level immutability.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('Audit trail records in report_verifications are append-only at the application layer and cannot be modified.');
        });

        static::deleting(function () {
            throw new \RuntimeException('Audit trail records in report_verifications are append-only at the application layer and cannot be deleted.');
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

