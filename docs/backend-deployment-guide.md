# SENTRAVAX — Backend & Database Deployment Guide

This guide covers the deployment, configuration, database initialization, and operation of the SENTRAVAX backend platform.

---

## 1. System Requirements

- **PHP**: 8.2 or higher (8.3 recommended) with extensions: `pdo`, `pdo_pgsql`, `mbstring`, `openssl`, `bcmath`, `curl`, `json`.
- **Database**: PostgreSQL 16, 17, or 18 with **PostGIS 3.x** spatial extension installed.
- **Dependency Manager**: Composer 2.x
- **Operating System**: Linux (Ubuntu 22.04 / 24.04 LTS), macOS, or Windows Server / Windows 11.

---

## 2. PostgreSQL + PostGIS Setup

Ensure PostgreSQL has PostGIS installed.

### 2.1 Database Creation
Connect to your PostgreSQL server via `psql` or pgAdmin:

```sql
-- Create database
CREATE DATABASE sentravax_db WITH OWNER postgres ENCODING 'UTF8';

-- Connect to database
\c sentravax_db

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation
SELECT PostGIS_Version();
```

Expected output: `3.x.x USE_GEOS=... USE_PROJ=...`

---

## 3. Environment Configuration (`.env`)

In the `backend/` directory, copy the example environment file:

```bash
cp .env.example .env
php artisan key:generate
```

Configure the PostgreSQL database connection in `.env`:

```env
APP_NAME=SENTRAVAX
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost:8000

# PostgreSQL Connection
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sentravax_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Sanctum Stateful Configuration (For Frontend SPA)
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Cache & Queue (Local database driver, zero external Redis requirement)
CACHE_STORE=database
QUEUE_CONNECTION=database
```

---

## 4. Database Migrations & Seeding

SENTRAVAX employs strict additive, idempotent migrations to protect existing records.

```bash
# Run migrations (Do NOT run migrate:fresh or migrate:refresh!)
php artisan migrate

# Seed master database (Safe and idempotent; can be run repeatedly without duplicating records)
php artisan db:seed --class=SentravaxMasterSeeder
```

### Seeded Development Credentials
- **Administrator Console**: `admin@sentravax.go.id` / `Sentravax2026!`
- **Intelligence Center**: `intelligence@sentravax.go.id` / `Sentravax2026!`
- **User Portal (Citizen)**: `user@sentravax.id` / `Sentravax2026!`

---

## 5. Running the Backend Server

### Development Server
```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### Storage Symlink
To serve community-uploaded report photos:
```bash
php artisan storage:link
```

---

## 6. Scheduled Telemetry & Data Synchronization

SENTRAVAX includes automated external data synchronization tasks for BMKG, BNPB, and NASA FIRMS.

### Running Laravel Task Scheduler
Add the scheduler to crontab:
```bash
* * * * * cd /path-to-sentravax/backend && php artisan schedule:run >> /dev/null 2>&1
```

Or run the scheduler worker in a background daemon process:
```bash
php artisan schedule:work
```

---

## 7. Running Automated Tests

Verify 100% test passing rate across all domain modules:

```bash
php artisan test --filter="AuthApiTest|PublicApiTest|UserPortalApiTest|AdminApiTest|IntelligenceApiTest|RiskEngineTest"
```

Expected result: `Tests: 49 passed, Assertions: 285, Status: 100% Success`.

