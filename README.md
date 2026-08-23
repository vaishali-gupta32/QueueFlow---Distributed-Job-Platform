# QueueFlow — Distributed Job Processing & Notification Platform

QueueFlow is a production-grade, distributed asynchronous job processing and notification engine designed for high throughput, reliability, and observability. It decouples API job ingestion from asynchronous task execution using Express, BullMQ, Redis, PostgreSQL (Prisma ORM), independent worker nodes, and an infrastructure dashboard built with Next.js & Tailwind CSS.

---

## 1. Architecture Overview

```text
                  +-----------------------------------+
                  |   Next.js Developer/Admin Web     |
                  |             (Port 3000)           |
                  +-----------------+-----------------+
                                    |
                                    v REST APIs (JWT Auth)
                  +-----------------+-----------------+
                  |      Express API Server           |
                  |             (Port 4000)           |
                  +--------+----------------+---------+
                           |                |
             Persist Jobs  |                | Enqueue Job
             & User Data   v                v
                 +---------+-------+   +----+----+
                 | PostgreSQL DB   |   |  Redis  |
                 |  (Prisma ORM)   |   | Queue   |
                 +---------+-------+   +----+----+
                           ^                |
                           |  Read Job      v Consume Job
                           |  & Update State|
                  +--------+----------------+---------+
                  |       Independent Worker          |
                  |  (Email, Webhook, Report Strategy)|
                  +-----------------------------------+
```

---

## 2. Key Features

- **Asynchronous Job Ingestion**: `POST /api/jobs` persists job state to PostgreSQL and pushes to Redis queue, returning `202 Accepted` in `<300ms`.
- **Strategy Pattern Handlers**: Clean strategy design supporting `EMAIL` (mock SMTP), `WEBHOOK` (HTTP request with SSRF protection & timeouts), and `REPORT` (data aggregation).
- **Exponential Backoff & Retries**: Automatically retries failed jobs with exponential delay (`delay = baseDelay * 2^(attempt - 1)`).
- **Dead-Letter Queue (DLQ)**: Failed jobs exceeding maximum attempts transition to `DEAD_LETTER` state. Admins can inspect and re-queue jobs with 1 click.
- **Worker Heartbeat Monitoring**: Workers periodically ping the registry (every 10s). Dashboard identifies `HEALTHY`, `UNHEALTHY`, or `OFFLINE` workers.
- **Idempotency Support**: `Idempotency-Key` header prevents duplicate job creation.
- **Redis Rate Limiting**: Per-user sliding window rate limiting (default 100 req/min/user).
- **Redis Metrics Caching**: Aggregated stats cached in Redis with a 30s TTL window to eliminate expensive database aggregation queries.
- **OpenAPI / Swagger**: Interactive API docs available at `/api/docs`.
- **Docker & CI/CD**: Complete stack orchestrated via `docker-compose up`, verified with GitHub Actions.

---

## 3. Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons.
- **Backend API**: Node.js, Express.js, TypeScript, Zod, JWT, bcrypt.
- **Worker Engine**: Node.js, BullMQ, ioredis.
- **Database & Storage**: PostgreSQL 15, Prisma ORM, Redis 7.
- **Testing**: Jest, Supertest.
- **DevOps**: Docker, Docker Compose, GitHub Actions CI, Render Blueprint.

---

## 4. Database Schema (Prisma)

- **User**: `id`, `name`, `email`, `passwordHash`, `role` (`USER`, `ADMIN`).
- **Job**: `id`, `userId`, `type` (`EMAIL`, `WEBHOOK`, `REPORT`), `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `RETRYING`, `CANCELLED`, `DEAD_LETTER`), `payload`, `attempts`, `maxAttempts`, `priority`, `idempotencyKey`, timestamps.
- **JobAttempt**: `id`, `jobId`, `attemptNumber`, `status`, `error`, `startedAt`, `completedAt`, `durationMs`.
- **Worker**: `id`, `workerId`, `status` (`HEALTHY`, `UNHEALTHY`, `OFFLINE`), `lastHeartbeat`, `jobsProcessed`, `jobsFailed`.

---

## 5. Job Lifecycle State Machine

```text
               +---------+
               | PENDING |
               +----+----+
                    |
                    v
             +--------------+
             | PROCESSING   |
             +------+-------+
                    |
         +----------+----------+
         |                     |
         v                     v
  +--------------+      +--------------+
  |  COMPLETED   |      |    FAILED    |
  +--------------+      +------+-------+
                               |
                        +------+------+
                        | Attempts <  | Attempts >=
                        | Max?        | Max?
                        v             v
                 +--------------+  +--------------+
                 |   RETRYING   |  | DEAD_LETTER  |
                 +--------------+  +--------------+
```

---

## 6. Quick Start & Local Setup

### Prerequisites
- Node.js >= 20
- Docker & Docker Compose (or local PostgreSQL & Redis)

### Option A: Running with Docker Compose (Recommended)
```bash
# 1. Clone repository
git clone https://github.com/vaishali-gupta32/QueueFlow---Distributed-Job-Platform.git
cd QueueFlow---Distributed-Job-Platform

# 2. Copy environment file
cp .env.example .env

# 3. Start complete distributed stack
docker compose up --build
```
Access the applications:
- **Web Dashboard**: `http://localhost:3000`
- **REST API**: `http://localhost:4000`
- **Swagger Documentation**: `http://localhost:4000/api/docs`

---

### Option B: Running Locally (Node.js)

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL & Redis services in background
docker compose up -d postgres redis

# 3. Generate Prisma client & run migrations
npx prisma migrate dev
npx prisma db seed

# 4. Build shared package & start workspace services
npm run build --workspace=packages/shared

# Run API, Worker, and Web concurrently:
npm run dev
```

---

## 7. Cloud & Production Deployment

### 1-Click Free Hosting on Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect repository `vaishali-gupta32/QueueFlow---Distributed-Job-Platform`.
4. Click **Apply**. Render will automatically provision PostgreSQL, Redis, Express API, Worker Engine, and Next.js Web Frontend using `render.yaml`.

### VPS / Automated Windows Deployment
For 1-click Windows automated build and launch:
```powershell
.\deploy.ps1
```

---

## 8. Seeded Demo Login Credentials

- **Admin Account**: `admin@queueflow.io` / `password123`
- **User Account**: `user@queueflow.io` / `password123`

---

## 9. API Reference Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user | None |
| `POST` | `/api/auth/login` | Authenticate user & get JWT | None |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Bearer JWT |
| `POST` | `/api/jobs` | Enqueue asynchronous job (`202 Accepted`) | Bearer JWT |
| `GET` | `/api/jobs` | List jobs (Paginated, Filtered) | Bearer JWT |
| `GET` | `/api/jobs/:id` | Get job metadata & attempt history | Bearer JWT |
| `POST` | `/api/jobs/:id/cancel` | Cancel pending/retrying job | Bearer JWT |
| `POST` | `/api/jobs/:id/retry` | Re-queue job for execution | Bearer JWT |
| `GET` | `/api/analytics` | Redis cached aggregate metrics | Bearer JWT |
| `GET` | `/api/admin/workers` | Monitor active worker node health | Admin JWT |
| `GET` | `/api/admin/dlq` | List Dead-Letter Queue jobs | Admin JWT |
| `POST` | `/api/admin/jobs/:id/retry` | Re-queue dead-letter job | Admin JWT |
| `GET` | `/health/ready` | Check DB & Redis connectivity | None |

---

## 10. Failure Scenarios & Reliability Design

1. **Worker Process Crash**: BullMQ locks active jobs. If a worker crashes mid-execution, BullMQ's stall detector reclaims the unacknowledged job after timeout and re-assigns it to another active worker node.
2. **PostgreSQL Down**: `/health/ready` reports `503 Service Unavailable`. API fails early instead of acknowledging jobs that cannot be persisted.
3. **Redis Down**: Rate limiter allows requests safely in fallback mode; API queueing reports graceful standard error response.
4. **Non-Idempotent Duplicate Retries**: Handlers implement checking semantics; idempotency middleware rejects duplicate POST requests with matching `Idempotency-Key` headers.

---

## 11. Testing

Run automated unit tests:
```bash
npm run test
```
Tests include:
- `tests/unit/retry.test.ts`: Verifies exponential backoff calculation (`base * 2^(n-1)`).
- `tests/unit/validation.test.ts`: Verifies Zod schemas for job type validation.