<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmergencyContact;
use App\Models\EmergencyContactChannel;
use App\Models\EmergencyDirectoryAuditLog;
use App\Models\Region;
use App\Services\EmergencyDirectory\EmergencyDirectoryAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class AdminEmergencyDirectoryController extends Controller
{
    public function __construct(
        protected EmergencyDirectoryAuditService $auditService
    ) {}

    /**
     * List all emergency contacts with filtering, pagination, and summary statistics.
     * Accessible by Admin (full) and Intelligence (read-only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmergencyContact::query()->with([
            'region:id,code,name,level',
            'creator:id,name,email',
            'updater:id,name,email',
            'channels' => function ($q) {
                $q->orderByDesc('is_primary')->orderBy('sort_order')->orderBy('id');
            },
        ]);

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if ($request->filled('q')) {
            $search = '%' . strtolower($request->query('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(slug) LIKE ?', [$search])
                  ->orWhereHas('channels', function ($cq) use ($search) {
                      $cq->whereRaw('LOWER(label) LIKE ?', [$search])
                         ->orWhereRaw('LOWER(value) LIKE ?', [$search]);
                  });
            });
        }

        if ($request->filled('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('scope') && $request->query('scope') !== 'all') {
            $query->where('scope', $request->query('scope'));
        }

        if ($request->filled('verification_status') && $request->query('verification_status') !== 'all') {
            $query->where('verification_status', $request->query('verification_status'));
        }

        if ($request->filled('publication_status') && $request->query('publication_status') !== 'all') {
            $query->where('publication_status', $request->query('publication_status'));
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->query('region_id'));
        }

        $perPage = $request->integer('per_page', 20);
        $contacts = $query->latest('id')->paginate($perPage);

        // Calculate summary statistics
        $stats = [
            'total' => EmergencyContact::count(),
            'verified' => EmergencyContact::where('verification_status', EmergencyContact::STATUS_VERIFIED)->count(),
            'unverified' => EmergencyContact::where('verification_status', EmergencyContact::STATUS_UNVERIFIED)->count(),
            'published' => EmergencyContact::where('publication_status', EmergencyContact::PUB_PUBLISHED)->count(),
            'draft' => EmergencyContact::where('publication_status', EmergencyContact::PUB_DRAFT)->count(),
            'archived' => EmergencyContact::where('publication_status', EmergencyContact::PUB_ARCHIVED)->count(),
            'total_channels' => EmergencyContactChannel::count(),
            'active_channels' => EmergencyContactChannel::where('is_active', true)->count(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Daftar kontak darurat admin berhasil dimuat.',
            'data' => $contacts->items(),
            'meta' => [
                'current_page' => $contacts->currentPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
                'last_page' => $contacts->lastPage(),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Display the specified emergency contact detail for administrative view.
     */
    public function show($id): JsonResponse
    {
        $contact = EmergencyContact::withTrashed()
            ->with([
                'region:id,code,name,level',
                'creator:id,name,email',
                'updater:id,name,email',
                'channels' => function ($q) {
                    $q->orderByDesc('is_primary')->orderBy('sort_order')->orderBy('id');
                },
            ])
            ->find($id);

        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail kontak darurat admin berhasil dimuat.',
            'data' => $contact,
        ]);
    }

    /**
     * Store a newly created emergency contact and optional initial channels.
     * Strictly restricted to role:admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:emergency_contacts,slug'],
            'category' => ['required', 'string', Rule::in([
                EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                EmergencyContact::CATEGORY_SAR,
                EmergencyContact::CATEGORY_POLICE,
                EmergencyContact::CATEGORY_MEDICAL,
                EmergencyContact::CATEGORY_FIRE,
                EmergencyContact::CATEGORY_RED_CROSS,
                EmergencyContact::CATEGORY_OTHER,
            ])],
            'scope' => ['required', 'string', Rule::in([
                EmergencyContact::SCOPE_NATIONAL,
                EmergencyContact::SCOPE_PROVINCIAL,
                EmergencyContact::SCOPE_REGENCY,
            ])],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'address' => ['nullable', 'string', 'max:1000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'description' => ['nullable', 'string'],
            'verification_status' => ['nullable', 'string', Rule::in([
                EmergencyContact::STATUS_VERIFIED,
                EmergencyContact::STATUS_UNVERIFIED,
                EmergencyContact::STATUS_SOURCE_UNAVAILABLE,
                EmergencyContact::STATUS_REJECTED,
            ])],
            'publication_status' => ['nullable', 'string', Rule::in([
                EmergencyContact::PUB_DRAFT,
                EmergencyContact::PUB_PUBLISHED,
                EmergencyContact::PUB_ARCHIVED,
            ])],
            'channels' => ['nullable', 'array'],
            'channels.*.channel_type' => ['required', 'string', Rule::in([
                EmergencyContactChannel::TYPE_SHORTCODE,
                EmergencyContactChannel::TYPE_PHONE,
                EmergencyContactChannel::TYPE_WHATSAPP,
                EmergencyContactChannel::TYPE_EMAIL,
                EmergencyContactChannel::TYPE_WEBSITE,
            ])],
            'channels.*.channel_classification' => ['required', 'string', Rule::in([
                EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                EmergencyContactChannel::CLASS_OFFICE_CONTACT,
                EmergencyContactChannel::CLASS_INFORMATIONAL_CONTACT,
            ])],
            'channels.*.label' => ['required', 'string', 'max:150'],
            'channels.*.value' => ['required', 'string', 'max:255'],
            'channels.*.is_toll_free' => ['nullable', 'boolean'],
            'channels.*.is_primary' => ['nullable', 'boolean'],
            'channels.*.operating_hours' => ['nullable', 'string', 'max:150'],
            'channels.*.verification_status' => ['nullable', 'string', Rule::in([
                EmergencyContactChannel::STATUS_VERIFIED,
                EmergencyContactChannel::STATUS_UNVERIFIED,
                EmergencyContactChannel::STATUS_SOURCE_UNAVAILABLE,
                EmergencyContactChannel::STATUS_REJECTED,
            ])],
            'channels.*.source_name' => ['required', 'string', 'max:150'],
            'channels.*.source_url' => ['required', 'url', 'max:500'],
            'channels.*.verification_notes' => ['nullable', 'string'],
            'channels.*.sort_order' => ['nullable', 'integer'],
            'channels.*.is_active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: periksa kembali isian formulir.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Validate scope vs region level alignment
        $scope = $request->input('scope');
        $regionId = $request->input('region_id');

        if ($scope === EmergencyContact::SCOPE_NATIONAL && $regionId !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak berskala nasional harus memiliki region_id bernilai null.',
                'errors' => ['region_id' => ['Kontak berskala nasional tidak boleh terikat pada region spesifik.']],
            ], 422);
        }

        if ($scope !== EmergencyContact::SCOPE_NATIONAL) {
            if ($regionId === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kontak berskala daerah wajib memilih wilayah yang valid.',
                    'errors' => ['region_id' => ['Region wajib diisi untuk kontak daerah.']],
                ], 422);
            }

            $region = Region::find($regionId);
            $expectedLevel = $scope === EmergencyContact::SCOPE_PROVINCIAL ? 'province' : 'regency';
            if (! $region || $region->level !== $expectedLevel) {
                return response()->json([
                    'success' => false,
                    'message' => "Kontak skala {$scope} harus merujuk ke region dengan level '{$expectedLevel}'.",
                    'errors' => ['region_id' => ["Wilayah yang dipilih bertingkat '{$region?->level}', diharapkan '{$expectedLevel}'."]],
                ], 422);
            }
        }

        // Check primary channel conflict if channels are provided
        $channelsData = $request->input('channels', []);
        $primaryCount = 0;
        foreach ($channelsData as $ch) {
            $isActive = $ch['is_active'] ?? true;
            $isPrimary = $ch['is_primary'] ?? false;
            if ($isActive && $isPrimary) {
                $primaryCount++;
            }
        }
        if ($primaryCount > 1) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya boleh ada satu primary active channel per kontak.',
                'errors' => ['channels' => ['Terdeteksi lebih dari satu channel utama (primary) yang aktif.']],
            ], 422);
        }

        // Publication guard: cannot publish unless verified AND has at least 1 verified active channel
        $pubStatus = $request->input('publication_status', EmergencyContact::PUB_DRAFT);
        $verStatus = $request->input('verification_status', EmergencyContact::STATUS_UNVERIFIED);

        if ($pubStatus === EmergencyContact::PUB_PUBLISHED) {
            if ($verStatus !== EmergencyContact::STATUS_VERIFIED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kontak yang belum terverifikasi tidak dapat langsung dipublikasikan.',
                    'errors' => ['publication_status' => ['Verifikasi kontak terlebih dahulu sebelum mempublikasikannya.']],
                ], 422);
            }

            $hasActiveVerified = false;
            foreach ($channelsData as $ch) {
                if (($ch['is_active'] ?? true) && ($ch['verification_status'] ?? '') === EmergencyContactChannel::STATUS_VERIFIED) {
                    $hasActiveVerified = true;
                    break;
                }
            }
            if (! $hasActiveVerified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kontak hanya dapat dipublikasikan jika memiliki minimal satu channel aktif yang terverifikasi.',
                    'errors' => ['publication_status' => ['Minimal satu channel aktif harus terverifikasi untuk publikasi.']],
                ], 422);
            }
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        try {
            $contact = DB::transaction(function () use ($request, $channelsData, $pubStatus, $verStatus, $actorId, $ipAddress) {
                $name = $request->input('name');
                $slug = $request->filled('slug')
                    ? Str::slug($request->input('slug'))
                    : Str::slug($name) . '-' . Str::random(4);

                $contact = EmergencyContact::create([
                    'name' => $name,
                    'slug' => $slug,
                    'category' => $request->input('category'),
                    'scope' => $request->input('scope'),
                    'region_id' => $request->input('region_id'),
                    'address' => $request->input('address'),
                    'latitude' => $request->input('latitude'),
                    'longitude' => $request->input('longitude'),
                    'description' => $request->input('description'),
                    'verification_status' => $verStatus,
                    'publication_status' => $pubStatus,
                    'created_by' => $actorId,
                    'updated_by' => $actorId,
                ]);

                // Audit parent contact creation
                $this->auditService->recordContactCreated($contact, $actorId, $ipAddress);

                foreach ($channelsData as $ch) {
                    $isVerified = ($ch['verification_status'] ?? EmergencyContactChannel::STATUS_UNVERIFIED) === EmergencyContactChannel::STATUS_VERIFIED;
                    $channel = EmergencyContactChannel::create([
                        'emergency_contact_id' => $contact->id,
                        'channel_type' => $ch['channel_type'],
                        'channel_classification' => $ch['channel_classification'],
                        'label' => $ch['label'],
                        'value' => $ch['value'],
                        'is_toll_free' => $ch['is_toll_free'] ?? false,
                        'is_primary' => $ch['is_primary'] ?? false,
                        'operating_hours' => $ch['operating_hours'] ?? null,
                        'verification_status' => $ch['verification_status'] ?? EmergencyContactChannel::STATUS_UNVERIFIED,
                        'source_name' => $ch['source_name'],
                        'source_url' => $ch['source_url'],
                        'verified_at' => $isVerified ? now() : null,
                        'verification_notes' => $ch['verification_notes'] ?? null,
                        'sort_order' => $ch['sort_order'] ?? 0,
                        'is_active' => $ch['is_active'] ?? true,
                    ]);

                    // Audit channel creation
                    $this->auditService->recordChannelCreated($channel, $actorId, $ipAddress);
                }

                return $contact->load(['region', 'channels']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Kontak darurat berhasil dibuat.',
                'data' => $contact,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan kontak darurat: ' . $e->getMessage(),
                'error' => 'INTERNAL_ERROR',
            ], 500);
        }
    }

    /**
     * Update the specified emergency contact.
     * Strictly restricted to role:admin.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $contact = EmergencyContact::find($id);
        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('emergency_contacts', 'slug')->ignore($contact->id)],
            'category' => ['sometimes', 'required', 'string', Rule::in([
                EmergencyContact::CATEGORY_DISASTER_MANAGEMENT,
                EmergencyContact::CATEGORY_SAR,
                EmergencyContact::CATEGORY_POLICE,
                EmergencyContact::CATEGORY_MEDICAL,
                EmergencyContact::CATEGORY_FIRE,
                EmergencyContact::CATEGORY_RED_CROSS,
                EmergencyContact::CATEGORY_OTHER,
            ])],
            'scope' => ['sometimes', 'required', 'string', Rule::in([
                EmergencyContact::SCOPE_NATIONAL,
                EmergencyContact::SCOPE_PROVINCIAL,
                EmergencyContact::SCOPE_REGENCY,
            ])],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'address' => ['nullable', 'string', 'max:1000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'description' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: periksa kembali isian Anda.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newScope = $request->input('scope', $contact->scope);
        $newRegionId = $request->has('region_id') ? $request->input('region_id') : $contact->region_id;

        if ($newScope === EmergencyContact::SCOPE_NATIONAL && $newRegionId !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak berskala nasional harus memiliki region_id bernilai null.',
                'errors' => ['region_id' => ['Kontak berskala nasional tidak boleh terikat pada region spesifik.']],
            ], 422);
        }

        if ($newScope !== EmergencyContact::SCOPE_NATIONAL) {
            if ($newRegionId === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kontak berskala daerah wajib memilih wilayah yang valid.',
                    'errors' => ['region_id' => ['Region wajib diisi untuk kontak daerah.']],
                ], 422);
            }

            $region = Region::find($newRegionId);
            $expectedLevel = $newScope === EmergencyContact::SCOPE_PROVINCIAL ? 'province' : 'regency';
            if (! $region || $region->level !== $expectedLevel) {
                return response()->json([
                    'success' => false,
                    'message' => "Kontak skala {$newScope} harus merujuk ke region dengan level '{$expectedLevel}'.",
                    'errors' => ['region_id' => ["Wilayah yang dipilih bertingkat '{$region?->level}', diharapkan '{$expectedLevel}'."]],
                ], 422);
            }
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        try {
            DB::transaction(function () use ($contact, $request, $newScope, $newRegionId, $actorId, $ipAddress) {
                $oldSnapshot = $this->auditService->captureContactSnapshot($contact);

                $contact->fill($request->only([
                    'name', 'slug', 'category', 'address', 'latitude', 'longitude', 'description'
                ]));
                $contact->scope = $newScope;
                $contact->region_id = $newRegionId;
                $contact->updated_by = $actorId;
                $contact->save();

                // Audit parent contact update (returns null on no-op)
                $this->auditService->recordContactUpdated($contact, $oldSnapshot, $actorId, $ipAddress);
            });

            return response()->json([
                'success' => true,
                'message' => 'Data kontak darurat berhasil diperbarui.',
                'data' => $contact->fresh(['region', 'channels']),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui kontak: ' . $e->getMessage(),
                'error' => 'INTERNAL_ERROR',
            ], 500);
        }
    }

    /**
     * Soft delete the specified emergency contact.
     * Strictly restricted to role:admin.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $contact = EmergencyContact::find($id);
        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        DB::transaction(function () use ($contact, $actorId, $ipAddress) {
            $contact->delete();
            $this->auditService->recordContactSoftDeleted($contact, $actorId, $ipAddress);
        });

        return response()->json([
            'success' => true,
            'message' => "Kontak darurat '{$contact->name}' berhasil diarsipkan (soft delete).",
        ]);
    }

    /**
     * Update publication status of a contact.
     * Strictly restricted to role:admin.
     */
    public function updatePublicationStatus(Request $request, $id): JsonResponse
    {
        $contact = EmergencyContact::find($id);
        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'publication_status' => ['required', 'string', Rule::in([
                EmergencyContact::PUB_DRAFT,
                EmergencyContact::PUB_PUBLISHED,
                EmergencyContact::PUB_ARCHIVED,
            ])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Status publikasi tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $targetStatus = $request->input('publication_status');
        $oldStatus = $contact->publication_status;

        // No-op check: do not audit or mutate if no change
        if ($targetStatus === $oldStatus) {
            return response()->json([
                'success' => true,
                'message' => "Status publikasi kontak tidak berubah ('{$targetStatus}').",
                'data' => $contact->fresh(['channels']),
            ]);
        }

        // Business rule: Cannot publish if contact unverified or has 0 active verified channels
        if ($targetStatus === EmergencyContact::PUB_PUBLISHED) {
            if ($contact->verification_status !== EmergencyContact::STATUS_VERIFIED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kontak yang berstatus tidak terverifikasi (unverified/rejected) tidak boleh dipublikasikan.',
                    'errors' => ['publication_status' => ['Verifikasi kontak terlebih dahulu sebelum dipublikasikan.']],
                ], 422);
            }

            $hasActiveVerified = $contact->channels()
                ->where('is_active', true)
                ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                ->exists();

            if (! $hasActiveVerified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kontak tidak dapat dipublikasikan karena tidak memiliki satupun channel aktif yang terverifikasi.',
                    'errors' => ['publication_status' => ['Minimal harus ada satu channel aktif yang terverifikasi.']],
                ], 422);
            }
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        DB::transaction(function () use ($contact, $targetStatus, $oldStatus, $actorId, $ipAddress) {
            $contact->publication_status = $targetStatus;
            $contact->updated_by = $actorId;
            $contact->save();

            $this->auditService->recordContactPublicationChanged($contact, $oldStatus, $targetStatus, $actorId, $ipAddress);
        });

        return response()->json([
            'success' => true,
            'message' => "Status publikasi kontak diubah menjadi '{$targetStatus}'.",
            'data' => $contact->fresh(['channels']),
        ]);
    }

    /**
     * Update verification status of a contact.
     * Strictly restricted to role:admin.
     */
    public function updateVerificationStatus(Request $request, $id): JsonResponse
    {
        $contact = EmergencyContact::find($id);
        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => ['required', 'string', Rule::in([
                EmergencyContact::STATUS_VERIFIED,
                EmergencyContact::STATUS_UNVERIFIED,
                EmergencyContact::STATUS_SOURCE_UNAVAILABLE,
                EmergencyContact::STATUS_REJECTED,
            ])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Status verifikasi tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $targetStatus = $request->input('verification_status');
        $oldStatus = $contact->verification_status;

        // No-op check: do not audit or mutate if no change
        if ($targetStatus === $oldStatus) {
            return response()->json([
                'success' => true,
                'message' => "Status verifikasi kontak tidak berubah ('{$targetStatus}').",
                'data' => $contact->fresh(['channels']),
            ]);
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        DB::transaction(function () use ($contact, $targetStatus, $oldStatus, $actorId, $ipAddress) {
            $contact->verification_status = $targetStatus;
            $contact->updated_by = $actorId;

            // Fail-closed rule: If parent verification is revoked, automatically revert publication to draft
            $wasAutoDemoted = false;
            $oldPubStatus = $contact->publication_status;
            if ($targetStatus !== EmergencyContact::STATUS_VERIFIED && $oldPubStatus === EmergencyContact::PUB_PUBLISHED) {
                $contact->publication_status = EmergencyContact::PUB_DRAFT;
                $wasAutoDemoted = true;
            }

            $contact->save();

            // Record verification change
            $this->auditService->recordContactVerificationChanged($contact, $oldStatus, $targetStatus, $actorId, $ipAddress);

            // Record auto-demotion side effect if triggered
            if ($wasAutoDemoted) {
                $this->auditService->recordPublicationAutoDemotedDueToVerification(
                    $contact,
                    $oldPubStatus,
                    EmergencyContact::PUB_DRAFT,
                    $actorId,
                    $ipAddress
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Status verifikasi kontak diubah menjadi '{$targetStatus}'.",
            'data' => $contact->fresh(['channels']),
        ]);
    }

    /**
     * Add a channel to an existing emergency contact.
     * Strictly restricted to role:admin.
     */
    public function storeChannel(Request $request, $contactId): JsonResponse
    {
        $contact = EmergencyContact::find($contactId);
        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'channel_type' => ['required', 'string', Rule::in([
                EmergencyContactChannel::TYPE_SHORTCODE,
                EmergencyContactChannel::TYPE_PHONE,
                EmergencyContactChannel::TYPE_WHATSAPP,
                EmergencyContactChannel::TYPE_EMAIL,
                EmergencyContactChannel::TYPE_WEBSITE,
            ])],
            'channel_classification' => ['required', 'string', Rule::in([
                EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                EmergencyContactChannel::CLASS_OFFICE_CONTACT,
                EmergencyContactChannel::CLASS_INFORMATIONAL_CONTACT,
            ])],
            'label' => ['required', 'string', 'max:150'],
            'value' => ['required', 'string', 'max:255'],
            'is_toll_free' => ['nullable', 'boolean'],
            'is_primary' => ['nullable', 'boolean'],
            'operating_hours' => ['nullable', 'string', 'max:150'],
            'verification_status' => ['nullable', 'string', Rule::in([
                EmergencyContactChannel::STATUS_VERIFIED,
                EmergencyContactChannel::STATUS_UNVERIFIED,
                EmergencyContactChannel::STATUS_SOURCE_UNAVAILABLE,
                EmergencyContactChannel::STATUS_REJECTED,
            ])],
            'source_name' => ['required', 'string', 'max:150'],
            'source_url' => ['required', 'url', 'max:500'],
            'verification_notes' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: periksa kembali isian channel.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $isPrimary = $request->boolean('is_primary', false);
        $isActive = $request->boolean('is_active', true);
        $verificationStatus = $request->input('verification_status', EmergencyContactChannel::STATUS_UNVERIFIED);
        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        try {
            $channel = DB::transaction(function () use ($contact, $request, $isPrimary, $isActive, $verificationStatus, $actorId, $ipAddress) {
                // If setting as active primary, atomically unset any existing active primary channel
                if ($isPrimary && $isActive) {
                    $existingPrimaries = EmergencyContactChannel::where('emergency_contact_id', $contact->id)
                        ->where('is_primary', true)
                        ->get();

                    foreach ($existingPrimaries as $prevPrimary) {
                        $prevPrimary->is_primary = false;
                        $prevPrimary->save();

                        // Audit demotion of previous primary
                        $this->auditService->recordChannelPrimaryDemoted($prevPrimary, $actorId, $ipAddress);
                    }
                }

                $channel = EmergencyContactChannel::create([
                    'emergency_contact_id' => $contact->id,
                    'channel_type' => $request->input('channel_type'),
                    'channel_classification' => $request->input('channel_classification'),
                    'label' => $request->input('label'),
                    'value' => $request->input('value'),
                    'is_toll_free' => $request->boolean('is_toll_free', false),
                    'is_primary' => $isPrimary,
                    'operating_hours' => $request->input('operating_hours'),
                    'verification_status' => $verificationStatus,
                    'source_name' => $request->input('source_name'),
                    'source_url' => $request->input('source_url'),
                    'verified_at' => $verificationStatus === EmergencyContactChannel::STATUS_VERIFIED ? now() : null,
                    'verification_notes' => $request->input('verification_notes'),
                    'sort_order' => $request->integer('sort_order', 0),
                    'is_active' => $isActive,
                ]);

                // Audit channel creation
                $this->auditService->recordChannelCreated($channel, $actorId, $ipAddress);

                return $channel;
            });

            return response()->json([
                'success' => true,
                'message' => 'Channel kontak berhasil ditambahkan.',
                'data' => $channel,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan channel: ' . $e->getMessage(),
                'error' => 'INTERNAL_ERROR',
            ], 500);
        }
    }

    /**
     * Update an existing channel.
     * Strictly restricted to role:admin.
     */
    public function updateChannel(Request $request, $contactId, $channelId): JsonResponse
    {
        $channel = EmergencyContactChannel::where('emergency_contact_id', $contactId)
            ->where('id', $channelId)
            ->first();

        if (! $channel) {
            return response()->json([
                'success' => false,
                'message' => 'Channel kontak tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'channel_type' => ['sometimes', 'required', 'string', Rule::in([
                EmergencyContactChannel::TYPE_SHORTCODE,
                EmergencyContactChannel::TYPE_PHONE,
                EmergencyContactChannel::TYPE_WHATSAPP,
                EmergencyContactChannel::TYPE_EMAIL,
                EmergencyContactChannel::TYPE_WEBSITE,
            ])],
            'channel_classification' => ['sometimes', 'required', 'string', Rule::in([
                EmergencyContactChannel::CLASS_EMERGENCY_HOTLINE,
                EmergencyContactChannel::CLASS_OPERATIONAL_CONTACT,
                EmergencyContactChannel::CLASS_OFFICE_CONTACT,
                EmergencyContactChannel::CLASS_INFORMATIONAL_CONTACT,
            ])],
            'label' => ['sometimes', 'required', 'string', 'max:150'],
            'value' => ['sometimes', 'required', 'string', 'max:255'],
            'is_toll_free' => ['nullable', 'boolean'],
            'is_primary' => ['nullable', 'boolean'],
            'operating_hours' => ['nullable', 'string', 'max:150'],
            'verification_status' => ['sometimes', 'required', 'string', Rule::in([
                EmergencyContactChannel::STATUS_VERIFIED,
                EmergencyContactChannel::STATUS_UNVERIFIED,
                EmergencyContactChannel::STATUS_SOURCE_UNAVAILABLE,
                EmergencyContactChannel::STATUS_REJECTED,
            ])],
            'source_name' => ['sometimes', 'required', 'string', 'max:150'],
            'source_url' => ['sometimes', 'required', 'url', 'max:500'],
            'verification_notes' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: periksa kembali isian channel.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newIsPrimary = $request->has('is_primary') ? $request->boolean('is_primary') : $channel->is_primary;
        $newIsActive = $request->has('is_active') ? $request->boolean('is_active') : $channel->is_active;
        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        try {
            DB::transaction(function () use ($channel, $request, $contactId, $newIsPrimary, $newIsActive, $actorId, $ipAddress) {
                $oldSnapshot = $this->auditService->captureChannelSnapshot($channel);
                $wasPrimary = $channel->is_primary;

                // If making this channel primary and active, atomically unset others
                if ($newIsPrimary && $newIsActive && ! $wasPrimary) {
                    $otherPrimaries = EmergencyContactChannel::where('emergency_contact_id', $contactId)
                        ->where('id', '!=', $channel->id)
                        ->where('is_primary', true)
                        ->get();

                    foreach ($otherPrimaries as $otherPrimary) {
                        $otherPrimary->is_primary = false;
                        $otherPrimary->save();

                        // Audit demotion of previous primary
                        $this->auditService->recordChannelPrimaryDemoted($otherPrimary, $actorId, $ipAddress);
                    }
                }

                $channel->fill($request->only([
                    'channel_type', 'channel_classification', 'label', 'value',
                    'is_toll_free', 'operating_hours', 'source_name', 'source_url',
                    'verification_notes', 'sort_order'
                ]));

                $channel->is_primary = $newIsPrimary;
                $channel->is_active = $newIsActive;

                if ($request->has('verification_status')) {
                    $newStatus = $request->input('verification_status');
                    $channel->verification_status = $newStatus;
                    $channel->verified_at = $newStatus === EmergencyContactChannel::STATUS_VERIFIED ? now() : null;
                }

                $channel->save();

                // Audit channel update (returns null on no-op)
                $this->auditService->recordChannelUpdated($channel, $oldSnapshot, $actorId, $ipAddress);

                // Side effect check: If parent contact is published, verify active verified channel existence
                $parent = EmergencyContact::find($contactId);
                if ($parent && $parent->publication_status === EmergencyContact::PUB_PUBLISHED) {
                    $hasOtherActiveVerified = EmergencyContactChannel::where('emergency_contact_id', $contactId)
                        ->where('is_active', true)
                        ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                        ->exists();

                    if (! $hasOtherActiveVerified) {
                        $parent->publication_status = EmergencyContact::PUB_DRAFT;
                        $parent->save();

                        $this->auditService->recordPublicationAutoDemotedDueToChannel(
                            $parent,
                            EmergencyContact::PUB_PUBLISHED,
                            EmergencyContact::PUB_DRAFT,
                            $actorId,
                            $ipAddress
                        );
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Channel kontak berhasil diperbarui.',
                'data' => $channel->fresh(),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui channel: ' . $e->getMessage(),
                'error' => 'INTERNAL_ERROR',
            ], 500);
        }
    }

    /**
     * Deactivate and archive an existing channel (prevents permanent data loss / hard delete).
     * Strictly restricted to role:admin.
     */
    public function destroyChannel(Request $request, $contactId, $channelId): JsonResponse
    {
        $channel = EmergencyContactChannel::where('emergency_contact_id', $contactId)
            ->where('id', $channelId)
            ->first();

        if (! $channel) {
            return response()->json([
                'success' => false,
                'message' => 'Channel kontak tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        // Safe deprecation & deactivation instead of permanent hard delete.
        // Preserves historical auditability without requiring a schema change.
        DB::transaction(function () use ($channel, $contactId, $actorId, $ipAddress) {
            $channel->is_active = false;
            $channel->is_primary = false;
            $channel->save();

            // Audit channel deactivation via delete
            $this->auditService->recordChannelDeactivatedViaDelete($channel, $actorId, $ipAddress);

            // Guard parent publication status: if published parent now has 0 active verified channels,
            // automatically revert parent to draft to prevent published parent without channels
            $parent = EmergencyContact::find($contactId);
            if ($parent && $parent->publication_status === EmergencyContact::PUB_PUBLISHED) {
                $hasOtherActiveVerified = EmergencyContactChannel::where('emergency_contact_id', $contactId)
                    ->where('id', '!=', $channel->id)
                    ->where('is_active', true)
                    ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                    ->exists();

                if (! $hasOtherActiveVerified) {
                    $parent->publication_status = EmergencyContact::PUB_DRAFT;
                    $parent->save();

                    // Audit parent publication auto-demotion
                    $this->auditService->recordPublicationAutoDemotedDueToChannel(
                        $parent,
                        EmergencyContact::PUB_PUBLISHED,
                        EmergencyContact::PUB_DRAFT,
                        $actorId,
                        $ipAddress
                    );
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Channel '{$channel->label}' ({$channel->value}) berhasil dinonaktifkan dan diarsipkan. Rekam histori tetap dipertahankan.",
            'data' => $channel->fresh(),
        ]);
    }

    /**
     * Atomically set a channel as primary active channel.
     * Strictly restricted to role:admin.
     */
    public function setPrimaryChannel(Request $request, $contactId, $channelId): JsonResponse
    {
        $channel = EmergencyContactChannel::where('emergency_contact_id', $contactId)
            ->where('id', $channelId)
            ->first();

        if (! $channel) {
            return response()->json([
                'success' => false,
                'message' => 'Channel kontak tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        // No-op check: if already primary and active, do not create duplicate audit events
        if ($channel->is_primary && $channel->is_active) {
            return response()->json([
                'success' => true,
                'message' => "Channel '{$channel->label}' ({$channel->value}) sudah merupakan saluran utama (primary).",
                'data' => $channel,
            ]);
        }

        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        try {
            DB::transaction(function () use ($channel, $contactId, $actorId, $ipAddress) {
                // 1. Unset and audit demotion of any other primary channel for this contact
                $otherPrimaries = EmergencyContactChannel::where('emergency_contact_id', $contactId)
                    ->where('id', '!=', $channel->id)
                    ->where('is_primary', true)
                    ->get();

                foreach ($otherPrimaries as $otherPrimary) {
                    $otherPrimary->is_primary = false;
                    $otherPrimary->save();

                    // Audit demotion of previous primary
                    $this->auditService->recordChannelPrimaryDemoted($otherPrimary, $actorId, $ipAddress);
                }

                // 2. Set this channel as primary and active
                $channel->is_primary = true;
                $channel->is_active = true;
                $channel->save();

                // Audit promotion of this channel
                $this->auditService->recordChannelPrimaryPromoted($channel, $actorId, $ipAddress);
            });

            return response()->json([
                'success' => true,
                'message' => "Channel '{$channel->label}' ({$channel->value}) berhasil ditetapkan sebagai saluran utama (primary).",
                'data' => $channel->fresh(),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menetapkan primary channel: ' . $e->getMessage(),
                'error' => 'INTERNAL_ERROR',
            ], 500);
        }
    }

    /**
     * Toggle active/inactive status of a channel.
     * Strictly restricted to role:admin.
     */
    public function toggleChannelActive(Request $request, $contactId, $channelId): JsonResponse
    {
        $channel = EmergencyContactChannel::where('emergency_contact_id', $contactId)
            ->where('id', $channelId)
            ->first();

        if (! $channel) {
            return response()->json([
                'success' => false,
                'message' => 'Channel kontak tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $oldActive = (bool) $channel->is_active;
        $newActive = ! $oldActive;
        $actorId = $request->user()?->id;
        $ipAddress = $request->ip();

        DB::transaction(function () use ($channel, $contactId, $oldActive, $newActive, $actorId, $ipAddress) {
            $channel->is_active = $newActive;
            // If deactivating a primary channel, unset primary to prevent ghost primary on inactive channel
            if (! $newActive && $channel->is_primary) {
                $channel->is_primary = false;
            }
            $channel->save();

            // Audit toggle action
            $this->auditService->recordChannelToggled($channel, $oldActive, $newActive, $actorId, $ipAddress);

            // If channel was deactivated and was the last active verified channel for a published parent, auto-demote
            if (! $newActive) {
                $parent = EmergencyContact::find($contactId);
                if ($parent && $parent->publication_status === EmergencyContact::PUB_PUBLISHED) {
                    $hasOtherActiveVerified = EmergencyContactChannel::where('emergency_contact_id', $contactId)
                        ->where('id', '!=', $channel->id)
                        ->where('is_active', true)
                        ->where('verification_status', EmergencyContactChannel::STATUS_VERIFIED)
                        ->exists();

                    if (! $hasOtherActiveVerified) {
                        $parent->publication_status = EmergencyContact::PUB_DRAFT;
                        $parent->save();

                        // Audit publication auto-demotion
                        $this->auditService->recordPublicationAutoDemotedDueToChannel(
                            $parent,
                            EmergencyContact::PUB_PUBLISHED,
                            EmergencyContact::PUB_DRAFT,
                            $actorId,
                            $ipAddress
                        );
                    }
                }
            }
        });

        $statusText = $newActive ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Channel '{$channel->label}' berhasil {$statusText}.",
            'data' => $channel->fresh(),
        ]);
    }

    /**
     * List all audit logs with optional filters, deterministic ordering, and pagination.
     * Strictly restricted to role:admin.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = EmergencyDirectoryAuditLog::query()
            ->with([
                'actor:id,name,email',
                'parentContact:id,name,slug',
            ]);

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->query('entity_type'));
        }

        if ($request->filled('entity_id')) {
            $query->where('entity_id', $request->integer('entity_id'));
        }

        if ($request->filled('parent_contact_id')) {
            $query->where('parent_contact_id', $request->integer('parent_contact_id'));
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->integer('actor_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->query('date_to'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);

        // Deterministic ordering: latest first, then ID desc
        $logs = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar audit log Emergency Directory berhasil dimuat.',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * List all audit logs for a specific parent contact and its channels.
     * Strictly restricted to role:admin.
     */
    public function contactAuditLogs(Request $request, $id): JsonResponse
    {
        $contact = EmergencyContact::withTrashed()->find($id);
        if (! $contact) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak darurat tidak ditemukan.',
                'error' => 'NOT_FOUND',
            ], 404);
        }

        $query = EmergencyDirectoryAuditLog::query()
            ->where('parent_contact_id', $contact->id)
            ->with([
                'actor:id,name,email',
                'parentContact:id,name,slug',
            ]);

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->query('entity_type'));
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->query('date_to'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);

        // Deterministic ordering: latest first, then ID desc
        $logs = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => "Audit log untuk kontak '{$contact->name}' berhasil dimuat.",
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }
}
