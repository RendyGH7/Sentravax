<?php

namespace App\Services\EmergencyDirectory;

use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\EmergencyDirectoryAuditLog;
use Carbon\Carbon;
use InvalidArgumentException;

class EmergencyDirectoryAuditService
{
    /**
     * Whitelist of attributes captured for EmergencyContact snapshot.
     */
    public const CONTACT_ALLOWLIST = [
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
    ];

    /**
     * Whitelist of attributes captured for EmergencyContactChannel snapshot.
     */
    public const CHANNEL_ALLOWLIST = [
        'channel_type',
        'channel_classification',
        'label',
        'value',
        'is_toll_free',
        'is_primary',
        'operating_hours',
        'verification_status',
        'source_name',
        'source_url',
        'verified_at',
        'verification_notes',
        'sort_order',
        'is_active',
    ];

    /**
     * Capture normalized snapshot of an EmergencyContact model.
     */
    public function captureContactSnapshot(EmergencyContact $contact): array
    {
        $snapshot = [];
        foreach (self::CONTACT_ALLOWLIST as $field) {
            $val = $contact->getAttribute($field);

            if ($field === 'region_id') {
                $snapshot[$field] = $val !== null ? (int) $val : null;
            } elseif (in_array($field, ['latitude', 'longitude'], true)) {
                $snapshot[$field] = $val !== null ? (float) number_format((float) $val, 7, '.', '') : null;
            } else {
                $snapshot[$field] = $val !== null ? (string) $val : null;
            }
        }

        return $snapshot;
    }

    /**
     * Capture normalized snapshot of an EmergencyContactChannel model.
     */
    public function captureChannelSnapshot(EmergencyContactChannel $channel): array
    {
        $snapshot = [];
        foreach (self::CHANNEL_ALLOWLIST as $field) {
            $val = $channel->getAttribute($field);

            if (in_array($field, ['is_toll_free', 'is_primary', 'is_active'], true)) {
                $snapshot[$field] = (bool) $val;
            } elseif ($field === 'sort_order') {
                $snapshot[$field] = (int) $val;
            } elseif ($field === 'verified_at') {
                $snapshot[$field] = $val ? Carbon::parse($val)->toIso8601String() : null;
            } else {
                $snapshot[$field] = $val !== null ? (string) $val : null;
            }
        }

        return $snapshot;
    }

    /**
     * Compare old and new normalized snapshots and compute deltas.
     * Returns empty array if no real changes exist.
     */
    public function computeDelta(array $oldSnapshot, array $newSnapshot): array
    {
        $oldChanges = [];
        $newChanges = [];

        foreach ($newSnapshot as $key => $newVal) {
            $oldVal = $oldSnapshot[$key] ?? null;

            if ($oldVal !== $newVal) {
                $oldChanges[$key] = $oldVal;
                $newChanges[$key] = $newVal;
            }
        }

        if (empty($newChanges)) {
            return [];
        }

        return [
            'old' => $oldChanges,
            'new' => $newChanges,
        ];
    }

    /**
     * Core append-only writer for audit logs.
     */
    public function record(
        string $entityType,
        int $entityId,
        int $parentContactId,
        string $action,
        ?array $oldValues,
        ?array $newValues,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        if (! in_array($entityType, EmergencyDirectoryAuditLog::ENTITY_TYPES, true)) {
            throw new InvalidArgumentException("Invalid audit entity type: {$entityType}");
        }

        if ($entityId <= 0) {
            throw new InvalidArgumentException("Entity ID must be positive integer, got: {$entityId}");
        }

        if ($parentContactId <= 0) {
            throw new InvalidArgumentException("Parent contact ID must be positive integer, got: {$parentContactId}");
        }

        return EmergencyDirectoryAuditLog::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'parent_contact_id' => $parentContactId,
            'actor_id' => $actorId,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress,
            'created_at' => now(),
        ]);
    }

    // ==========================================
    // PARENT AUDIT EVENTS
    // ==========================================

    public function recordContactCreated(
        EmergencyContact $contact,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        $snapshot = $this->captureContactSnapshot($contact);

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_CONTACT_CREATED,
            null,
            $snapshot,
            $actorId,
            $ipAddress
        );
    }

    public function recordContactUpdated(
        EmergencyContact $contact,
        array $oldSnapshot,
        ?int $actorId,
        ?string $ipAddress
    ): ?EmergencyDirectoryAuditLog {
        $newSnapshot = $this->captureContactSnapshot($contact);
        $delta = $this->computeDelta($oldSnapshot, $newSnapshot);

        if (empty($delta)) {
            return null; // No-op, no audit record created
        }

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_CONTACT_UPDATED,
            $delta['old'],
            $delta['new'],
            $actorId,
            $ipAddress
        );
    }

    public function recordContactVerificationChanged(
        EmergencyContact $contact,
        string $oldStatus,
        string $newStatus,
        ?int $actorId,
        ?string $ipAddress
    ): ?EmergencyDirectoryAuditLog {
        if ($oldStatus === $newStatus) {
            return null;
        }

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_CONTACT_VERIFICATION_CHANGED,
            ['verification_status' => $oldStatus],
            ['verification_status' => $newStatus],
            $actorId,
            $ipAddress
        );
    }

    public function recordContactPublicationChanged(
        EmergencyContact $contact,
        string $oldStatus,
        string $newStatus,
        ?int $actorId,
        ?string $ipAddress
    ): ?EmergencyDirectoryAuditLog {
        if ($oldStatus === $newStatus) {
            return null;
        }

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_CONTACT_PUBLICATION_CHANGED,
            ['publication_status' => $oldStatus],
            ['publication_status' => $newStatus],
            $actorId,
            $ipAddress
        );
    }

    public function recordContactSoftDeleted(
        EmergencyContact $contact,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_CONTACT_SOFT_DELETED,
            ['deleted_at' => null],
            ['deleted_at' => now()->toIso8601String()],
            $actorId,
            $ipAddress
        );
    }

    // ==========================================
    // CHANNEL AUDIT EVENTS
    // ==========================================

    public function recordChannelCreated(
        EmergencyContactChannel $channel,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        $snapshot = $this->captureChannelSnapshot($channel);

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            EmergencyDirectoryAuditLog::ACTION_CHANNEL_CREATED,
            null,
            $snapshot,
            $actorId,
            $ipAddress
        );
    }

    public function recordChannelUpdated(
        EmergencyContactChannel $channel,
        array $oldSnapshot,
        ?int $actorId,
        ?string $ipAddress
    ): ?EmergencyDirectoryAuditLog {
        $newSnapshot = $this->captureChannelSnapshot($channel);
        $delta = $this->computeDelta($oldSnapshot, $newSnapshot);

        if (empty($delta)) {
            return null;
        }

        // Check if the only change was verification status or if other attributes changed
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            EmergencyDirectoryAuditLog::ACTION_CHANNEL_UPDATED,
            $delta['old'],
            $delta['new'],
            $actorId,
            $ipAddress
        );
    }

    public function recordChannelVerificationChanged(
        EmergencyContactChannel $channel,
        string $oldStatus,
        string $newStatus,
        ?int $actorId,
        ?string $ipAddress
    ): ?EmergencyDirectoryAuditLog {
        if ($oldStatus === $newStatus) {
            return null;
        }

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            EmergencyDirectoryAuditLog::ACTION_CHANNEL_VERIFICATION_CHANGED,
            ['verification_status' => $oldStatus],
            ['verification_status' => $newStatus],
            $actorId,
            $ipAddress
        );
    }

    public function recordChannelToggled(
        EmergencyContactChannel $channel,
        bool $oldActive,
        bool $newActive,
        ?int $actorId,
        ?string $ipAddress
    ): ?EmergencyDirectoryAuditLog {
        if ($oldActive === $newActive) {
            return null;
        }

        $action = $newActive
            ? EmergencyDirectoryAuditLog::ACTION_CHANNEL_ACTIVATED
            : EmergencyDirectoryAuditLog::ACTION_CHANNEL_DEACTIVATED;

        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            $action,
            ['is_active' => $oldActive],
            ['is_active' => $newActive],
            $actorId,
            $ipAddress
        );
    }

    public function recordChannelPrimaryPromoted(
        EmergencyContactChannel $channel,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            EmergencyDirectoryAuditLog::ACTION_CHANNEL_PRIMARY_PROMOTED,
            ['is_primary' => false],
            ['is_primary' => true],
            $actorId,
            $ipAddress
        );
    }

    public function recordChannelPrimaryDemoted(
        EmergencyContactChannel $channel,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            EmergencyDirectoryAuditLog::ACTION_CHANNEL_PRIMARY_DEMOTED,
            ['is_primary' => true],
            ['is_primary' => false],
            $actorId,
            $ipAddress
        );
    }

    public function recordChannelDeactivatedViaDelete(
        EmergencyContactChannel $channel,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CHANNEL,
            $channel->id,
            $channel->emergency_contact_id,
            EmergencyDirectoryAuditLog::ACTION_CHANNEL_DEACTIVATED_VIA_DELETE,
            ['is_active' => true],
            ['is_active' => false],
            $actorId,
            $ipAddress
        );
    }

    // ==========================================
    // SIDE EFFECT AUDIT EVENTS
    // ==========================================

    public function recordPublicationAutoDemotedDueToChannel(
        EmergencyContact $contact,
        string $oldStatus,
        string $newStatus,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_PARENT_PUB_AUTO_DEMOTED_DUE_TO_CHANNEL,
            ['publication_status' => $oldStatus],
            ['publication_status' => $newStatus],
            $actorId,
            $ipAddress
        );
    }

    public function recordPublicationAutoDemotedDueToVerification(
        EmergencyContact $contact,
        string $oldStatus,
        string $newStatus,
        ?int $actorId,
        ?string $ipAddress
    ): EmergencyDirectoryAuditLog {
        return $this->record(
            EmergencyDirectoryAuditLog::ENTITY_CONTACT,
            $contact->id,
            $contact->id,
            EmergencyDirectoryAuditLog::ACTION_PARENT_PUB_AUTO_DEMOTED_DUE_TO_VERIFICATION,
            ['publication_status' => $oldStatus],
            ['publication_status' => $newStatus],
            $actorId,
            $ipAddress
        );
    }
}
