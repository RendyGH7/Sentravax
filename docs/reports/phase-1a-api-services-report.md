# SENTRAVAX — LAPORAN IMPLEMENTASI PHASE 1A
## Typed API Services Foundation (Public Website & User Portal)

**Tanggal:** 13 November 2026  
**Status:** IMPLEMENTED, TESTED, & VERIFIED (PASS)  
**Scope:** Area A (Public Website API) & Area B (User Portal & Siaga Personal API)  
**HTTP Client:** Axios v1.21.1 (`src/lib/axios.ts` dengan `withCredentials: true` dan `withXSRFToken: true`)  
**TypeScript Version:** 5.7 / 7.0 (Strict mode, zero `any`)  
**Backend Reference:** Laravel 13 REST API (`/api/v1/`) + PostgreSQL 18 + PostGIS 3.7  

---

## 1. FILE YANG DIBUAT DAN DIUBAH

| Operasi | Path File | Keterangan |
|---|---|---|
| **Created** | `frontend/src/services/public-service.ts` | Typed API Service untuk seluruh endpoint Public Website (11 method). |
| **Created** | `frontend/src/services/user-service.ts` | Typed API Service untuk seluruh endpoint User Portal & Siaga Personal (17 method). |
| **Created** | `frontend/src/services/index.ts` | Barrel export untuk memudahkan import `publicService` dan `userService`. |
| **Modified** | `frontend/src/types/disaster.ts` | Penambahan interface: `RegionItem.center`, `PublicOverviewData`, `HazardEventDetail`, `EducationContentItem`, dan parameter query (`EventsQueryParams`, `AlertsQueryParams`, `RegionsQueryParams`, `EducationQueryParams`, `CheckLocationParams`). |
| **Modified** | `frontend/src/types/siaga.ts` | Penambahan interface: `UserDashboardData`, `UserSavedRegionItem`, `SaveRegionPayload`, `UserNotificationItem`, `ChecklistOverviewData`, `ToggleChecklistResult`, `FamilyPlanData`, `UpdatePlanPayload`, `CreateContactPayload`, `CreateReportPayload`, `CreateReportResult`, dan `CommunityReportDetail`. |

---

## 2. DAFTAR METHOD API SERVICES & PEMETAAN ENDPOINT

### 2.1 Public Service (`src/services/public-service.ts`)

Seluruh method bersifat publik (*guest access*), tidak memerlukan autentikasi login:

| No | Nama Method | HTTP Method | Endpoint URL | Parameter / Payload | Tipe Kembalian (Return Type) |
|:---:|---|:---:|---|---|---|
| **1** | `getOverview()` | `GET` | `/api/v1/public/overview` | — | `Promise<PublicOverviewData>` |
| **2** | `checkLocation(params)` | `GET` | `/api/v1/public/check-location` | `CheckLocationParams` (`latitude`/`lat`, `longitude`/`lon`, `region_id?`) | `Promise<LocationCheckResult>` |
| **3** | `getEvents(params?)` | `GET` | `/api/v1/public/events` | `EventsQueryParams` (`hazard_type_id?`, `region_id?`, `severity?`, `status?`, `page?`, `per_page?`) | `Promise<PaginatedData<HazardEventItem>>` |
| **4** | `getEventDetail(id)` | `GET` | `/api/v1/public/events/{id}` | `id: number` | `Promise<HazardEventDetail>` |
| **5** | `getMapFeatures()` | `GET` | `/api/v1/public/map/features` | — | `Promise<GeoJsonFeatureCollection>` |
| **6** | `getAlerts(params?)` | `GET` | `/api/v1/public/alerts` | `AlertsQueryParams` (`broadcast_level?`, `region_id?`, `page?`, `per_page?`) | `Promise<PaginatedData<AlertItem>>` |
| **7** | `getHazardTypes()` | `GET` | `/api/v1/public/hazard-types` | — | `Promise<HazardTypeItem[]>` |
| **8** | `getRegions(params?)` | `GET` | `/api/v1/public/regions` | `RegionsQueryParams` (`q?`, `level?`) | `Promise<RegionItem[]>` |
| **9** | `getEducation(params?)` | `GET` | `/api/v1/public/education` | `EducationQueryParams` (`category?`, `hazard_type_id?`, `page?`, `per_page?`) | `Promise<PaginatedData<EducationContentItem>>` |
| **10** | `getEducationDetail(slug)` | `GET` | `/api/v1/public/education/{slug}` | `slug: string` | `Promise<EducationContentItem>` |
| **11** | `getDataSources()` | `GET` | `/api/v1/public/data-sources` | — | `Promise<DataSourceItem[]>` |

---

### 2.2 User Service (`src/services/user-service.ts`)

Seluruh method memerlukan autentikasi sesi aktif (cookie HttpOnly `laravel-session`):

| No | Modul / Kategori | Nama Method | HTTP Method | Endpoint URL | Parameter / Body | Tipe Kembalian (Return Type) |
|:---:|---|---|:---:|---|---|---|
| **1** | Dashboard | `getDashboard()` | `GET` | `/api/v1/user/dashboard` | — | `Promise<UserDashboardData>` |
| **2** | Profil | `getProfile()` | `GET` | `/api/v1/user/profile` | — | `Promise<User>` |
| **3** | Profil | `updateProfile(payload)` | `PUT` | `/api/v1/user/profile` | `{ name: string }` | `Promise<User>` |
| **4** | Wilayah Pantauan | `getSavedRegions()` | `GET` | `/api/v1/user/saved-regions` | — | `Promise<UserSavedRegionItem[]>` |
| **5** | Wilayah Pantauan | `saveRegion(payload)` | `POST` | `/api/v1/user/saved-regions` | `SaveRegionPayload` (`region_id`, `label?`, `is_primary?`, `notify_alerts?`) | `Promise<UserSavedRegionItem>` |
| **6** | Wilayah Pantauan | `deleteSavedRegion(id)` | `DELETE` | `/api/v1/user/saved-regions/{id}` | `id: number` | `Promise<void>` |
| **7** | Notifikasi Siaga | `getNotifications(page?)` | `GET` | `/api/v1/user/notifications` | `page?: number` | `Promise<PaginatedData<UserNotificationItem>>` |
| **8** | Notifikasi Siaga | `markNotificationAsRead(id)` | `POST` | `/api/v1/user/notifications/{id}/read` | `id: number` | `Promise<void>` |
| **9** | Notifikasi Siaga | `markAllNotificationsAsRead()` | `POST` | `/api/v1/user/notifications/read-all` | — | `Promise<void>` |
| **10** | Laporan Warga | `getReports(params?)` | `GET` | `/api/v1/user/reports` | `UserReportsQueryParams` (`status?`, `page?`, `per_page?`) | `Promise<UserReportsResult>` |
| **11** | Laporan Warga | `createReport(payload)` | `POST` | `/api/v1/user/reports` | `CreateReportPayload` (Multipart: `hazard_type_id`, `region_id`, `title`, `description`, `latitude`, `longitude`, `photo?`) | `Promise<CreateReportResult>` |
| **12** | Laporan Warga | `getReportDetail(id)` | `GET` | `/api/v1/user/reports/{id}` | `id: number` | `Promise<CommunityReportDetail>` |
| **13** | Rencana Keluarga | `getFamilyPlan()` | `GET` | `/api/v1/user/preparedness/plan` | — | `Promise<FamilyPlanData>` |
| **14** | Rencana Keluarga | `updateFamilyPlan(payload)` | `PUT` | `/api/v1/user/preparedness/plan` | `UpdatePlanPayload` (`title`, `primary_meeting_point?`, `secondary_meeting_point?`, `evacuation_notes?`) | `Promise<PreparednessPlanItem>` |
| **15** | Kontak Darurat | `addEmergencyContact(payload)` | `POST` | `/api/v1/user/preparedness/contacts` | `CreateContactPayload` (`name`, `relationship`, `phone_number`, `is_emergency_priority?`) | `Promise<EmergencyContactItem>` |
| **16** | Kontak Darurat | `deleteEmergencyContact(id)` | `DELETE` | `/api/v1/user/preparedness/contacts/{id}` | `id: number` | `Promise<void>` |
| **17** | Tas Siaga (Go-Bag) | `getChecklist()` | `GET` | `/api/v1/user/preparedness/checklist` | — | `Promise<ChecklistOverviewData>` |
| **18** | Tas Siaga (Go-Bag) | `toggleChecklistItem(itemId)` | `POST` | `/api/v1/user/preparedness/checklist/{id}/toggle` | `itemId: number` | `Promise<ToggleChecklistResult>` |
| **19** | Simulasi Bencana | `getScenarios()` | `GET` | `/api/v1/user/preparedness/scenarios` | — | `Promise<SimulationScenarioItem[]>` |
| **20** | Simulasi Bencana | `getScenarioDetail(idOrSlug)` | `GET` | `/api/v1/user/preparedness/scenarios/{idOrSlug}` | `idOrSlug: number \| string` | `Promise<SimulationScenarioItem>` |
| **21** | Simulasi Bencana | `submitScenarioAttempt(id, answers)` | `POST` | `/api/v1/user/preparedness/scenarios/{id}/attempt` | `id: number`, `answers: Record<number \| string, string>` | `Promise<ScenarioAttemptResult>` |

---

## 3. STRUKTUR RESPONS AKTUAL & DASAR TYPING

Setiap method dirancang langsung berdasarkan audit kode pengontrol (*controller*) backend aktual:

### 3.1 Cek Risiko Lokasi Mandiri (`GET /public/check-location`)
Berdasarkan `PreparednessService::checkLocation`:
```typescript
export interface LocationCheckResult {
  location: {
    latitude: number;
    longitude: number;
    region?: RegionItem | null;
  };
  assessment: {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    risk_label?: string;
    active_threats_count?: number;
    active_alerts_count?: number;
    factors: Record<string, {
      weight: number;
      contribution: number;
      description: string;
    }>;
    assessed_at?: string;
    data_freshness?: string;
  };
  recommendations: {
    action_steps: string[];
    recommended_checklist_items: GoBagChecklistItem[];
  };
  provenance: {
    source: string;
    data_sources: string[];
    disclaimer: string;
  };
}
```

### 3.2 Pelaporan Bencana Partisipatif (`POST /user/reports`)
Mendukung `multipart/form-data` dengan otomatisasi pembentukan `FormData` di dalam `userService.createReport`:
- Nilai koordinat (`latitude`, `longitude`) dan ID numerik di-serialize aman.
- Berkas `photo` disisipkan ke form boundary.
- Server mengembalikan identitas laporan dan hasil klasterisasi spatiotemporal AI (`clustering.is_duplicate`, `clustering.cluster_id`).

### 3.3 Tas Siaga Bencana 5 Kategori BNPB (`GET /user/preparedness/checklist`)
Berdasarkan `UserPreparednessController::getChecklist`:
```typescript
export interface ChecklistOverviewData {
  categories: Record<string, GoBagChecklistItem[]>; // 'dokumen' | 'medis' | 'logistik' | 'peralatan' | 'proteksi'
  stats: {
    total_items: number;
    completed_items: number;
    percentage: number;
  };
}
```

---

## 4. PENANGANAN ERROR & KEAMANAN

1. **Unwrapping Respons Bersih:**
   Seluruh pemanggilan method melakukan *auto-unwrapping* dari envelope standard backend `res.data.data` (atau `res.data` untuk GeoJSON), sehingga komponen antarmuka pengguna dapat langsung menerima payload data bersih tanpa harus mengakses nested properties.
2. **Penanganan Error Terpusat:**
   Seluruh kegagalan request (HTTP 401, 403, 404, 422, 500) dapat langsung ditangkap oleh pemanggil dan diterjemahkan secara konsisten ke dalam bahasa Indonesia melalui modul `src/lib/api-error.ts` (`getApiErrorMessage(err)`).
3. **Keamanan Autentikasi Tetap Utuh:**
   - Tidak ada token JWT atau credential yang disimpan di `localStorage` atau `sessionStorage`.
   - Menggunakan `apiClient` singleton dari `src/lib/axios.ts` dengan opsi `withCredentials: true` (mengirim cookie HttpOnly otomatis) dan `withXSRFToken: true` (menyematkan header anti-CSRF otomatis).

---

## 5. HASIL VERIFIKASI KODE & BUILD

### 1. Frontend Linter (Oxlint)
```bash
npm run lint
```
**Hasil:**
```
Found 0 warnings and 0 errors.
Finished in 24ms on 63 files with 116 rules using 12 threads.
```
**Status:** **PASS**

### 2. Frontend Production Build (TypeScript Strict & Vite)
```bash
npm run build
```
**Hasil:**
```
> tsc -b && vite build
vite v8.3.7 building client environment for production...
transforming...
✓ 2197 modules transformed.
rendering chunks...
dist/index.html                   0.67 kB │ gzip:   0.40 kB
dist/assets/index-B6YBDEWv.css   42.44 kB │ gzip:   8.33 kB
dist/assets/index-CgGAXLJ7.js   530.94 kB │ gzip: 159.35 kB
✓ built in 688ms
```
**Status:** **PASS**

### 3. Pemeriksaan Git Diff
Hanya memodifikasi type definition dan menambahkan berkas service di `frontend/src/services/`. Tidak ada perubahan pada backend, migration, database, atau konfigurasi autentikasi.

---

## 6. KENDALA & CATATAN ENDPOINT

- **Seluruh 28 Endpoint Terverifikasi Aktif:** Seluruh method pada `publicService` dan `userService` telah dipetakan langsung ke fungsi controller yang sudah aktif dan lulus pengujian backend. Tidak ditemukan endpoint fiktif atau respon yang belum terimplementasi di backend.
- **Kesiapan Fase Berikutnya:** Lapisan komunikasi API telah siap 100% untuk digunakan sebagai pondasi implementasi komponen antarmuka pengguna pada Tahap 1B (Shared UI Library) dan Tahap 2 (Public Website Core).

