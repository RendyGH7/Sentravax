<?php

namespace App\Services\Preparedness;

use App\Models\EmergencyScenario;
use App\Models\HazardType;
use App\Models\PreparednessChecklistItem;
use App\Models\PreparednessChecklistProgress;
use App\Models\PreparednessContact;
use App\Models\PreparednessPlan;
use App\Models\Region;
use App\Models\ScenarioAttempt;
use App\Models\ScenarioQuestion;
use App\Models\User;
use App\Models\UserSavedRegion;
use App\Services\RiskEngine\RiskEngineService;
use Illuminate\Support\Facades\DB;

class PreparednessService
{
    public function __construct(
        protected RiskEngineService $riskEngine
    ) {}

    /**
     * Flagship Feature: SENTRAVAX SIAGA PERSONAL — Cek Risiko Lokasi
     */
    public function checkLocation(float $latitude, float $longitude, ?int $regionId = null): array
    {
        $eval = $this->riskEngine->evaluateLocationRisk($latitude, $longitude, $regionId);

        // Fetch tailored preparedness checklist recommendations based on dominant hazards
        $essentialChecklist = PreparednessChecklistItem::where('is_essential', true)
            ->orderBy('sort_order')
            ->take(6)
            ->get(['id', 'category', 'name', 'description']);

        // Tailored actionable steps based on risk level
        $actionSteps = match ($eval['risk_level']) {
            'critical' => [
                'Siapkan Tas Siaga Bencana di dekat pintu keluar sekarang juga.',
                'Ketahui lokasi posko evakuasi aman dan rute darurat bebas rintangan.',
                'Pastikan nomor kontak darurat keluarga dan RT/RW tersimpan.',
                'Pantau arahan siaga dari posko BPBD dan siaran resmi BMKG.',
            ],
            'high' => [
                'Pastikan persediaan air minum dan obat-obatan rutin keluarga mencukupi untuk 3 hari.',
                'Amankan dokumen penting dan arsip keluarga ke dalam kantong kedap air.',
                'Periksa kondisi stopkontak dan saluran pembuangan air di sekitar rumah.',
            ],
            'medium' => [
                'Lengkapi isi tas siaga bencana secara bertahap.',
                'Diskusikan titik kumpul keluarga bila terjadi pemadaman listrik atau gempa.',
                'Pantau perkembangan prakiraan cuaca lokal melalui aplikasi SENTRAVAX.',
            ],
            default => [
                'Wilayah dalam kondisi aman dan kondusif.',
                'Tetap jaga kesiapsiagaan mandiri dan periksa masa kedaluwarsa obat di kotak P3K rumah.',
            ],
        };

        return [
            'location' => [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'region' => $eval['region'],
            ],
            'assessment' => [
                'risk_score' => $eval['risk_score'],
                'risk_level' => $eval['risk_level'],
                'risk_label' => $eval['risk_label'],
                'active_threats_count' => $eval['active_threats_count'],
                'active_alerts_count' => $eval['active_alerts_count'],
                'factors' => $eval['factors'],
                'assessed_at' => $eval['assessed_at'],
                'data_freshness' => $eval['data_freshness'],
            ],
            'recommendations' => [
                'action_steps' => $actionSteps,
                'recommended_checklist_items' => $essentialChecklist,
            ],
            'provenance' => [
                'source' => 'SENTRAVAX Multi-Hazard Geospatial Intelligence Engine',
                'data_sources' => ['BMKG', 'BNPB', 'PostGIS Regional Telemetry'],
                'disclaimer' => 'Penilaian risiko ini merupakan indikasi probabilistik berbasis data resmi yang tersedia, bukan prediksi mutlak terjadinya bencana.',
            ],
        ];
    }

    /**
     * Get User Preparedness Overview (Family Plan, Go-Bag Checklist progress, Saved Regions).
     */
    public function getUserPreparednessOverview(User $user): array
    {
        $plan = PreparednessPlan::firstOrCreate(
            ['user_id' => $user->id],
            ['title' => 'Rencana Siaga Keluarga ' . $user->name]
        );

        $contacts = PreparednessContact::where('user_id', $user->id)
            ->orderBy('is_emergency_priority', 'desc')
            ->get();

        $savedRegions = UserSavedRegion::where('user_id', $user->id)
            ->with('region')
            ->orderBy('is_primary', 'desc')
            ->get();

        // Checklist statistics
        $totalItems = PreparednessChecklistItem::count();
        $completedItemIds = PreparednessChecklistProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->pluck('checklist_item_id')
            ->toArray();

        $completedCount = count($completedItemIds);
        $completionPct = $totalItems > 0 ? round(($completedCount / $totalItems) * 100, 1) : 0;

        return [
            'plan' => $plan,
            'contacts' => $contacts,
            'saved_regions' => $savedRegions,
            'checklist_summary' => [
                'total_items' => $totalItems,
                'completed_items' => $completedCount,
                'completion_percentage' => $completionPct,
                'readiness_status' => $completionPct >= 80 ? 'Sangat Siaga' : ($completionPct >= 40 ? 'Cukup Siap' : 'Perlu Dilengkapi'),
            ],
        ];
    }

    /**
     * Toggle Checklist Item completion state for a user.
     */
    public function toggleChecklistItem(User $user, int $itemId): array
    {
        $item = PreparednessChecklistItem::findOrFail($itemId);

        $progress = PreparednessChecklistProgress::where('user_id', $user->id)
            ->where('checklist_item_id', $itemId)
            ->first();

        if ($progress && $progress->is_completed) {
            $progress->update([
                'is_completed' => false,
                'completed_at' => null,
            ]);
            $isCompleted = false;
        } else {
            PreparednessChecklistProgress::updateOrCreate(
                ['user_id' => $user->id, 'checklist_item_id' => $itemId],
                [
                    'is_completed' => true,
                    'completed_at' => now(),
                ]
            );
            $isCompleted = true;
        }

        $total = PreparednessChecklistItem::count();
        $completed = PreparednessChecklistProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->count();

        return [
            'item_id' => $itemId,
            'is_completed' => $isCompleted,
            'total_completed' => $completed,
            'percentage' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
        ];
    }

    /**
     * Submit and evaluate a Scenario Simulation Attempt.
     */
    public function evaluateScenarioAttempt(User $user, int $scenarioId, array $userAnswers): array
    {
        $scenario = EmergencyScenario::with('questions')->findOrFail($scenarioId);

        $totalScore = 0;
        $earnedScore = 0;
        $evalSummary = [];

        foreach ($scenario->questions as $q) {
            $qScore = $q->points;
            $totalScore += $qScore;

            $selectedOptionId = $userAnswers[$q->id] ?? null;

            // Search question options
            $correctOption = null;
            $userOption = null;

            foreach ($q->options as $opt) {
                if (!empty($opt['is_correct'])) {
                    $correctOption = $opt;
                }
                if ($selectedOptionId && ($opt['id'] ?? '') === $selectedOptionId) {
                    $userOption = $opt;
                }
            }

            $isCorrect = ($userOption && !empty($userOption['is_correct']));
            if ($isCorrect) {
                $earnedScore += $qScore;
            }

            $evalSummary[] = [
                'question_id' => $q->id,
                'question' => $q->question,
                'selected_option' => $selectedOptionId,
                'is_correct' => $isCorrect,
                'correct_option_id' => $correctOption['id'] ?? null,
                'explanation' => $isCorrect ? ($userOption['explanation'] ?? 'Tindakan Anda tepat!') : ($correctOption['explanation'] ?? 'Pilihan yang benar disarankan untuk meminimalkan risiko bahaya.'),
            ];
        }

        $passed = ($totalScore > 0) && (($earnedScore / $totalScore) >= 0.70); // 70% threshold

        $attempt = ScenarioAttempt::create([
            'user_id' => $user->id,
            'scenario_id' => $scenarioId,
            'score' => $earnedScore,
            'total_possible_score' => $totalScore,
            'passed' => $passed,
            'answers_summary' => $evalSummary,
            'completed_at' => now(),
        ]);

        return [
            'attempt_id' => $attempt->id,
            'scenario_id' => $scenarioId,
            'scenario_title' => $scenario->title,
            'earned_score' => $earnedScore,
            'total_possible_score' => $totalScore,
            'score_percentage' => $totalScore > 0 ? round(($earnedScore / $totalScore) * 100, 1) : 0,
            'passed' => $passed,
            'evaluation_summary' => $evalSummary,
        ];
    }
}

