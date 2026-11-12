# SENTRAVAX — REST API CONTRACT LOCK (v1)

**Status**: LOCKED & FINALIZED FOR FRONTEND INTEGRATION  
**Version**: 1.0.0  
**Protocol**: REST / JSON  
**Base URL**: `http://localhost:8000/api/v1`  
**Authentication**: Laravel Sanctum Bearer Token (`Authorization: Bearer <token>`) & Cookie Stateful SPA  
**Total Routes**: 73 Endpoints  

---

## ROLE & ACCESS MATRIX

| Role Key | Area Hak Akses | Catatan Teknis |
|---|---|---|
| `guest` | Public API | Pengunjung publik tanpa token |
| `user` | Public API + Portal Warga | Akun warga terdaftar (Siaga Personal, Pelaporan) |
| `admin` | Public API + Portal Warga + Konsol Admin | Pengelolaan sistem, kurasi kejadian, user management |
| `intelligence` | Public API + Portal Warga + Intelligence Center | Analisis spasial, telemetry, disseminasi CAP, evaluasi risiko |

> **PERINGATAN KEAMANAN**: Akses silang antara `admin` dan `intelligence` diblokir total oleh backend middleware (`403 Forbidden`).

---

## 1. SYSTEM HEALTH & AUTHENTICATION (5 Endpoints)

### 1.1 `GET /api/v1/health`
- **Auth**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "SENTRAVAX API is operational",
  "data": {
    "application": "SENTRAVAX",
    "version": "1.0.0",
    "status": "operational",
    "database": "connected",
    "postgis": "3.7 USE_GEOS=1 USE_PROJ=1 USE_STATS=1",
    "framework": "Laravel 13.40.0",
    "environment": "production"
  },
  "meta": { "timestamp": "2026-11-12T04:30:00Z" }
}
```

### 1.2 `POST /api/v1/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "user@sentravax.id",     // string, required, email
  "password": "Sentravax2026!"       // string, required
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": 3,
      "name": "Warga Siaga Mandiri",
      "email": "user@sentravax.id",
      "role": "user"
    },
    "token": "1|sanctum_plain_text_token_string",
    "token_type": "Bearer"
  }
}
```
- **Error Response `401 Unauthorized`**:
```json
{
  "success": false,
  "message": "Kredensial yang diberikan tidak cocok dengan data kami.",
  "error": "INVALID_CREDENTIALS"
}
```

### 1.3 `POST /api/v1/auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "name": "Budi Santoso",                 // string, required, max:255
  "email": "budi@example.id",             // string, required, email, unique:users
  "password": "PasswordAman123!",         // string, required, min:8
  "password_confirmation": "PasswordAman123!" // string, required
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Pendaftaran akun warga berhasil.",
  "data": {
    "user": {
      "id": 45,
      "name": "Budi Santoso",
      "email": "budi@example.id",
      "role": "user"
    },
    "token": "2|sanctum_plain_text_token_string",
    "token_type": "Bearer"
  }
}
```

### 1.4 `GET /api/v1/auth/me`
- **Auth**: Bearer Token (Authenticated user)
- **Response `200 OK`**: Mengembalikan object `user` aktif.

### 1.5 `POST /api/v1/auth/logout`
- **Auth**: Bearer Token
- **Response `200 OK`**: `{"success": true, "message": "Logout berhasil."}`

---

## 2. PUBLIC WEBSITE API (11 Endpoints)

### 2.1 `GET /api/v1/public/overview`
- **Auth**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "platform": "SENTRAVAX Disaster Intelligence",
    "active_hazard_events": 3,
    "active_alerts": 8,
    "monitored_regions": 5,
    "system_status": "operational",
    "telemetry_sync": {
      "status": "SUCCESS",
      "freshness": "LIVE",
      "last_synced_at": "2026-11-12T06:05:21Z"
    }
  }
}
```

### 2.2 `GET /api/v1/public/check-location` (SENTRAVAX SIAGA PERSONAL)
- **Auth**: Public
- **Query Params**:
  - `lat` / `latitude` (required, float, -90..90)
  - `lon` / `longitude` (required, float, -180..180)
  - `region_id` (optional, integer)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "region": { "id": 1, "name": "DKI Jakarta", "code": "31" }
    },
    "assessment": {
      "risk_score": 72.5,
      "risk_level": "high",
      "risk_label": "Bahaya Tinggi",
      "active_threats_count": 2,
      "active_alerts_count": 1,
      "factors": {
        "nearby_events": { "weight": 0.45, "contribution": 32.5 },
        "official_alerts": { "weight": 0.30, "contribution": 25.0 }
      }
    },
    "recommendations": {
      "action_steps": ["Amankan dokumen penting", "Siapkan air minum"],
      "recommended_checklist_items": [
        { "id": 1, "category": "dokumen", "name": "KTP & KK Kedap Air" }
      ]
    },
    "provenance": {
      "source": "SENTRAVAX Multi-Hazard Geospatial Intelligence Engine",
      "data_sources": ["BMKG", "BNPB", "PostGIS Telemetry"]
    }
  }
}
```

### 2.3 `GET /api/v1/public/events`
- **Query Params**: `hazard_type_id`, `region_id`, `severity` (minor/moderate/severe/extreme), `status` (active/contained/resolved), `page`, `per_page`.
- **Response `200 OK`**: Paginated array of events with latitude, longitude, and hazard type.

### 2.4 `GET /api/v1/public/events/{id}`
- **Response `200 OK`**: Single event detail with associated alerts and data source metadata.

### 2.5 `GET /api/v1/public/map/features`
- **Response `200 OK`**: Standard RFC 7946 GeoJSON `FeatureCollection` for interactive Leaflet map rendering.
```json
{
  "success": true,
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [106.8456, -6.2088] },
      "properties": {
        "id": 1,
        "title": "Banjir Luapan Ciliwung",
        "hazard_slug": "flood",
        "severity": "medium",
        "occurred_at": "2026-11-12T01:18:11Z"
      }
    }
  ]
}
```

### 2.6 `GET /api/v1/public/alerts`
- **Query Params**: `broadcast_level` (local/regional/national), `region_id`.
- **Response `200 OK`**: Active CAP alerts.

### 2.7 Reference Endpoints
- `GET /api/v1/public/hazard-types`: All hazard master categories (`slug`, `name`, `icon`).
- `GET /api/v1/public/regions`: Indonesian monitored regions (`code`, `name`, `level`, `center_point`).
- `GET /api/v1/public/education`: Mitigation guides catalogue.
- `GET /api/v1/public/education/{slug}`: Article full text and practical steps.
- `GET /api/v1/public/data-sources`: Data sources status (`LIVE`, `STATIC`, `SIMULATED`).

---

## 3. USER PORTAL & SIAGA PERSONAL (22 Endpoints)

**Headers**: `Authorization: Bearer <token>`  
**Allowed Roles**: `user`, `admin`, `intelligence`

### 3.1 Portal Telemetry & Profile
- `GET /api/v1/user/ping`: Test user token authentication.
- `GET /api/v1/user/dashboard`: Overview containing `preparedness_summary`, `saved_regions_count`, `active_regional_alerts`, `unread_notifications_count`.
- `GET /api/v1/user/profile`: Get authenticated user account profile.
- `PUT /api/v1/user/profile`: Update user name (`{"name": "string"}`).

### 3.2 Wilayah Pantauan (Saved Monitored Regions)
- `GET /api/v1/user/saved-regions`: List user's monitored areas.
- `POST /api/v1/user/saved-regions`:
  - Body: `{"region_id": 1, "label": "Rumah Orang Tua", "is_primary": true}`
- `DELETE /api/v1/user/saved-regions/{id}`: Delete saved region.

### 3.3 Notifikasi Siaga CAP
- `GET /api/v1/user/notifications`: Paginated in-app disaster notifications.
- `POST /api/v1/user/notifications/{id}/read`: Mark notification as read (`read_at = now()`).
- `POST /api/v1/user/notifications/read-all`: Mark all unread notifications as read.

### 3.4 Rencana Siaga Keluarga (Family Preparedness Plan)
- `GET /api/v1/user/preparedness/plan`: Family meeting points and evacuation notes.
- `PUT /api/v1/user/preparedness/plan`:
  - Body: `{"title": "...", "primary_meeting_point": "...", "secondary_meeting_point": "...", "evacuation_notes": "..."}`
- `POST /api/v1/user/preparedness/contacts`:
  - Body: `{"name": "...", "relationship": "...", "phone_number": "...", "is_emergency_priority": true}`
- `DELETE /api/v1/user/preparedness/contacts/{id}`: Delete contact.

### 3.5 Tas Siaga Bencana (Go-Bag Checklist)
- `GET /api/v1/user/preparedness/checklist`: 13 master items grouped across 5 categories (`dokumen`, `medis`, `logistik`, `peralatan`, `proteksi`) with completion states.
- `POST /api/v1/user/preparedness/checklist/{itemId}/toggle`: Toggle checked/unchecked status.

### 3.6 Simulasi Kesiapsiagaan Interaktif
- `GET /api/v1/user/preparedness/scenarios`: List scenario simulations.
- `GET /api/v1/user/preparedness/scenarios/{idOrSlug}`: Scenario briefing & questions (correct answers masked).
- `POST /api/v1/user/preparedness/scenarios/{idOrSlug}/attempt`:
  - Body: `{"answers": {"<question_id>": "<option_id>"}}`
  - Returns: `score`, `passed` (>=70%), and detailed educational evaluation summary.

### 3.7 Pelaporan Warga (Community Reports)
- `GET /api/v1/user/reports`: List user's submitted reports and status (`pending`, `verified`, `rejected`).
- `GET /api/v1/user/reports/{id}`: Detail report with moderation audit trail.
- `POST /api/v1/user/reports`:
  - Body (Multipart/Form-Data):
    - `hazard_type_id` (required, int)
    - `region_id` (required, int)
    - `title` (required, string, max:150)
    - `description` (required, string, max:2000)
    - `latitude` (required, float, -11.5..6.5)
    - `longitude` (required, float, 95.0..141.5)
    - `photo` (optional, file, image, max:5MB)
  - Auto-executes spatiotemporal duplicate clustering (`ST_DWithin` 1.5 km, 6 jam).

---

## 4. ADMIN CONSOLE API (27 Endpoints)

**Headers**: `Authorization: Bearer <token>`  
**Allowed Roles**: Strictly `admin` (Cross-access by `intelligence` or `user` returns `403 Forbidden`).

### 4.1 Ringkasan Operasional & Sinkronisasi
- `GET /api/v1/admin/ping`: Test admin token.
- `GET /api/v1/admin/overview`: System stats (total users, curated events, pending reports, PostGIS latency).
- `GET /api/v1/admin/data-sources`: Data sources registry status.
- `POST /api/v1/admin/data-sources/{id}/sync`: Trigger manual data sync run.

### 4.2 Manajemen Pengguna (3 Role Canonical)
- `GET /api/v1/admin/users`: Paginated user list (`role`, `search`).
- `POST /api/v1/admin/users`: Create user (`name`, `email`, `role: in:admin,intelligence,user`, `password`).
- `GET /api/v1/admin/users/{id}`: Single user details.
- `PUT /api/v1/admin/users/{id}/role`: Update role (`role: in:admin,intelligence,user`). Self-demotion blocked (`422`).
- `DELETE /api/v1/admin/users/{id}`: Delete user. Self-deletion blocked (`422`).

### 4.3 Kejadian Bencana Resmi (Hazard Events CRUD)
- `GET /api/v1/admin/events`: List official events.
- `POST /api/v1/admin/events`: Create event (`title`, `hazard_type_id`, `region_id`, `severity`, `status`, `latitude`, `longitude`, `occurred_at`).
- `GET /api/v1/admin/events/{id}`: Event details.
- `PUT /api/v1/admin/events/{id}`: Update event.
- `DELETE /api/v1/admin/events/{id}`: Delete event.

### 4.4 Disseminasi Peringatan CAP (Alerts CRUD)
- `GET /api/v1/admin/alerts`: List alerts.
- `POST /api/v1/admin/alerts`: Create CAP alert and auto-distribute notifications to citizens monitoring the region.
- `GET /api/v1/admin/alerts/{id}`: Alert details.
- `PUT /api/v1/admin/alerts/{id}`: Update alert.
- `DELETE /api/v1/admin/alerts/{id}`: Delete alert.

### 4.5 CMS Konten Edukasi Mitigasi
- `GET /api/v1/admin/education`: List education contents.
- `POST /api/v1/admin/education`: Create guide (`title`, `category`, `summary`, `content_body`).
- `PUT /api/v1/admin/education/{id}`: Update guide.
- `DELETE /api/v1/admin/education/{id}`: Delete guide.

### 4.6 Moderasi Laporan Warga
- `GET /api/v1/admin/reports`: List pending/curated reports.
- `GET /api/v1/admin/reports/{id}`: Report audit details.
- `POST /api/v1/admin/reports/{id}/verify`:
  - Body: `{"status": "verified" | "rejected", "notes": "..."}`
  - Writes immutable audit trail to `report_verifications`.
- `DELETE /api/v1/admin/reports/{id}`: Delete spam report.

---

## 5. GEOSPATIAL INTELLIGENCE CENTER API (8 Endpoints)

**Headers**: `Authorization: Bearer <token>`  
**Allowed Roles**: Strictly `intelligence` (Cross-access by `admin` or `user` returns `403 Forbidden`).

### 5.1 `GET /api/v1/intel/ping`
- **Response `200 OK`**: Verify intelligence token.

### 5.2 `GET /api/v1/intel/overview`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "telemetry": {
      "stream_status": "STREAMING AKTIF",
      "sources_connected": "7 Node Aktif (PostGIS Spatial Sync)",
      "postgis_status": "NORMAL"
    },
    "simulation_projection": {
      "scenario_name": "Simulasi Proyeksi Genangan dan Bahaya Spasial",
      "freshness": "DATA AKTIF FRESH (5 menit lalu)",
      "hazard_type": "Banjir Luapan",
      "active_layer": "DEM 5M + POSTGIS FLOOD POLYGON",
      "zone": "DAS Ciliwung Hilir & Dataran Alluvial Jakarta",
      "data_nature": "DEMONSTRATION_SCENARIO",
      "elevation_source": "DEMNAS Badan Informasi Geospasial (BIG) 0.27 arcsec (~8.1m resampled to 5m mesh)",
      "disclaimer": "Simulasi ini merupakan model proyeksi hidrologi skenario demonstrasi berbasis profil DEMNAS dan kurva debit Ciliwung, BUKAN prediksi mutlak waktu kejadian bencana riil.",
      "metrics": {
        "exposed_population": 42150,
        "critical_facilities_in_radius": { "total": 8 },
        "river_discharge_status": { "level": "SIAGA 2", "current_flow_m3_s": 480 }
      },
      "timeline_steps": ["+1 Jam", "+3 Jam", "+6 Jam", "+12 Jam", "+24 Jam"],
      "current_step": "+12 Jam"
    },
    "recent_insights": [...]
  }
}
```

### 5.3 `GET /api/v1/intel/map`
- **Response `200 OK`**: GeoJSON FeatureCollection containing active hazard events, clustered reports, and risk severity points.

### 5.4 `POST /api/v1/intel/risk/evaluate`
- **Request Body**: `{"region_id": 1, "hazard_type_id": 1, "title": "Evaluasi Risiko Ciliwung"}`
- **Response `200 OK`**: Computes multi-hazard spatial risk score (5.0..98.0), risk level (`low`, `medium`, `high`, `critical`), and factor contributions.

### 5.5 `POST /api/v1/intel/insights/generate`
- **Request Body**: `{"region_id": 1, "hazard_type_id": 1}`
- **Response `201 Created`**: Deterministic explainable proactive mitigation intelligence with `confidence_score: 0.915`.

### 5.6 `GET /api/v1/intel/reports/queue`
- **Response `200 OK`**: Pending reports tagged with spatiotemporal duplicate cluster IDs (`cluster_id`).

### 5.7 `POST /api/v1/intel/reports/{id}/verify`
- **Request Body**: `{"status": "verified" | "rejected", "notes": "..."}`
- **Response `200 OK`**: Updates report status and records verifier audit trail.

### 5.8 `POST /api/v1/intel/alerts/dispatch`
- **Request Body**:
```json
{
  "hazard_type_id": 1,
  "region_id": 1,
  "title": "DISSEMINASI CAP: Siaga Banjir Luapan DAS Ciliwung Hilir",
  "message": "Status TMA Bendung Katulampa meningkat menjadi Siaga 2.",
  "alert_class": "warning",            // advisory, watch, warning
  "broadcast_level": "regional",        // local, regional, national
  "starts_at": "2026-11-12T05:00:00Z",
  "expires_at": "2026-11-12T17:00:00Z"
}
```
- **Response `201 Created`**: Publishes alert and broadcasts in-app notifications to all registered citizens monitoring this region.
