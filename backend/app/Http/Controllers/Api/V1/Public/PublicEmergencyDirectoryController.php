<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PublicEmergencyDirectoryController extends Controller
{
    /**
     * Display a listing of verified and published emergency contacts.
     * Accessible by guests without authentication.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', Rule::in([
                EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                EmergencyContact::CATEGORY_SAR,
                EmergencyContact::CATEGORY_POLICE,
                EmergencyContact::CATEGORY_MEDICAL,
                EmergencyContact::CATEGORY_FIRE,
                EmergencyContact::CATEGORY_RED_CROSS,
                EmergencyContact::CATEGORY_OTHER,
            ])],
            'scope' => ['nullable', 'string', Rule::in([
                EmergencyContact::SCOPE_NATIONAL,
                EmergencyContact::SCOPE_PROVINCIAL,
                EmergencyContact::SCOPE_REGENCY,
            ])],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter filter tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Strict fail-closed public filter:
        // 1. Parent MUST be verified, published, and not soft-deleted.
        // 2. Parent MUST have at least one active & verified channel.
        // 3. Eager-loaded channels MUST only be active & verified.
        $query = EmergencyContact::query()
            ->where('verification_status', EmergencyContact::STATUS_VERIFIED)
            ->where('publication_status', EmergencyContact::PUB_PUBLISHED)
            ->whereHas('channels', function ($q) {
                $q->where('is_active', true)
                  ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED);
            })
            ->with([
                'region:id,code,name,level',
                'channels' => function ($q) {
                    $q->where('is_active', true)
                      ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                      ->orderByDesc('is_primary')
                      ->orderBy('sort_order')
                      ->orderBy('id');
                },
            ]);

        // Keyword search on name or description
        if ($request->filled('q')) {
            $search = '%' . strtolower($request->query('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$search])
                  ->orWhereHas('channels', function ($cq) use ($search) {
                      $cq->where('is_active', true)
                         ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                         ->where(function ($sq) use ($search) {
                             $sq->whereRaw('LOWER(label) LIKE ?', [$search])
                                ->orWhereRaw('LOWER(value) LIKE ?', [$search]);
                         });
                  });
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        // Scope filter
        if ($request->filled('scope')) {
            $query->where('scope', $request->query('scope'));
        }

        // Region filter: strictly isolate regional contacts, never mixing national with region
        if ($request->filled('region_id')) {
            $query->where('region_id', $request->query('region_id'));
        }

        $perPage = $request->integer('per_page', 20);
        $contacts = $query->orderBy('scope')->orderBy('name')->paginate($perPage);

        // Format items to remove internal fields
        $formattedItems = collect($contacts->items())->map(fn ($contact) => $this->formatPublicContact($contact));

        return response()->json([
            'success' => true,
            'message' => 'Direktori kontak darurat berhasil dimuat.',
            'data' => $formattedItems,
            'meta' => [
                'current_page' => $contacts->currentPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
                'last_page' => $contacts->lastPage(),
            ],
        ]);
    }

    /**
     * Display the specified emergency contact detail.
     * Accessible by guests without authentication.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $query = EmergencyContact::query()
            ->where('verification_status', EmergencyContact::STATUS_VERIFIED)
            ->where('publication_status', EmergencyContact::PUB_PUBLISHED)
            ->whereHas('channels', function ($q) {
                $q->where('is_active', true)
                  ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED);
            })
            ->with([
                'region:id,code,name,level',
                'channels' => function ($q) {
                    $q->where('is_active', true)
                      ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                      ->orderByDesc('is_primary')
                      ->orderBy('sort_order')
                      ->orderBy('id');
                },
            ]);

        if (is_numeric($idOrSlug)) {
            $contact = $query->where('id', (int) $idOrSlug)->first();
        } else {
            $contact = $query->where('slug', $idOrSlug)->first();
        }

        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan atau belum dipublikasikan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail kontak darurat berhasil dimuat.',
            'data' => $this->formatPublicContact($contact),
        ]);
    }

    /**
     * Sanitize and format public emergency contact data.
     * Prevents leakage of internal metadata, unverified items, or administrative audit trails.
     */
    private function formatPublicContact(EmergencyContact $contact): array
    {
        return [
            'id' => $contact->id,
            'name' => $contact->name,
            'slug' => $contact->slug,
            'category' => $contact->category,
            'scope' => $contact->scope,
            'region' => $contact->region ? [
                'id' => $contact->region->id,
                'code' => $contact->region->code,
                'name' => $contact->region->name,
                'level' => $contact->region->level,
            ] : null,
            'address' => $contact->address,
            'latitude' => $contact->latitude ? (float) $contact->latitude : null,
            'longitude' => $contact->longitude ? (float) $contact->longitude : null,
            'description' => $contact->description,
            'channels' => $contact->channels->map(function ($ch) {
                return [
                    'id' => $ch->id,
                    'channel_type' => $ch->channel_type,
                    'channel_classification' => $ch->channel_classification,
                    'label' => $ch->label,
                    'value' => $ch->value,
                    'is_toll_free' => (bool) $ch->is_toll_free,
                    'is_primary' => (bool) $ch->is_primary,
                    'operating_hours' => $ch->operating_hours,
                    'source_name' => $ch->source_name,
                    'source_url' => $ch->source_url,
                    'verified_at' => $ch->verified_at?->toIso8601String(),
                    'sort_order' => (int) $ch->sort_order,
                ];
            })->values(),
        ];
    }
}
