<?php

namespace App\Services\Notification;

use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\CommunityReport;
use App\Models\NotificationDeliveryLog;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\UserSavedRegion;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function __construct(
        protected NotificationPreferenceService $preferenceService,
        protected NotificationDeduplicationService $deduplicationService,
        protected NotificationDeliveryService $deliveryService
    ) {}

    /**
     * Create a single in-app notification with strict deduplication and preference checks.
     *
     * @param array<string, mixed> $data
     */
    public function createNotification(User $user, array $data): ?UserNotification
    {
        $category = $data['category'] ?? UserNotification::CATEGORY_SYSTEM;
        $urgency = match (strtolower(trim((string) ($data['urgency'] ?? 'info')))) {
            'warning', 'critical' => UserNotification::URGENCY_CRITICAL,
            'watch', 'high' => UserNotification::URGENCY_HIGH,
            'advisory', 'medium' => UserNotification::URGENCY_MEDIUM,
            'low' => UserNotification::URGENCY_LOW,
            default => UserNotification::URGENCY_INFO,
        };
        $title = trim((string) ($data['title'] ?? ''));
        $body = trim((string) ($data['body'] ?? $data['message'] ?? ''));
        $relatedType = $data['related_type'] ?? null;
        $relatedId = isset($data['related_id']) ? (int) $data['related_id'] : null;
        $materialKey = $data['material_key'] ?? null;
        $expiresAt = $data['expires_at'] ?? null;
        $payload = $data['payload'] ?? [];

        // 1. Check user notification preferences
        if (!$this->preferenceService->shouldDeliver($user, $category, $urgency)) {
            $this->deliveryService->recordLog(
                userId: $user->id,
                notificationId: null,
                status: NotificationDeliveryLog::STATUS_PREFERENCE_FILTERED,
                fingerprint: null,
                category: $category,
                urgency: $urgency,
                reason: sprintf("Notifikasi diabaikan karena preferensi pengguna (%s: %s).", $category, $urgency),
                metadata: ['category' => $category, 'urgency' => $urgency]
            );
            return null;
        }

        // 2. Generate stable fingerprint
        $fingerprint = $this->deduplicationService->generateFingerprint(
            $category,
            $relatedId ?? substr(hash('sha256', $title), 0, 16),
            $materialKey
        );

        // 3. Deduplication and cooldown check
        $cooldown = $data['cooldown_minutes'] ?? 240;
        if ($this->deduplicationService->isDuplicate($user->id, $fingerprint, $cooldown)) {
            $this->deliveryService->recordLog(
                userId: $user->id,
                notificationId: null,
                status: NotificationDeliveryLog::STATUS_DEDUPLICATED,
                fingerprint: $fingerprint,
                category: $category,
                urgency: $urgency,
                reason: sprintf("Notifikasi serupa telah terkirim dalam rentang cooldown %d menit.", $cooldown),
                metadata: ['fingerprint' => $fingerprint]
            );
            return null;
        }

        // 4. Persistence with race-condition safe database unique index and atomic delivery log
        try {
            return DB::transaction(function () use ($user, $title, $body, $category, $urgency, $relatedType, $relatedId, $fingerprint, $expiresAt, $payload) {
                $notification = UserNotification::create([
                    'user_id' => $user->id,
                    'title' => $title,
                    'body' => $body,
                    'type' => $category,
                    'category' => $category,
                    'urgency' => $urgency,
                    'related_type' => $relatedType,
                    'related_id' => $relatedId,
                    'event_fingerprint' => $fingerprint,
                    'expires_at' => $expiresAt,
                    'payload' => $payload,
                ]);

                $this->deliveryService->recordLog(
                    userId: $user->id,
                    notificationId: $notification->id,
                    status: NotificationDeliveryLog::STATUS_DELIVERED,
                    fingerprint: $fingerprint,
                    category: $category,
                    urgency: $urgency,
                    reason: "Notifikasi in-app berhasil dikirimkan.",
                    metadata: ['notification_id' => $notification->id]
                );

                return $notification;
            });
        } catch (UniqueConstraintViolationException $e) {
            // Race condition intercepted by unique constraint
            $this->deliveryService->recordLog(
                userId: $user->id,
                notificationId: null,
                status: NotificationDeliveryLog::STATUS_DEDUPLICATED,
                fingerprint: $fingerprint,
                category: $category,
                urgency: $urgency,
                reason: "Duplikasi terdeteksi oleh database unique constraint pada pemrosesan konkuren.",
                metadata: ['fingerprint' => $fingerprint]
            );
            return null;
        } catch (\Throwable $e) {
            Log::error("Gagal menyimpan notifikasi pengguna: {$e->getMessage()}", ['user_id' => $user->id]);
            $this->deliveryService->recordLog(
                userId: $user->id,
                notificationId: null,
                status: NotificationDeliveryLog::STATUS_FAILED,
                fingerprint: $fingerprint,
                category: $category,
                urgency: $urgency,
                reason: "Kegagalan internal saat menyimpan notifikasi: " . $e->getMessage()
            );
            return null;
        }
    }

    /**
     * Dispatch notification for a Published AI Insight.
     * Only insights with verified evidence strength (canonical MEDIUM >= 0.700 or HIGH >= 0.900) are notified.
     * Preliminary draft, simulated, and low confidence insights are strictly excluded.
     */
    public function notifyPublishedInsight(AiInsight $insight): int
    {
        $score = (float) $insight->confidence_score;
        $level = $insight->confidence_level;

        // Guard 1: Must meet minimum verified evidence strength (canonical MEDIUM >= 0.700)
        // Scores < 0.700 (including 0.699, LOW 0.400, INSUFFICIENT_DATA 0.000) are rejected.
        if ($score < 0.700 
            || $level === 'LOW' 
            || $level === 'INSUFFICIENT_DATA'
            || empty($insight->title) 
            || empty($insight->summary)
            || in_array($insight->insight_type, ['preliminary_draft', 'draft'], true)
            || $insight->generation_mode === 'simulated') {
            return 0;
        }

        // Guard 2: Insight must not be expired
        if ($insight->created_at && $insight->created_at->lt(now()->subDays(2))) {
            return 0;
        }

        $regionId = $insight->region_id;
        $targetUserIds = collect();

        if ($regionId) {
            $targetUserIds = UserSavedRegion::where('region_id', $regionId)
                ->where('notify_alerts', true)
                ->pluck('user_id');
        }

        // If no region-specific users, target active users
        if ($targetUserIds->isEmpty()) {
            $targetUserIds = User::where('role', User::ROLE_USER)->limit(20)->pluck('id');
        }

        $targetUserIds = $targetUserIds->unique();
        $deliveredCount = 0;

        // Canonical Urgency Mapping based on Step 3 Evidence Strength:
        // HIGH Evidence (score >= 0.900) -> URGENCY_HIGH
        // MEDIUM Evidence (0.700 <= score < 0.900) -> URGENCY_MEDIUM
        $isHighEvidence = ($level === 'HIGH' || $score >= 0.900);
        $urgency = $isHighEvidence
            ? UserNotification::URGENCY_HIGH
            : UserNotification::URGENCY_MEDIUM;

        $materialKey = hash('sha256', ($isHighEvidence ? 'HIGH' : 'MEDIUM') . ':' . substr($insight->summary, 0, 100));

        foreach ($targetUserIds as $userId) {
            $user = User::find($userId);
            if (!$user) continue;

            $created = $this->createNotification($user, [
                'title' => sprintf("[Intelijen] %s", $insight->title),
                'body' => $insight->summary,
                'category' => UserNotification::CATEGORY_AI_INSIGHT,
                'urgency' => $urgency,
                'related_type' => 'ai_insight',
                'related_id' => $insight->id,
                'material_key' => $materialKey,
                'cooldown_minutes' => 360,
                'expires_at' => now()->addHours(24),
                'payload' => [
                    'insight_id' => $insight->id,
                    'region_id' => $insight->region_id,
                    'hazard_type_id' => $insight->hazard_type_id,
                    'evidence_strength' => $isHighEvidence ? 'HIGH' : 'MEDIUM',
                    'confidence_level' => $level,
                    'confidence_score' => $score,
                    'disclaimer' => 'Skor ini menunjukkan kekuatan bukti observasi terverifikasi, bukan probabilitas kejadian bencana.',
                ],
            ]);

            if ($created) {
                $deliveredCount++;
            }
        }

        return $deliveredCount;
    }

    /**
     * Dispatch notification for an Official Warning.
     * Only valid active warnings from official non-simulated sources are distributed.
     */
    public function notifyOfficialWarning(Alert $alert): int
    {
        // Guard 1: Must be active, not draft
        if ($alert->status !== 'active') {
            return 0;
        }

        // Guard 2: Must NOT be simulated data source
        if ($alert->hazardEvent && $alert->hazardEvent->dataSource && $alert->hazardEvent->dataSource->is_simulated) {
            return 0;
        }

        if ($alert->broadcast_level === 'national') {
            $targetUserIds = User::where('role', User::ROLE_USER)->pluck('id');
        } elseif ($alert->region_id) {
            $targetUserIds = UserSavedRegion::where('region_id', $alert->region_id)
                ->where('notify_alerts', true)
                ->pluck('user_id')
                ->unique();

            if ($targetUserIds->isEmpty()) {
                $targetUserIds = User::where('role', User::ROLE_USER)->limit(20)->pluck('id');
            }
        } else {
            return 0;
        }

        $deliveredCount = 0;
        $urgency = match ($alert->alert_class) {
            'official_warning' => UserNotification::URGENCY_CRITICAL,
            'platform_advisory' => UserNotification::URGENCY_HIGH,
            default => UserNotification::URGENCY_MEDIUM,
        };

        $materialKey = sprintf('%s:%s:%s', $alert->alert_class, $alert->broadcast_level, substr(md5($alert->message), 0, 8));

        foreach ($targetUserIds as $userId) {
            $user = User::find($userId);
            if (!$user) continue;

            $created = $this->createNotification($user, [
                'title' => sprintf("[Peringatan Resmi] %s", $alert->title),
                'body' => $alert->message,
                'category' => UserNotification::CATEGORY_OFFICIAL_WARNING,
                'urgency' => $urgency,
                'related_type' => 'alert',
                'related_id' => $alert->id,
                'material_key' => $materialKey,
                'cooldown_minutes' => 180,
                'expires_at' => $alert->expires_at ?? now()->addHours(12),
                'payload' => [
                    'alert_id' => $alert->id,
                    'region_id' => $alert->region_id,
                    'hazard_type_id' => $alert->hazard_type_id,
                    'alert_class' => $alert->alert_class,
                ],
            ]);

            if ($created) {
                $deliveredCount++;
            }
        }

        return $deliveredCount;
    }

    /**
     * Dispatch notification for community disaster report status change.
     * Excludes internal moderator notes and staff personal data for privacy.
     */
    public function notifyReportStatusChange(CommunityReport $report, string $oldStatus, string $newStatus): ?UserNotification
    {
        if (!$report->user_id) {
            return null;
        }

        $reporter = User::find($report->user_id);
        if (!$reporter) {
            return null;
        }

        // Relevant status changes only
        if (!in_array($newStatus, ['verified', 'rejected', 'investigating'], true)) {
            return null;
        }

        $statusLabel = match ($newStatus) {
            'verified' => 'Telah Diverifikasi',
            'rejected' => 'Ditolak / Tidak Tervalidasi',
            'investigating' => 'Dalam Investigasi Lapangan',
            default => ucfirst($newStatus),
        };

        $body = match ($newStatus) {
            'verified' => sprintf("Laporan bencana Anda '#%d: %s' telah berhasil diverifikasi oleh tim posko bencana dan ditampilkan pada peta situasi resmi.", $report->id, $report->title),
            'rejected' => sprintf("Laporan bencana Anda '#%d: %s' tidak dapat divalidasi berdasarkan bukti lapangan terkonfirmasi.", $report->id, $report->title),
            'investigating' => sprintf("Laporan bencana Anda '#%d: %s' sedang dalam proses verifikasi dan investigasi oleh petugas lapangan.", $report->id, $report->title),
            default => sprintf("Status laporan bencana Anda '#%d' diperbarui menjadi: %s.", $report->id, $statusLabel),
        };

        $urgency = $newStatus === 'verified' ? UserNotification::URGENCY_MEDIUM : UserNotification::URGENCY_INFO;
        $materialKey = sprintf('%s->%s', $oldStatus, $newStatus);

        return $this->createNotification($reporter, [
            'title' => sprintf("[Status Laporan] Laporan #%d %s", $report->id, $statusLabel),
            'body' => $body,
            'category' => UserNotification::CATEGORY_REPORT_STATUS,
            'urgency' => $urgency,
            'related_type' => 'community_report',
            'related_id' => $report->id,
            'material_key' => $materialKey,
            'cooldown_minutes' => 60,
            'expires_at' => now()->addDays(7),
            'payload' => [
                'report_id' => $report->id,
                'previous_status' => $oldStatus,
                'new_status' => $newStatus,
            ],
        ]);
    }

    /**
     * Dispatch notification with optional queueing if async queue worker is active.
     *
     * @param array<string, mixed> $data
     */
    public function dispatchNotification(User $user, array $data, bool $async = false): void
    {
        if ($async && config('queue.default') !== 'sync') {
            \App\Jobs\ProcessNotificationJob::dispatch($user->id, $data);
        } else {
            $this->createNotification($user, $data);
        }
    }

    /**
     * Legacy compatibility wrapper for alert notifications.
     */
    public function distributeAlertNotifications(Alert $alert): int
    {
        return $this->notifyOfficialWarning($alert);
    }
}
