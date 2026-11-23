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
            'assembly_point' => ['nullable', 'string', 'max:255'],
            'evacuation_route' => ['nullable', 'string'],
        ]);

        $updateData = [
            'title' => $validated['title'],
            'primary_meeting_point' => $validated['primary_meeting_point'] ?? ($validated['assembly_point'] ?? null),
            'secondary_meeting_point' => $validated['secondary_meeting_point'] ?? null,
            'evacuation_notes' => $validated['evacuation_notes'] ?? ($validated['evacuation_route'] ?? null),
        ];

        if (array_key_exists('custom_provisions', $validated)) {
            $updateData['custom_provisions'] = $validated['custom_provisions'];
        }

        $plan = PreparednessPlan::updateOrCreate(
            ['user_id' => $user->id],
            $updateData
        );

        return response()->json([
            'success' => true,
            'message' => 'Rencana siaga keluarga berhasil disimpan.',
            'data' => $plan,
        ]);
    }

    /**
     * List User Emergency Contacts.
     */
    public function getContacts(Request $request): JsonResponse
    {
        $contacts = PreparednessContact::where('user_id', $request->user()->id)
            ->orderBy('is_emergency_priority', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $contacts,
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
            'phone_number' => ['required', 'string', 'min:6', 'max:25', 'regex:/^\+?[0-9\s\-\(\)]{6,25}$/'],
            'is_emergency_priority' => ['nullable', 'boolean'],
            'is_primary' => ['nullable', 'boolean'],
        ], [
            'phone_number.regex' => 'Format nomor telepon tidak valid. Gunakan angka, spasi, tanda minus, atau kode negara internasional (+).',
        ]);

        $contact = PreparednessContact::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'relationship' => $validated['relationship'],
            'phone_number' => $validated['phone_number'],
            'is_emergency_priority' => $validated['is_emergency_priority'] ?? ($validated['is_primary'] ?? true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kontak darurat berhasil ditambahkan.',
            'data' => $contact,
        ], 201);
    }

    /**
     * Update Emergency Contact.
     */
    public function updateContact(Request $request, int $id): JsonResponse
    {
        $contact = PreparednessContact::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'relationship' => ['sometimes', 'required', 'string', 'max:50'],
            'phone_number' => ['sometimes', 'required', 'string', 'min:6', 'max:25', 'regex:/^\+?[0-9\s\-\(\)]{6,25}$/'],
            'is_emergency_priority' => ['nullable', 'boolean'],
            'is_primary' => ['nullable', 'boolean'],
        ], [
            'phone_number.regex' => 'Format nomor telepon tidak valid. Gunakan angka, spasi, tanda minus, atau kode negara internasional (+).',
        ]);

        $updateData = [];
        if (array_key_exists('name', $validated)) {
            $updateData['name'] = $validated['name'];
        }
        if (array_key_exists('relationship', $validated)) {
            $updateData['relationship'] = $validated['relationship'];
        }
        if (array_key_exists('phone_number', $validated)) {
            $updateData['phone_number'] = $validated['phone_number'];
        }
        if (array_key_exists('is_emergency_priority', $validated)) {
            $updateData['is_emergency_priority'] = $validated['is_emergency_priority'];
        } elseif (array_key_exists('is_primary', $validated)) {
            $updateData['is_emergency_priority'] = $validated['is_primary'];
        }

        $contact->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Kontak darurat berhasil diperbarui.',
            'data' => $contact->fresh(),
        ]);
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
     * Batch sync guest checklist progress into authenticated user's account.
     * Endpoint: POST /api/v1/user/preparedness/checklist/sync
     */
    public function syncChecklist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['nullable'],
            'item_ids' => ['nullable', 'array'],
            'item_ids.*' => ['integer'],
        ]);

        $rawItems = $validated['items'] ?? $validated['item_ids'] ?? [];
        if (!is_array($rawItems)) {
            $rawItems = [];
        }

        $result = $this->preparednessService->syncGuestChecklist($request->user(), $rawItems);

        return response()->json([
            'success' => true,
            'message' => $result['synced_count'] > 0
                ? "Berhasil menyinkronkan {$result['synced_count']} item tas siaga dari perangkat ke akun Anda."
                : 'Data kesiapsiagaan tas siaga telah mutakhir dengan akun Anda.',
            'data' => $result,
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
