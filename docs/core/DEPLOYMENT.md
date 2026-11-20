# SENTRAVAX — Backend & Database Deployment Guide

This guide covers the deployment, configuration, database initialization, and operation of the SENTRAVAX backend platform.

---

## 1. System Requirements

- **PHP**: 8.2 or higher (8.3 recommended) with extensions: `pdo`, `pdo_pgsql`, `mbstring`, `openssl`, `bcmath`, `curl`, `json`, `gd` (image processing), `exif` (photo privacy & metadata sanitization).
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

## 6. Scheduled Telemetry & Queue Workers

SENTRAVAX includes automated external data synchronization tasks for BMKG, CAP Inbound, and multi-hazard telemetry.

### 6.1 Running Persistent Queue Worker
In production, use `systemd` or `supervisor` to ensure persistent worker execution:
```ini
[program:sentravax-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path-to-sentravax/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/sentravax-worker.log
```

Or run via command line for staging:
```bash
php artisan queue:work --tries=3 --timeout=60
```

### 6.2 Running Laravel Task Scheduler
Add the scheduler to crontab:
```bash
* * * * * cd /path-to-sentravax/backend && php artisan schedule:run >> /dev/null 2>&1
```

Or run the scheduler worker in a background daemon process:
```bash
php artisan schedule:work
```

### 6.3 Registered Automated Synchronization Schedules
SENTRAVAX automatically manages multi-hazard feed freshness through configured schedule definitions:
| Schedule Name | Command | Frequency | Protection | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sentravax-sync-cap` | `sentravax:sync-cap` | **Every 5 minutes** (`*/5 * * * *`) | `withoutOverlapping(10)`, `ShouldBeUnique` | Polling and ingesting BMKG CAP alert warnings. |
| `sentravax-sync-inatews` | `sentravax:sync-inatews` | **Every 15 minutes** (`*/15 * * * *`) | `withoutOverlapping(10)`, `ShouldBeUnique` | Polling BMKG InaTEWS rapid earthquake telemetry. |
| `sentravax-sync-sources` | `sentravax:sync-sources` | **Every 30 minutes** (`*/30 * * * *`) | `withoutOverlapping(15)` | Periodic multi-hazard satellite and telemetry sync. |
| `sentravax-prune-failed-jobs` | `queue:prune-failed --hours=168` | Daily at 00:00 | Database cleanup | Pruning failed queue jobs older than 7 days. |

Each queued task uses `SyncDataSourceJob` which implements `ShouldBeUnique` locking per `data_source_id` to guarantee that concurrent duplicates are never scheduled or processed simultaneously.

---

## 7. Database Backup, Health Check & Rollback Procedures

### 7.1 Database Backup
Execute the automated backup command:
```bash
php artisan sentravax:backup
```
Manual PostgreSQL dump:
```bash
pg_dump -h 127.0.0.1 -p 5432 -U postgres -F c -b -v -f "/path/to/backup.sql" sentravax_db
```

### 7.2 Database Restore / Disaster Recovery
To restore from backup:
```bash
pg_restore -h 127.0.0.1 -p 5432 -U postgres -d sentravax_db -v "/path/to/backup.sql"
```

### 7.3 Health Check Monitoring
Verify system status via REST endpoint:
```bash
curl -s http://127.0.0.1:8000/api/v1/health
```
Monitors PostGIS spatial engine, database connection, storage writability, queue status, and latest telemetry sync run.

### 7.4 Safe Deployment Rollback
In case of critical regression:
1. Revert Git tag/commit to previous stable commit.
2. Clear and rebuild cache: `php artisan config:cache && php artisan route:cache && php artisan view:cache`
3. Restart workers: `php artisan queue:restart`
4. If database rollback needed, restore backup before applying any destructive command. Do not use `migrate:fresh` in production.

---

## 8. Running Automated Tests

Verify 100% test passing rate across all domain modules:

```bash
php artisan test
```

Expected result: `Tests: 242 passed, Assertions: 2234+, Status: 100% Success`.

