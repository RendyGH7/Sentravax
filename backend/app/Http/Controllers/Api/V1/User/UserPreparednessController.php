<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Models\EmergencyScenario;
use App\Models\PreparednessChecklistItem;
use App\Models\PreparednessChecklistProgress;
use App\Models\PreparednessContact;
use App\Models\PreparednessPlan;
use App\Services\Preparedness\PreparednessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPreparednessController extends Controller
{
    public function __construct(
        protected PreparednessService $preparednessService
    ) {}

    /**
     * Get or Create Family Preparedness Plan.
     */
    public function getPlan(Request $request): JsonResponse
    {
        $user = $request->user();
        $plan = PreparednessPlan::firstOrCreate(
            ['user_id' => $user->id],
            ['title' => 'Rencana Siaga Keluarga ' . $user->name]
        );

        $contacts = PreparednessContact::where('user_id', $user->id)
            ->orderBy('is_emergency_priority', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'plan' => $plan,
                'contacts' => $contacts,
            ],
        ]);
    }

    /**
     * Update Family Preparedness Plan.
     */
    public function updatePlan(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'primary_meeting_point' => ['nullable', 'string', 'max:255'],
            'secondary_meeting_point' => ['nullable', 'string', 'max:255'],
            'evacuation_notes' => ['nullable', 'string'],
            'custom_provisions' => ['nullable', 'array'],
        ]);

        $plan = PreparednessPlan::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Rencana siaga keluarga berhasil disimpan.',
            'data' => $plan,
        ]);
    }

    /**
     * Add Emergency Contact.
     */
    public function addContact(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'relationship' => ['required', 'string', 'max:50'],
            'phone_number' => ['required', 'string', 'max:30'],
            'is_emergency_priority' => ['nullable', 'boolean'],
        ]);

        $contact = PreparednessContact::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'relationship' => $validated['relationship'],
            'phone_number' => $validated['phone_number'],
            'is_emergency_priority' => $validated['is_emergency_priority'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kontak darurat berhasil ditambahkan.',
            'data' => $contact,
        ], 201);
    }

    /**
     * Delete Emergency Contact.
     */
    public function deleteContact(Request $request, int $id): JsonResponse
    {
        $contact = PreparednessContact::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();
        $contact->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kontak darurat berhasil dihapus.',
        ]);
    }

    /**
     * List Master Checklist Items with User Completion Status.
     */
    public function getChecklist(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = PreparednessChecklistItem::orderBy('category')->orderBy('sort_order')->get();

        $userProgress = PreparednessChecklistProgress::where('user_id', $user->id)
            ->pluck('is_completed', 'checklist_item_id')
            ->toArray();

        $data = $items->groupBy('category')->map(function ($group) use ($userProgress) {
            return $group->map(function ($it) use ($userProgress) {
                return [
                    'id' => $it->id,
                    'name' => $it->name,
                    'description' => $it->description,
                    'is_essential' => $it->is_essential,
                    'is_completed' => !empty($userProgress[$it->id]),
                ];
            });
        });

        $total = $items->count();
        $completed = count(array_filter($userProgress));

        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $data,
                'stats' => [
                    'total_items' => $total,
                    'completed_items' => $completed,
                    'percentage' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                ],
            ],
        ]);
    }

    /**
     * Toggle Checklist Item.
     */
    public function toggleChecklistItem(Request $request, int $id): JsonResponse
    {
        $res = $this->preparednessService->toggleChecklistItem($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => $res['is_completed'] ? 'Item ditandai siap dalam tas siaga.' : 'Item ditandai belum siap.',
            'data' => $res,
        ]);
    }

    /**
     * List Simulation Scenarios.
     */
    public function scenarios(): JsonResponse
    {
        $scenarios = EmergencyScenario::where('is_active', true)
            ->withCount('questions')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $scenarios,
        ]);
    }

    /**
     * Single Scenario Detail with Questions.
     */
    public function scenarioDetail(string $identifier): JsonResponse
    {
        $scenario = EmergencyScenario::with(['questions', 'hazardType'])
            ->where(function ($q) use ($identifier) {
                if (is_numeric($identifier)) {
                    $q->where('id', (int) $identifier);
                } else {
                    $q->where('slug', $identifier);
                }
            })
            ->where('is_active', true)
            ->firstOrFail();

        // Sanitize options so is_correct is not leaked before submission
        $sanitizedQuestions = $scenario->questions->map(function ($q) {
            $options = array_map(function ($opt) {
                return [
                    'id' => $opt['id'] ?? '',
                    'text' => $opt['text'] ?? '',
                ];
            }, $q->options ?? []);

            return [
                'id' => $q->id,
                'question' => $q->question,
                'points' => $q->points,
                'options' => $options,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $scenario->id,
                'title' => $scenario->title,
                'slug' => $scenario->slug,
                'difficulty' => $scenario->difficulty,
                'description' => $scenario->description,
                'context_brief' => $scenario->context_brief,
                'estimated_minutes' => $scenario->estimated_minutes,
                'hazard_type' => $scenario->hazardType,
                'questions' => $sanitizedQuestions,
            ],
        ]);
    }

    /**
     * Submit Simulation Scenario Answers for Evaluation.
     */
    public function submitAttempt(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'answers' => ['required', 'array'], // [question_id => selected_option_id]
        ]);

        $eval = $this->preparednessService->evaluateScenarioAttempt(
            $request->user(),
            $id,
            $validated['answers']
        );

        return response()->json([
            'success' => true,
            'message' => $eval['passed'] ? 'Selamat! Anda lulus simulasi kesiapsiagaan.' : 'Simulasi selesai. Tinjau kembali evaluasi tindakan keselamatan.',
            'data' => $eval,
        ]);
    }
}
