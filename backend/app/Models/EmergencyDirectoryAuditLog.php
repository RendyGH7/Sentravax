<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class EmergencyDirectoryAuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    // Entity types
    public const ENTITY_CONTACT = 'emergency_contact';
    public const ENTITY_CHANNEL = 'emergency_contact_channel';

    public const ENTITY_TYPES = [
        self::ENTITY_CONTACT,
        self::ENTITY_CHANNEL,
    ];

    // Action constants: Parent
    public const ACTION_CONTACT_CREATED = 'contact_created';
    public const ACTION_CONTACT_UPDATED = 'contact_updated';
    public const ACTION_CONTACT_VERIFICATION_CHANGED = 'contact_verification_changed';
    public const ACTION_CONTACT_PUBLICATION_CHANGED = 'contact_publication_changed';
    public const ACTION_CONTACT_SOFT_DELETED = 'contact_soft_deleted';

    // Action constants: Channel
    public const ACTION_CHANNEL_CREATED = 'channel_created';
    public const ACTION_CHANNEL_UPDATED = 'channel_updated';
    public const ACTION_CHANNEL_VERIFICATION_CHANGED = 'channel_verification_changed';
    public const ACTION_CHANNEL_ACTIVATED = 'channel_activated';
    public const ACTION_CHANNEL_DEACTIVATED = 'channel_deactivated';
    public const ACTION_CHANNEL_PRIMARY_PROMOTED = 'channel_primary_promoted';
    public const ACTION_CHANNEL_PRIMARY_DEMOTED = 'channel_primary_demoted';
    public const ACTION_CHANNEL_DEACTIVATED_VIA_DELETE = 'channel_deactivated_via_delete';

    // Action constants: Side Effects
    public const ACTION_PARENT_PUB_AUTO_DEMOTED_DUE_TO_CHANNEL = 'contact_publication_auto_demoted_due_to_channel';
    public const ACTION_PARENT_PUB_AUTO_DEMOTED_DUE_TO_VERIFICATION = 'contact_publication_auto_demoted_due_to_verification';

    protected $fillable = [
        'entity_type',
        'entity_id',
        'parent_contact_id',
        'actor_id',
        'action',
        'old_values',
        'new_values',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'entity_id' => 'integer',
        'parent_contact_id' => 'integer',
        'actor_id' => 'integer',
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * The admin actor who initiated the change.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Parent contact associated with this log record.
     */
    public function parentContact(): BelongsTo
    {
        return $this->belongsTo(EmergencyContact::class, 'parent_contact_id')->withTrashed();
    }

    /**
     * Prevent updates to existing audit logs at the Eloquent layer.
     */
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new RuntimeException('Emergency directory audit logs are immutable and cannot be updated.');
        }

        return parent::save($options);
    }

    /**
     * Prevent deletion of audit logs at the Eloquent layer.
     */
    public function delete(): ?bool
    {
        throw new RuntimeException('Emergency directory audit logs are immutable and cannot be deleted.');
    }
}
