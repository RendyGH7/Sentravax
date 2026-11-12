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

    public function communityReport(): BelongsTo
    {
        return $this->belongsTo(CommunityReport::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}

